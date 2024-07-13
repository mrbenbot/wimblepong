from typing import Any, Type
import json

from stable_baselines3.common.callbacks import EvalCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize
from stable_baselines3 import PPO

from computer_player import ComputerPlayer
from model_player import ModelPlayer
from observation import StandardObserver, Observer
from pong_environment import CustomPongEnv
from path_master import PathMaster
from export import export_model


class CustomEvalCallback(EvalCallback):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _on_step(self) -> bool:
        result = super()._on_step()
        if self.n_calls % self.eval_freq == 0:
            print(f"Evaluation at step {self.n_calls}: mean reward {self.last_mean_reward:.2f}")
        return result


def train_new_model(model_name: str, 
                    hyper_parameters: dict[str, Any], 
                    training_steps=600_000, 
                    parallel_training_environments=4, 
                    phase=None,
                    rewards: Type | None = None) -> tuple[str, int]:
    """
    Trains a new model fresh against the computer
    """
    trained_model_name, trained_model_version = _train(model_name, 
                                                       hyper_parameters, 
                                                       training_steps, 
                                                       parallel_training_environments, 
                                                       phase=phase,
                                                       rewards=rewards)
    export_model(trained_model_name, trained_model_version)
    return trained_model_name, trained_model_version


def train_model_from_model(model_name: str, 
                           hyper_parameters: dict[str, Any], 
                           from_model_name: str, 
                           from_model_version: int | None = None, 
                           training_steps=600_000, 
                           parallel_training_environments=4, 
                           phase=None,
                           rewards: Type | None = None) -> tuple[str, int]:
    """
    Trains a new model fresh against the computer
    """
    trained_model_name, trained_model_version = _train(model_name, 
                                                       hyper_parameters, 
                                                       training_steps, 
                                                       parallel_training_environments, 
                                                       from_model_name, 
                                                       from_model_version, 
                                                       phase=phase,
                                                       rewards=rewards) 
    export_model(trained_model_name, trained_model_version)
    return trained_model_name, trained_model_version


def _train(model_name: str, 
           hyper_parameters: dict[str, Any],
           training_steps: int = 600_000,
           parallel_training_environments: int = 4,
           from_model_name: str | None = None, 
           from_model_version: int | None = None, 
           against_model_name: str | None = None, 
           against_model_version: int | None = None,
           phase: str | None = None,
           observer: Observer | None = None,
           rewards: Type | None = None) -> tuple[str, int]:

    # Paths widget 
    paths = PathMaster()
    model_version = paths.new_model_version(model_name)

    # Find the latest versions for anything that wasn't specified
    if from_model_name is not None and from_model_version is None: 
        from_model_version = paths.latest_model_version(from_model_name)
        if from_model_version is None:
            raise RuntimeError("Tried to continue training from {from_model_name} but no versions of that model were found")

    # And the version for the opponent
    if against_model_name is not None:
        if against_model_version is None:
            against_model_version = paths.latest_model_version(against_model_name)
            if against_model_version is None: 
                raise RuntimeError("Tried to train against opponent {against_model_name} but no versions of that model were found")

    # Default observer if one is not provided
    if observer is None:
        observer = StandardObserver() 

    # are we in create mode or train onwards mode ?
    create_new = from_model_name is None

    # TODO: detect cuda properly 
    has_gpu = True

    if has_gpu:
        target_device = "cuda"
    else:
        target_device = "cpu"

    # save progress at appropriate intervals 
    if training_steps < 10_000_000:
        eval_freq = 10_000
    else:
        eval_freq = 100_000

    # but you need to make sure that you take into account how many training processes you have..
    eval_freq /= parallel_training_environments

    # can train against a previous model if desired, if not then set this to None
    if against_model_name is not None:
        model_path = paths.pytorch_model_file(against_model_name, against_model_version)

        print(f"Loading opponent model from {model_path}")
        opponent_model = PPO.load(model_path)
    else:
        opponent_model = None

    # Load the training environment and ensure it's wrapped with VecNormalize
    if opponent_model is not None: 
        train_env = DummyVecEnv([lambda: Monitor(CustomPongEnv(computer_player=ModelPlayer(opponent_model), observer=observer)) for _ in range(parallel_training_environments)])
    else:
        train_env = DummyVecEnv([lambda: Monitor(CustomPongEnv(computer_player=ComputerPlayer(), observer=observer)) for _ in range(parallel_training_environments)])

    # Load the source model if required 
    if create_new:
        # create training env when creating model
        train_env = VecNormalize(train_env, norm_obs=False, norm_reward=True)
    else:
        # or, load training env when loading model
        train_env = VecNormalize.load(paths.pytorch_training_environment_file(from_model_name, from_model_version), train_env)
    train_env.training = True  # Ensure it's in training mode

    # Create the evaluation environment and wrap it with VecNormalize
    if opponent_model is not None:
        eval_env = DummyVecEnv([lambda: Monitor(CustomPongEnv(computer_player=ModelPlayer(opponent_model), 
                                                              observer=StandardObserver(),
                                                              RewardClass=rewards))])
    else:
        eval_env = DummyVecEnv([lambda: Monitor(CustomPongEnv(computer_player=ComputerPlayer(), 
                                                              observer=StandardObserver(),
                                                              RewardClass=rewards))])

    eval_env = VecNormalize(eval_env, norm_obs=False, norm_reward=False)
    eval_env.training = False  # Ensure it's not in training mode

    # Create the CustomEvalCallback with the evaluation environment
    eval_callback = CustomEvalCallback(eval_env, best_model_save_path=paths.pytorch_intermediate_best_model_path(model_name, model_version),
                                       log_path=paths.pytorch_training_logs_path(model_name, model_version), 
                                       eval_freq=eval_freq,
                                       deterministic=True, render=False)

    # Configure the log location
    hyper_parameters['tensorboard_log'] = paths.tensorboard_log_path(phase)

    # Create a new model
    if create_new:
        model = PPO('MlpPolicy', env=train_env, **hyper_parameters, device=target_device)
    else:
        # or, Load the pre-trained model
        model = PPO.load(paths.pytorch_model_file(from_model_name, from_model_version), env=train_env, **hyper_parameters, force_reset=True, device=target_device)

    # Resume training the model with the callback
    model.learn(total_timesteps=training_steps, tb_log_name=f"{model_name}-{model_version:03d}", callback=eval_callback)

    # Save the model and the normalization statistics
    model.save(paths.pytorch_model_file(model_name, model_version))
    train_env.save(paths.pytorch_training_environment_file(model_name, model_version))

    # and save the Hyper params in case we want to review them later 
    json_filename = paths.hyperparameter_file(model_name, model_version)
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(hyper_parameters, f, ensure_ascii=False, indent=4)

    print("Training completed and logs are saved.")
    return model_name, model_version


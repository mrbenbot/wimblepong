from train import train_new_model, train_model_from_model
from hyperparams import default_hyperparams, random_entropy, more_entropy

from debug_reward import DebugRewardSystem

#hyper_params = default_hyperparams()
#train_new_model("testmod", hyper_params, parallel_training_environments=20)

model_names = ['albert', 'biff', 'charlie', 'dave', 'eddie']
model_names = ['george']

range_max = 2

for model_name in model_names:
    hyper_params = more_entropy() 
    for idx in range(1, range_max + 1):
        print(f"Starting to train new model {model_name} {idx}/{range_max}")
        tmn, tmv = train_new_model(model_name, hyper_params, parallel_training_environments=20, phase="rewards", training_steps=600_000, rewards=DebugRewardSystem)
        print(f"Trained {tmn}-{tmv:03d}")



#train_model_from_model("testmod", hyper_params, from_model_name="testmod", from_model_version=0, parallel_training_environments=8)


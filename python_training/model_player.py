"""
  ModelPlayer is a wrapper that allows a trained model to compete in the environment.
  transform_action maps a model output prediction into an action response that the environment can understand.
"""

from observation import StandardObserver, Observer


def transform_action(action):
    """
    Takes a model prediction in the form of 2 floats and turns them into an action dict that the game environment can understand.
    """
    button_pressed = action[0] > 0.5
    paddle_direction = max(min(action[1], 1), -1)
    actions = {'button_pressed': button_pressed, 'paddle_direction': paddle_direction * 30}
    return actions


class ModelPlayer:
    def __init__(self, model, observer: Observer | None = None):
        """
        observer: if your model is expecting a customised observation function then pass the modified object, else None will get the standard one
        """
        self.model = model
        if observer is None:
            observer = StandardObserver()
        self.observer = observer

    def reset(self):
        return None

    def get_actions(self, player, state):
        # observe the current game state
        observed_state = self.observer.get_observation(state, player)
        # get the model to predict the next move 
        model_prediction = self.model.predict(observed_state)
        first_prediction = model_prediction[0]  # presumably models are expecting to work on lists of inputs and give lists of outputs
        # turn that prediction into something that the game environment can understand
        action_to_take = transform_action(first_prediction)
        return action_to_take



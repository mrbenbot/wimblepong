"""
A module for the observation functions you might be using.
The standard one is called StandardObserver

If you are changing this then you will also need to upload a Javascript equivalent with your model.
"""
import numpy as np
from gymnasium import spaces

from constants import COURT_WIDTH, COURT_HEIGHT


class Observer:
    def get_observation_space(self) -> spaces.Box:
        raise NotImplemented("This is the base class, you should have overridden this")

    def get_observation(self, player, game_state):
        raise NotImplemented("This is the base class, you should have overridden this")


class StandardObserver(Observer):

    def get_observation_space(self) -> spaces.Box:
        return spaces.Box(
            low=np.array([0, 0, -1, -1, 0, 0, 0, 0], dtype=np.float32),
            high=np.array([1, 1, 1, 1, 1, 1, 1, 1], dtype=np.float32)
        )

    def get_observation(self, player, game_state):
        is_server = 1 if game_state['server'] == player else 0
        paddle = game_state['paddles'][player]
        return np.array([
            float(game_state['ball']['x'] / COURT_WIDTH),
            float(game_state['ball']['y'] / COURT_HEIGHT),
            float(game_state['ball']['dx'] / 40),
            float(game_state['ball']['dy'] / 40),
            float(0 if paddle['x'] < COURT_WIDTH / 2 else 1),
            float(paddle['y'] / COURT_HEIGHT),
            float(int(game_state['ball']['serve_mode'])),
            float(int(is_server)),
        ], dtype=np.float32)


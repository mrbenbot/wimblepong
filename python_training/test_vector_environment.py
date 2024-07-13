# Create and test vectorised environment

import numpy as np 
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize

from computer_player import ComputerPlayer
from observation import StandardObserver
from pong_environment import CustomPongEnv


# Create a vectorized environment
env = DummyVecEnv([lambda: CustomPongEnv(computer_player=ComputerPlayer(), observer=StandardObserver()) for _ in range(1)])  # Adjust number of instances as needed
env = VecNormalize(env, norm_obs=False, norm_reward=True)  # Normalize observations and rewards

obs = env.reset()
print("Initial observation:", obs)
i = 0
while True:
    i += 1
    action = env.action_space.sample()  # Sample random action
    print("Action taken:", action)
    obs, reward, done, info = env.step([action for _ in range(1)])
    print("Observation:", obs)
    print("Reward:", reward)
    print('iteration:', i)
    print("Done:", done)
    if np.any(done):
        obs = env.reset()
        break

env.close()


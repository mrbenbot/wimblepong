from stable_baselines3.common.monitor import Monitor

from computer_player import ComputerPlayer
from pong_environment import CustomPongEnv
from observation import StandardObserver

# Create and test single environment
env = Monitor(CustomPongEnv(computer_player=ComputerPlayer(), observer=StandardObserver()))

obs = env.reset()
print("Initial observation:", obs)
i = 0
while True:
    i += 1
    action = env.action_space.sample()  # Sample random action
    obs, reward, done, info, _ = env.step(action)
    print("Action taken:", action)
    print("Observation:", obs)
    print("Reward:", reward)
    print('iteration:', i)
    print("Done:", done)
    env.render()
    if done:
        obs = env.reset()
        print("Environment reset")
        break

env.close()


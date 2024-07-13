"""
Custom Pong Environment Class¶
Define a custom gym environment for the Pong game. This environment will interface with the stable-baselines3 library for training the reinforcement learning model.
"""
from typing import Type

import gymnasium as gym
from gymnasium import spaces
import numpy as np
import os
import pygame
from moviepy.editor import ImageSequenceClip

from constants import COURT_HEIGHT, COURT_WIDTH
from observation import Observer
from pong import PongGame
from reward import DefaultRewardSystem
from model_player import transform_action


class CustomPongEnv(gym.Env):
    def __init__(self, computer_player, observer: Observer, RewardClass: Type | None = None):
        super(CustomPongEnv, self).__init__()

        self.action_space = spaces.Box(low=np.array([0, -1]), high=np.array([1, 1]), dtype=np.float32)
        self.observation_space = observer.get_observation_space()
        self.observer = observer
        self.starting_states = [
            {'server': 1, 'positions_reversed': False, 'opponent': 1, 'player': 2},
            {'server': 2, 'positions_reversed': False, 'opponent': 1, 'player': 2},
            {'server': 2, 'positions_reversed': True, 'opponent': 1, 'player': 2},
            {'server': 1, 'positions_reversed': True, 'opponent': 1, 'player': 2},
            {'server': 1, 'positions_reversed': False, 'opponent': 2, 'player': 1},
            {'server': 2, 'positions_reversed': False, 'opponent': 2, 'player': 1},
            {'server': 2, 'positions_reversed': True, 'opponent': 2, 'player': 1},
            {'server': 1, 'positions_reversed': True, 'opponent': 2, 'player': 1},
        ]
        self.starting_state_index = 0

        self.computer_player = computer_player
        self.screen = None
        self.frame_count = 0
        self.last_event = None

        if RewardClass is None: 
            RewardClass = DefaultRewardSystem
        self.RewardClass = RewardClass

        self.reset(seed=0)

    def seed(self, seed=None):
        self.np_random, seed = gym.utils.seeding.np_random(seed)
        return [seed]

    def reset(self, seed=None):
        super().reset(seed=seed)
        if seed is not None:
            self.seed(seed)
        self.starting_state_index = (self.starting_state_index + 1) % len(self.starting_states)
        starting_state = self.starting_states[self.starting_state_index]

        server = starting_state['server']
        positions_reversed = starting_state['positions_reversed']
        player = starting_state['player']
        opponent = starting_state['opponent']

        self.computer_player.reset()
        self.game = PongGame(server=server, positions_reversed=positions_reversed, opponent=opponent, player=player)
        self.reward_system = self.RewardClass(rewarded_player=player)
        self.step_count = 0

        return self._get_obs(), {}

    def step(self, action):
        self.step_count += 1
        self.reward_system.reset()

        model_player_actions = transform_action(action)
        computer_player_actions = self.computer_player.get_actions(self.game.game_state['opponent'], self.game.game_state)
        actions = {self.game.game_state['opponent']: computer_player_actions, self.game.game_state['player']: model_player_actions}
        terminated = self.game.update_game_state(actions, 3, self.reward_system)
        obs = self._get_obs()
        info = {}
        truncated = False
        if self.step_count > 1000:
            self.reward_system.end_episode(self.game.game_state['player'], self.game.game_state)
            terminated = True

        reward = self.reward_system.total_reward
        return obs, reward, terminated, truncated, info

    def _get_obs(self):
        state = self.game.game_state
        player = state['player']
        return self.observer.get_observation(player, state)

    def render(self, mode='human', close=False):
        if close:
            if pygame.get_init():
                pygame.quit()
            return

        if self.screen is None:
            pygame.init()
            self.screen = pygame.display.set_mode((COURT_WIDTH, COURT_HEIGHT))
        if not os.path.exists('./frames'):
            os.makedirs("./frames")

        # Clear screen
        self.screen.fill((255, 255, 255))  # Fill with white background
        state = self.game.game_state
        # Render paddles
        paddle1 = state['paddles'][1]
        paddle2 = state['paddles'][2]
        pygame.draw.rect(self.screen, paddle1['colour'], (paddle1['x'], paddle1['y'], paddle1['width'], paddle1['height']))
        pygame.draw.rect(self.screen, paddle2['colour'], (paddle2['x'], paddle2['y'], paddle2['width'], paddle2['height']))

        # Render ball
        ball = state['ball']
        pygame.draw.circle(self.screen, (0, 0, 0), (ball['x'], ball['y']), ball['radius'])

        # Update the display
        pygame.display.flip()

        # Save frame as image
        frame_path = f'./frames/frame_{self.frame_count:04d}.png'
        pygame.image.save(self.screen, frame_path)
        self.frame_count += 1

    def close(self):
        if not os.path.exists('./frames'):
            print("No frames directory found, skipping video creation.")
            return
        image_files = [f"./frames/frame_{i:04d}.png" for i in range(self.frame_count)]

        # Create a video clip from the image sequence
        clip = ImageSequenceClip(image_files, fps=24)  # 24 frames per second

        # Write the video file
        clip.write_videofile("./game_video.mp4", codec="libx264")
        pygame.quit()
        frames_dir = "./frames"
        if os.path.exists(frames_dir):
            for filename in os.listdir(frames_dir):
                file_path = os.path.join(frames_dir, filename)
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            os.rmdir(frames_dir)



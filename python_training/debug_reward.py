"""
The debug version
"""


class DebugRewardSystem:
    def __init__(self, rewarded_player):
        self.rewarded_player = rewarded_player
        self.total_reward = 0
        self.step_count = 0

    def reset(self):
        self.total_reward = 0
        self.step_count += 1

    def pre_serve_reward(self, player, game_state):
        if player == self.rewarded_player:
            self.total_reward -= 0.05
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 1 ")

    def serve_reward(self, player, game_state):
        if player == self.rewarded_player:
            ball = game_state['ball']
            reward = abs(ball['dy']) * abs(ball['dy']) - 30
            self.total_reward += reward
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 2 ")

    def hit_paddle_reward(self, player, game_state):
        if player == self.rewarded_player:
            reward = 50
            # reward = 50 + abs(game_state[player]['dy'])
            self.total_reward += reward
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 3 ")

    def conceed_point_reward(self, player, game_state):
        if player == self.rewarded_player:
            punishment = abs(game_state['ball']['y'] - (game_state['paddles'][player]['y'] + game_state['paddles'][player]['height'])) / 8
            self.total_reward -= punishment
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 4 ")

    def score_point_reward(self, player, game_state):
        if player == self.rewarded_player:
            reward = 200
            self.total_reward += reward
            print(f"score_point_reward for us!")
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 5 ")
            print(f"score_point_reward for the other fella")

    def paddle_movement_reward(self, player, game_state):
        if player == self.rewarded_player:
            reward = 0
            self.total_reward += reward
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 6 ")

    def end_episode(self, player, game_state):
        if player == self.rewarded_player:
            if game_state['ball']['serve_mode'] and player == game_state['server']:
                print(f"Ended episode by subtracting 200")
                self.total_reward -= 200
            else:
                print(f"Ended episode by adding 200")
                self.total_reward += 200
        else:
            print("!!!!!!!!!!!!!!!!!!!!!!!! ELSE HIT 7 ")


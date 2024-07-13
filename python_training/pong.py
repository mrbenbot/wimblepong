"""
  The main PongGame class which runs the simulation of the game
"""
import random
import math
from constants import PADDLE_GAP, COURT_HEIGHT, PADDLE_HEIGHT, PADDLE_WIDTH, COURT_WIDTH, INITIAL_BALL_SPEED, BALL_RADIUS, PLAYER_COLOURS, SERVING_HEIGHT_MULTIPLIER, PADDLE_SPEED_DIVISOR, PADDLE_CONTACT_SPEED_BOOST_DIVISOR, SPEED_INCREMENT, PLAYER_COLOURS


def _get_bounce_angle(paddle_y, paddle_height, ball_y):
    relative_intersect_y = (paddle_y + (paddle_height / 2)) - ball_y
    normalized_relative_intersect_y = relative_intersect_y / (paddle_height / 2)
    return normalized_relative_intersect_y * (math.pi / 4)


class PongGame:
    def __init__(self, server: int, positions_reversed: bool, player, opponent):
        self.game_state = {
            'server': server,
            'positions_reversed': positions_reversed,
            'player': player,
            'opponent': opponent,
            'paddles': {
                1: {
                    'x': PADDLE_GAP, 
                    'y': COURT_HEIGHT // 2 - PADDLE_HEIGHT // 2, 
                    'dy': 0, 
                    'width': PADDLE_WIDTH, 
                    'height': PADDLE_HEIGHT, 
                    'colour': PLAYER_COLOURS[1]
                },
                2: {
                    'x': COURT_WIDTH - PADDLE_WIDTH - PADDLE_GAP, 
                    'y': COURT_HEIGHT // 2 - PADDLE_HEIGHT // 2, 
                    'dy': 0, 
                    'width': PADDLE_WIDTH, 
                    'height': PADDLE_HEIGHT, 
                    'colour': PLAYER_COLOURS[2]
                },
            },
            'ball': {
                'x': COURT_WIDTH // 2, 
                'y': COURT_HEIGHT // 2, 
                'dx': INITIAL_BALL_SPEED, 
                'dy': INITIAL_BALL_SPEED, 
                'radius': BALL_RADIUS, 
                'speed': INITIAL_BALL_SPEED, 
                'serve_mode': True, 
                'score_mode': False, 
                'score_mode_timeout': 0
            },
            'stats': {
                'rally_length': 0, 
                'serve_speed': INITIAL_BALL_SPEED, 
                'server': server
            }
        }
        self.apply_meta_game_state()

    def apply_meta_game_state(self):
        game_state = self.game_state
        serving_player = game_state['server']
        positions_reversed = game_state['positions_reversed']
        if serving_player == 1:
            self.game_state['paddles'][1]['height'] = PADDLE_HEIGHT * SERVING_HEIGHT_MULTIPLIER
            self.game_state['paddles'][2]['height'] = PADDLE_HEIGHT
        else:
            self.game_state['paddles'][1]['height'] = PADDLE_HEIGHT
            self.game_state['paddles'][2]['height'] = PADDLE_HEIGHT * SERVING_HEIGHT_MULTIPLIER
        if positions_reversed:
            self.game_state['paddles'][1]['x'] = COURT_WIDTH - PADDLE_WIDTH - PADDLE_GAP
            self.game_state['paddles'][2]['x'] = PADDLE_GAP
            self.game_state['paddles'][1]['y'] = random.randint(0, COURT_HEIGHT)
            self.game_state['paddles'][2]['y'] = random.randint(0, COURT_HEIGHT)
        else:
            self.game_state['paddles'][1]['x'] = PADDLE_GAP
            self.game_state['paddles'][2]['x'] = COURT_WIDTH - PADDLE_WIDTH - PADDLE_GAP
        ball = self.game_state['ball']
        server_is_left = (serving_player == 1 and not positions_reversed) or (serving_player == 2 and positions_reversed)
        ball['y'] = self.game_state['paddles'][serving_player]['height'] / 2 + self.game_state['paddles'][serving_player]['y']
        if server_is_left:
            ball['x'] = self.game_state['paddles'][serving_player]['width'] + ball['radius'] + PADDLE_GAP 
        else:
            ball['x'] = COURT_WIDTH - self.game_state['paddles'][serving_player]['width'] - ball['radius'] - PADDLE_GAP

        ball['speed'] = INITIAL_BALL_SPEED
        ball['serve_mode'] = True
        ball['score_mode'] = False
        ball['score_mode_timeout'] = 0
        self.game_state['stats']['rally_length'] = 0

    def update_game_state(self, actions, delta_time, reward_system):
        game_state = self.game_state
        ball = game_state['ball']
        stats = game_state['stats']
        server = game_state['server']

        paddle_left = game_state['paddles'][1]
        paddle_right = game_state['paddles'][2]
        if game_state['positions_reversed']:
            paddle_left, paddle_right = paddle_right, paddle_left

        player_is_left = (game_state['player'] == 1 and not game_state['positions_reversed']) or (game_state['player'] == 2 and game_state['positions_reversed'])

        if ball['score_mode']:
            return True
        elif ball['serve_mode']:
            serving_from_left = (server == 1 and not game_state['positions_reversed']) or (server == 2 and game_state['positions_reversed'])

            if player_is_left == serving_from_left:
                reward_system.pre_serve_reward(server, game_state)

            if actions[server]['button_pressed']:
                ball['speed'] = INITIAL_BALL_SPEED
                ball['dx'] = INITIAL_BALL_SPEED if serving_from_left else -INITIAL_BALL_SPEED
                ball['serve_mode'] = False
                stats['rally_length'] += 1
                stats['serve_speed'] = abs(ball['dy']) + abs(ball['dx'])
                stats['server'] = server

                if player_is_left == serving_from_left:
                    reward_system.serve_reward(server, game_state)

            ball['dy'] = (game_state['paddles'][server]['y'] + game_state['paddles'][server]['height'] / 2 - ball['y']) / PADDLE_SPEED_DIVISOR
            ball['y'] += ball['dy'] * delta_time
        else:
            ball['x'] += ball['dx'] * delta_time
            ball['y'] += ball['dy'] * delta_time
            if ball['y'] - ball['radius'] < 0:
                ball['dy'] = -ball['dy']
                ball['y'] = ball['radius']
            elif ball['y'] + ball['radius'] > COURT_HEIGHT:
                ball['dy'] = -ball['dy']
                ball['y'] = COURT_HEIGHT - ball['radius']
            if ball['x'] - ball['radius'] < paddle_left['x'] + paddle_left['width'] and ball['y'] + ball['radius'] > paddle_left['y'] and ball['y'] - ball['radius'] < paddle_left['y'] + paddle_left['height']:
                bounce_angle = _get_bounce_angle(paddle_left['y'], paddle_left['height'], ball['y'])
                ball['dx'] = (ball['speed'] + abs(paddle_left['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * math.cos(bounce_angle)
                ball['dy'] = (ball['speed'] + abs(paddle_left['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -math.sin(bounce_angle)
                ball['x'] = paddle_left['x'] + paddle_left['width'] + ball['radius']
                ball['speed'] += SPEED_INCREMENT
                stats['rally_length'] += 1

                if paddle_left == game_state['player']:
                    reward_system.hit_paddle_reward(self.game_state['player'], game_state)

            elif ball['x'] + ball['radius'] > paddle_right['x'] and ball['y'] + ball['radius'] > paddle_right['y'] and ball['y'] - ball['radius'] < paddle_right['y'] + paddle_right['height']:
                bounce_angle = _get_bounce_angle(paddle_right['y'], paddle_right['height'], ball['y'])
                ball['dx'] = -(ball['speed'] + abs(paddle_right['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * math.cos(bounce_angle)
                ball['dy'] = (ball['speed'] + abs(paddle_right['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -math.sin(bounce_angle)
                ball['x'] = paddle_right['x'] - ball['radius']
                ball['speed'] += SPEED_INCREMENT
                stats['rally_length'] += 1

                if paddle_right == game_state['player']:
                    reward_system.hit_paddle_reward(self.game_state['player'], game_state)

            if ball['x'] - ball['radius'] < 0:
                ball['score_mode'] = True

                if player_is_left:
                    reward_system.conceed_point_reward(self.game_state['player'], game_state)
                else:
                    reward_system.score_point_reward(self.game_state['player'], game_state)

            elif ball['x'] + ball['radius'] > COURT_WIDTH:
                ball['score_mode'] = True

                if not player_is_left:
                    reward_system.conceed_point_reward(self.game_state['player'], game_state)
                else:
                    reward_system.score_point_reward(self.game_state['player'], game_state)

        if game_state['positions_reversed']:
            game_state['paddles'][1]['dy'] = actions[1]['paddle_direction']
            game_state['paddles'][2]['dy'] = -actions[2]['paddle_direction']
        else:
            game_state['paddles'][1]['dy'] = -actions[1]['paddle_direction']
            game_state['paddles'][2]['dy'] = actions[2]['paddle_direction']

        game_state['paddles'][1]['y'] += game_state['paddles'][1]['dy'] * delta_time
        game_state['paddles'][2]['y'] += game_state['paddles'][2]['dy'] * delta_time

        if paddle_left['y'] < 0:
            paddle_left['y'] = 0
        if paddle_left['y'] + paddle_left['height'] > COURT_HEIGHT:
            paddle_left['y'] = COURT_HEIGHT - paddle_left['height']
        if paddle_right['y'] < 0:
            paddle_right['y'] = 0
        if paddle_right['y'] + paddle_right['height'] > COURT_HEIGHT:
            paddle_right['y'] = COURT_HEIGHT - paddle_right['height']

        reward_system.paddle_movement_reward(self.game_state['player'], game_state)
        return False


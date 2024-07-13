"""
The ComputerPlayer provided to train models against.
"""
import random

from constants import PADDLE_HEIGHT, MAX_COMPUTER_PADDLE_SPEED, COURT_HEIGHT, MIN_COMPUTER_SERVE_DELAY, MAX_COMPUTER_SERVE_DELAY


def _bounded_value(value, min_value, max_value):
    return max(min_value, min(max_value, value))


class ComputerPlayer:
    def __init__(self):
        self.reset()

    def reset(self):
        """
        Initialise the player to some sensible values, this is called before each point
        """
        # how many moves will we make before serving ?
        self.serve_delay = random.randint(MIN_COMPUTER_SERVE_DELAY, MAX_COMPUTER_SERVE_DELAY)
        self.direction = random.randint(-MAX_COMPUTER_PADDLE_SPEED, MAX_COMPUTER_PADDLE_SPEED)
        # offset appears to be where along the paddle we try to hit the ball
        self.offset = random.randint(-int(PADDLE_HEIGHT / 2), int(PADDLE_HEIGHT / 2))
        self.serve_delay_counter = 0
        self.max_speed = MAX_COMPUTER_PADDLE_SPEED

    def get_actions(self, player_no: int, state):
        # decide if we're playing on the left or the right 
        is_left = (player_no == 1 and not state['positions_reversed']) or (player_no == 2 and state['positions_reversed'])

        # we use the ball state a lot, so grab that..
        ball_state = state['ball']
        ball_y = ball_state['y']

        # We do nothing in score_mode
        if ball_state['score_mode']:
            return {'button_pressed': False, 'paddle_direction': 0}

        # get the current state for this paddle
        paddle = state['paddles'][player_no]
        paddle_y = paddle['y']
        paddle_height = paddle['height']

        # Handle serving
        if ball_state['serve_mode']:
            # if we have gone off the end of the screen, head back the other way
            if paddle_y <= 0 or paddle_y + paddle_height >= COURT_HEIGHT:
                self.direction = -self.direction

            # have we reached our pre-determined serve delay ?
            if self.serve_delay_counter > self.serve_delay:
                return {'button_pressed': True, 'paddle_direction': self.direction}
            else:
                self.serve_delay_counter += 1
                return {'button_pressed': False, 'paddle_direction': self.direction}

        # Ok, not serving - regular play - so no need to press the button
        button_press = False

        # head towards the ball
        paddle_direction = paddle_y + self.offset - ball_y + paddle_height / 2

        # make sure that the max speed is respected
        paddle_direction = _bounded_value(paddle_direction, -MAX_COMPUTER_PADDLE_SPEED, MAX_COMPUTER_PADDLE_SPEED)

        # flip the direction if we're on the left-side of the screen
        if is_left:
            paddle_direction = -paddle_direction

        # and make the move
        return {'button_pressed': button_press, 'paddle_direction': paddle_direction}




# Define constants based on your game's settings
COURT_HEIGHT = 800
COURT_WIDTH = 1200
PADDLE_HEIGHT = 90
PADDLE_WIDTH = 15
BALL_RADIUS = 12
INITIAL_BALL_SPEED = 10
PADDLE_SPEED_DIVISOR = 15  # Example value, adjust as needed
PADDLE_CONTACT_SPEED_BOOST_DIVISOR = 4  # Example value, adjust as needed
SPEED_INCREMENT = 0.6  # Example value, adjust as needed
SERVING_HEIGHT_MULTIPLIER = 2  # Example value, adjust as needed
PLAYER_COLOURS = {'Player1': 'blue', 'Player2': 'red'}
MAX_COMPUTER_PADDLE_SPEED = 10

class Player:
    Player1 = 'Player1'
    Player2 = 'Player2'

class PlayerPositions:
    Initial = 'Initial'
    Reversed = 'Reversed'

class GameEventType:
    ResetBall = 'ResetBall'
    Serve = 'Serve'
    WallContact = 'WallContact'
    HitPaddle = 'HitPaddle'
    ScorePointLeft = 'ScorePointLeft'
    ScorePointRight = 'ScorePointRight'

def get_bounce_angle(paddle_y, paddle_height, ball_y):
    relative_intersect_y = (paddle_y + (paddle_height / 2)) - ball_y
    normalized_relative_intersect_y = relative_intersect_y / (paddle_height / 2)
    return normalized_relative_intersect_y * ( math.pi / 4)

class CustomPongEnv(gym.Env):
    def __init__(self):
        super(CustomPongEnv, self).__init__()

        # Define action space: [buttonPressed, paddleDirection]
        self.action_space = spaces.Tuple((spaces.Discrete(2), spaces.Box(low=-60, high=60, shape=(1,), dtype=np.float32)))

        # Observations: Ball and paddle positions and velocities, serve and score mode flags, and rally length
        self.observation_space = spaces.Box(
            low=np.array([0, 0, -np.inf, -np.inf, 0, 0, -np.inf, 0, 0, -np.inf, 0, 0, 0], dtype=np.float32),
            high=np.array([COURT_WIDTH, COURT_HEIGHT, np.inf, np.inf, COURT_WIDTH, COURT_HEIGHT, np.inf, COURT_WIDTH, COURT_HEIGHT, np.inf, 1, 1, 1], dtype=np.float32)
        )

        # Define the possible star

        # Define the possible starting states
        self.starting_states = [
           {'server': Player.Player1, 'positions_reversed': False, 'computer': Player.Player2},
           {'server': Player.Player1, 'positions_reversed': True, 'computer': Player.Player2},
           {'server': Player.Player2, 'positions_reversed': False, 'computer': Player.Player2},
           {'server': Player.Player2, 'positions_reversed': True, 'computer': Player.Player2},
           {'server': Player.Player2, 'positions_reversed': False, 'computer': Player.Player1},
           {'server': Player.Player2, 'positions_reversed': True, 'computer': Player.Player1},
           {'server': Player.Player1, 'positions_reversed': False, 'computer': Player.Player1},
           {'server': Player.Player1, 'positions_reversed': True, 'computer': Player.Player1},
        ]


        self.serve_delay = 50
        self.serve_delay_counter = 0
        self.direction = 15
        self.is_done = False
        self.frame_count = 0

        self.last_event = None

        # Initialize the game state
        self.reset(0)

    def reset(self, seed):
        # Select a random starting state
        starting_state = np.random.choice(self.starting_states)

        # Set the server, positions, and computer player based on the starting state
        server = starting_state['server']
        positions_reversed = starting_state['positions_reversed']
        computer = starting_state['computer']

        # Initialize the game state
        self.state = {
            'server': server,
            'positionsReversed': positions_reversed,
            'computer': computer,
            'paddle1': {'x': 0, 'y': COURT_HEIGHT // 2 - PADDLE_HEIGHT // 2, 'dy': 0, 'width': PADDLE_WIDTH, 'height': PADDLE_HEIGHT, 'colour': 'blue'},
            'paddle2': {'x': COURT_WIDTH - PADDLE_WIDTH, 'y': COURT_HEIGHT // 2 - PADDLE_HEIGHT // 2, 'dy': 0, 'width': PADDLE_WIDTH, 'height': PADDLE_HEIGHT, 'colour': 'red'},
            'ball': {'x': COURT_WIDTH // 2, 'y': COURT_HEIGHT // 2, 'dx': INITIAL_BALL_SPEED, 'dy': INITIAL_BALL_SPEED, 'radius': BALL_RADIUS, 'speed': INITIAL_BALL_SPEED, 'serveMode': True, 'scoreMode': False, 'scoreModeTimeout': 0},
            'stats': {'rallyLength': 0, 'serveSpeed': INITIAL_BALL_SPEED, 'server': server}
        }
        self.is_done = False

        # Apply the meta game state adjustments
        self.apply_meta_game_state(self.state, server, PlayerPositions.Reversed if positions_reversed else PlayerPositions.Initial)

        # Extract necessary game state variables
        ball = self.state['ball']
        stats = self.state['stats']
        paddle1 = self.state['paddle1']
        paddle2 = self.state['paddle2']
        positions_reversed = self.state['positionsReversed']
        server = self.state['server']

        # Apply provided logic
        left = (server == Player.Player1 and not positions_reversed) or (server == Player.Player2 and positions_reversed)
        ball['y'] = paddle1['height'] / 2 + paddle1['y'] if left else paddle2['height'] / 2 + paddle2['y']
        ball['x'] = paddle1['width'] + ball['radius'] if left else COURT_WIDTH - paddle2['width'] - ball['radius']
        ball['speed'] = INITIAL_BALL_SPEED
        ball['serveMode'] = True
        ball['scoreMode'] = False
        ball['scoreModeTimeout'] = 0
        stats['rallyLength'] = 0

        # Initialize frame count and ensure frames directory exists
        self.frame_count = 0
        if not os.path.exists('frames'):
            os.makedirs('frames')
        print(self.state)
        return self._get_obs()

    def apply_meta_game_state(self, game_state, serving_player, player_positions):
        positions_reversed = player_positions == PlayerPositions.Reversed

        game_state['server'] = serving_player
        game_state['positionsReversed'] = positions_reversed

        # Set paddle heights
        if ((serving_player == Player.Player1 and not positions_reversed) or
                (serving_player == Player.Player2 and positions_reversed)):
            game_state['paddle1']['height'] = PADDLE_HEIGHT * SERVING_HEIGHT_MULTIPLIER
            game_state['paddle2']['height'] = PADDLE_HEIGHT
        else:
            game_state['paddle1']['height'] = PADDLE_HEIGHT
            game_state['paddle2']['height'] = PADDLE_HEIGHT * SERVING_HEIGHT_MULTIPLIER

        # Set paddle colours
        if positions_reversed:
            game_state['paddle1']['colour'] = PLAYER_COLOURS[Player.Player2]
            game_state['paddle2']['colour'] = PLAYER_COLOURS[Player.Player1]
        else:
            game_state['paddle1']['colour'] = PLAYER_COLOURS[Player.Player1]
            game_state['paddle2']['colour'] = PLAYER_COLOURS[Player.Player2]

    def step(self, action):
        computer_player_actions = self.get_computer_player_actions(self.state['computer'])
        # model_player_actions = self.get_computer_player_actions(Player.Player2 if self.state['computer'] == Player.Player1 else Player.Player1)
        buttonPressed, paddleDirection = action
        model_player_actions = {'buttonPressed': buttonPressed, 'paddleDirection': paddleDirection.item()}
        (left_player, right_player) = (Player.Player2, Player.Player1) if self.state['positionsReversed'] else (Player.Player1, Player.Player2)
        regular_positions = self.state['computer'] == left_player

        left_actions, right_actions = (computer_player_actions, model_player_actions) if regular_positions else (model_player_actions, computer_player_actions)

        prev_ball_x = self.state['ball']['x']
        self.update_game_state(
            self.state, left_actions, right_actions,
            self.state['server'], self.state['positionsReversed'], 0.8, self.fire_event
        )

        obs = self._get_obs()
        reward = self.calculate_reward(prev_ball_x, left_player)
        done = self.check_done()
        info = {}
        return obs, reward, done, info

    def update_game_state(self, game_state, left_player_actions, right_player_actions, serving_player, positions_reversed, delta_time, fire_event):
        reward = 0
        ball = game_state['ball']
        paddle1 = game_state['paddle1']
        paddle2 = game_state['paddle2']
        stats = game_state['stats']

        if ball['scoreMode']:
            if ball['scoreModeTimeout'] < 50:
                ball['scoreModeTimeout'] += delta_time
            else:
                fire_event(GameEventType.ResetBall)
        elif ball['serveMode']:
            if (serving_player == Player.Player1 and not positions_reversed) or (serving_player == Player.Player2 and positions_reversed):
                ball['dy'] = (paddle1['y'] + paddle1['height'] / 2 - ball['y']) / PADDLE_SPEED_DIVISOR
                ball['x'] = paddle1['width'] + ball['radius']
                if left_player_actions['buttonPressed']:
                    ball['speed'] = INITIAL_BALL_SPEED
                    ball['dx'] = INITIAL_BALL_SPEED
                    ball['serveMode'] = False
                    fire_event(GameEventType.Serve)
            else:
                ball['dy'] = (paddle2['y'] + paddle2['height'] / 2 - ball['y']) / PADDLE_SPEED_DIVISOR
                ball['x'] = COURT_WIDTH - paddle2['width'] - ball['radius']
                if right_player_actions['buttonPressed']:
                    ball['speed'] = INITIAL_BALL_SPEED
                    ball['dx'] = -INITIAL_BALL_SPEED
                    ball['serveMode'] = False
                    fire_event(GameEventType.Serve)
            ball['y'] += ball['dy'] * delta_time
        else:
            ball['x'] += ball['dx'] * delta_time
            ball['y'] += ball['dy'] * delta_time

            # Check for collisions with top and bottom walls
            if ball['y'] - ball['radius'] < 0:
                ball['dy'] = -ball['dy']
                ball['y'] = ball['radius']  # Adjust ball position to avoid sticking
                fire_event(GameEventType.WallContact)
            elif ball['y'] + ball['radius'] > COURT_HEIGHT:
                ball['dy'] = -ball['dy']
                ball['y'] = COURT_HEIGHT - ball['radius']  # Adjust ball position to avoid sticking
                fire_event(GameEventType.WallContact)

            # Update ball collision detection and response
            if ball['x'] - ball['radius'] < paddle1['x'] + paddle1['width'] and ball['y'] + ball['radius'] > paddle1['y'] and ball['y'] - ball['radius'] < paddle1['y'] + paddle1['height']:
                bounce_angle = get_bounce_angle(paddle1['y'], paddle1['height'], ball['y'])
                ball['dx'] = (ball['speed'] + abs(paddle1['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * math.cos(bounce_angle)
                ball['dy'] = (ball['speed'] + abs(paddle1['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -math.sin(bounce_angle)
                ball['x'] = paddle1['x'] + paddle1['width'] + ball['radius']  # Adjust ball position to avoid sticking
                ball['speed'] += SPEED_INCREMENT
                stats['rallyLength'] += 1
                fire_event(GameEventType.HitPaddle)
            elif ball['x'] + ball['radius'] > paddle2['x'] and ball['y'] + ball['radius'] > paddle2['y'] and ball['y'] - ball['radius'] < paddle2['y'] + paddle2['height']:
                bounce_angle = get_bounce_angle(paddle2['y'], paddle2['height'], ball['y'])
                ball['dx'] = -(ball['speed'] + abs(paddle2['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * math.cos(bounce_angle)
                ball['dy'] = (ball['speed'] + abs(paddle2['dy']) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -math.sin(bounce_angle)
                ball['x'] = paddle2['x'] - ball['radius']  # Adjust ball position to avoid sticking
                ball['speed'] += SPEED_INCREMENT
                stats['rallyLength'] += 1
                fire_event(GameEventType.HitPaddle)

            # Check for scoring
            if ball['x'] - ball['radius'] < 0:
                fire_event(GameEventType.ScorePointLeft)
                ball['scoreMode'] = True
            elif ball['x'] + ball['radius'] > COURT_WIDTH:
                fire_event(GameEventType.ScorePointRight)
                ball['scoreMode'] = True

        paddle1['dy'] = -left_player_actions['paddleDirection']
        paddle1['y'] += paddle1['dy'] * delta_time

        paddle2['dy'] = right_player_actions['paddleDirection']
        paddle2['y'] += paddle2['dy'] * delta_time

        # Ensure paddles stay within screen bounds
        if paddle1['y'] < 0:
            paddle1['y'] = 0
        if paddle1['y'] + paddle1['height'] > COURT_HEIGHT:
            paddle1['y'] = COURT_HEIGHT - paddle1['height']

        if paddle2['y'] < 0:
            paddle2['y'] = 0
        if paddle2['y'] + paddle2['height'] > COURT_HEIGHT:
            paddle2['y'] = COURT_HEIGHT - paddle2['height']

        # Update stats during a serve
        if ball['serveMode'] and (left_player_actions['buttonPressed'] or right_player_actions['buttonPressed']):
            stats['rallyLength'] += 1
            stats['serveSpeed'] = abs(ball['dy']) + abs(ball['dx'])
            stats['server'] = serving_player

    def fire_event(self, event_type):
        if event_type == GameEventType.ScorePointLeft or event_type == GameEventType.ScorePointRight:
          self.is_done = True
        # Handle game events (e.g., reset ball position, serve, etc.)
        pass

    def get_computer_player_actions(self, player):
        state = self.state
        is_left = (player == Player.Player1 and not state['positionsReversed']) or (player == Player.Player2 and state['positionsReversed'])
        if state['ball']['scoreMode']:
            self.serve_delay_counter = 0
            self.direction = 30 * np.random.rand()
            self.serve_delay = 100 * np.random.rand()
            self.direction = self.direction if np.random.rand() > 0.5 else -self.direction
            return {'buttonPressed': False, 'paddleDirection': 0}

        if state['ball']['serveMode']:
            paddle = state['paddle2'] if is_left else state['paddle1']
            if paddle['y'] <= 0 or paddle['y'] + paddle['height'] >= COURT_HEIGHT:
                self.direction = -self.direction
            if self.serve_delay_counter > self.serve_delay:
                return {'buttonPressed': True, 'paddleDirection': self.direction}
            else:
                self.serve_delay_counter += 1
                return {'buttonPressed': False, 'paddleDirection': self.direction}


        if is_left:
          return {
              'buttonPressed': False,
              'paddleDirection': self.bounded_value(
                  state['paddle1']['y'] - state['ball']['y'] + state['paddle1']['height'] / 2,
                  -MAX_COMPUTER_PADDLE_SPEED,
                  MAX_COMPUTER_PADDLE_SPEED
              )
          }
        else:
          return {
              'buttonPressed': False,
              'paddleDirection': -self.bounded_value(
                  state['paddle2']['y'] - state['ball']['y'] + state['paddle2']['height'] / 2,
                  -MAX_COMPUTER_PADDLE_SPEED,
                  MAX_COMPUTER_PADDLE_SPEED
              )
          }

    def bounded_value(self, value, min_value, max_value):
        return max(min_value, min(max_value, value))

    def _get_obs(self):
        state = self.state
        player = Player.Player1 if self.state['computer'] == Player.Player2 else Player.Player2
        is_player1 = 1 if player == Player.Player2 else 0
        is_server = 1 if self.state['server'] == player else 0

        return np.array([
            float(state['ball']['x']), float(state['ball']['y']), float(state['ball']['dx']), float(state['ball']['dy']),
            float(state['paddle1']['x']), float(state['paddle1']['y']), float(state['paddle1']['dy']),
            float(state['paddle2']['x']), float(state['paddle2']['y']), float(state['paddle2']['dy']),
            float(int(state['ball']['serveMode'])), float(is_player1),
            float(is_server)
        ], dtype=np.float32)

    def calculate_reward(self, prev_ball_x, left_player):
        ball = self.state['ball']
        reward = 0

        model_is_left = (left_player != self.state['computer'])

        # Reward for hitting the paddle
        if ball['x'] > prev_ball_x and ball['dx'] < 0:  # Ball is moving left after hitting paddle2 (right paddle)
            if not model_is_left:
                reward += 1
        elif ball['x'] < prev_ball_x and ball['dx'] > 0:  # Ball is moving right after hitting paddle1 (left paddle)
            if model_is_left:
                reward += 1

        # Reward for scoring a point
        if ball['x'] - ball['radius'] < 0:  # Left player missed, right player scored
            if model_is_left:
                reward -= 10  # Penalize model player (left paddle)
            else:
                reward += 10  # Reward model player (right paddle)
        elif ball['x'] + ball['radius'] > COURT_WIDTH:  # Right player missed, left player scored
            if model_is_left:
                reward += 10  # Reward model player (left paddle)
            else:
                reward -= 10  # Penalize model player (right paddle)

        # Small reward for keeping the rally going
        reward += 0.1

        return reward


    def check_done(self):
        # Determine if the episode is done
        return self.is_done

    def render(self, mode='human', close=False):
        if close:
            plt.close()
            return

        if not hasattr(self, 'fig'):
            self.fig, self.ax = plt.subplots()
            self.ax.set_xlim(0, COURT_WIDTH)
            self.ax.set_ylim(0, COURT_HEIGHT)
            self.ax.set_aspect('equal')
            plt.gca().invert_yaxis()  # Invert y-axis to match the coordinate system

        self.ax.clear()
        self.ax.set_xlim(0, COURT_WIDTH)
        self.ax.set_ylim(0, COURT_HEIGHT)

        # Draw paddles
        paddle1 = self.state['paddle1']
        paddle2 = self.state['paddle2']
        print(f"Paddle 1 - x: {paddle1['x']}, y: {paddle1['y']}, width: {paddle1['width']}, height: {paddle1['height']}, color: {paddle1['colour']}")
        print(f"Paddle 2 - x: {paddle2['x']}, y: {paddle2['y']}, width: {paddle2['width']}, height: {paddle2['height']}, color: {paddle2['colour']}")

        self.ax.add_patch(patches.Rectangle((paddle1['x'], paddle1['y']), paddle1['width'], paddle1['height'], color=paddle1['colour']))
        self.ax.add_patch(patches.Rectangle((paddle2['x'], paddle2['y']), paddle2['width'], paddle2['height'], color=paddle2['colour']))

        # Draw ball
        ball = self.state['ball']
        print(f"Ball - x: {ball['x']}, y: {ball['y']}, radius: {ball['radius']}")
        self.ax.add_patch(patches.Circle((ball['x'], ball['y']), ball['radius'], color='black'))

        # Capture the frame
        plt.draw()
        frame_path = f'frames/frame_{self.frame_count:04d}.png'
        self.fig.savefig(frame_path)
        self.frame_count += 1

    def close(self):
        if hasattr(self, 'fig'):
            plt.close(self.fig)

        # Check if frames directory exists
        if not os.path.exists('frames'):
            print("No frames directory found, skipping video creation.")
            return

        # Create GIF from frames
        with imageio.get_writer('pong_game.gif', mode='I', duration=0.1) as writer:
            for filename in sorted(glob.glob('frames/frame_*.png')):
                image = imageio.imread(filename)
                writer.append_data(image)

        # Display the GIF
        display(Image(filename='pong_game.gif'))

        # Remove frames
        for file in os.listdir('frames'):
            os.remove(os.path.join('frames', file))
        os.rmdir('frames')

# # Test the custom environment
# env = CustomPongEnv()
# obs = env.reset()
# print("Initial observation:", obs)

# for i in range(1000):
#     action = env.action_space.sample()  # Sample random action
#     obs, reward, done, info = env.step(action)
#     print("Action taken:", action)
#     print("Observation:", obs)
#     print("Reward:", reward)
#     print('iteration:', i)
#     print("Done:", done)
#     env.render()
#     if done:
#         break

# env.close()

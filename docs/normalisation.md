# Explanation of Normalisation

Normalisation is a crucial step in preparing data for machine learning models, especially when the data has features with different ranges. Here’s how normalisation has been handled in the function get_observation:

```py
observation_space = spaces.Box(
            low=np.array([0, 0, -1, -1, 0, 0, 0, 0], dtype=np.float32),
            high=np.array([1, 1, 1, 1, 1, 1, 1, 1], dtype=np.float32)
        )

def get_observation(player, game_state):
    is_server = 1 if game_state['server'] == player else 0
    paddle = game_state[player]
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
```

**Ball Position (x and y coordinates):**

```py
game_state['ball']['x'] / COURT_WIDTH
game_state['ball']['y'] / COURT_HEIGHT
```

These values normalise the ball’s position within the court dimensions to a range of [0, 1].

**Ball Velocity (dx and dy):**

```py
game_state['ball']['dx'] / 40
game_state['ball']['dy'] / 40
```

These values assume a maximum ball speed of 40 units (this value should be chosen based on the maximum expected velocity in the game). The normalised range is [-1, 1], considering the velocity can be negative or positive.

**Player Paddle Position:**

```py
float(0 if paddle['x'] < COURT_WIDTH / 2 else 1)
```

This value encodes whether the player's paddle is on the left or right side of the court, normalizing it to 0 or 1.

**Player Paddle Vertical Position:**

```py
paddle['y'] / COURT_HEIGHT
```

This value normalises the vertical position of the player's paddle within the court height to a range of [0, 1].

**Serve Mode:**

```py
float(int(game_state['ball']['serve_mode']))
```

This value is a binary indicator (0 or 1) indicating whether the ball is in serve mode.

**Server Status:**

```py
float(int(is_server))
```

This value is a binary indicator (0 or 1) indicating whether the current player is the server.

By normalizing these values, the observation space becomes consistent and within a defined range, making it easier for machine learning algorithms to process and learn from the data effectively. The observation space defined by spaces.Box also reflects these normalised ranges, ensuring the model understands the expected bounds of the input features.

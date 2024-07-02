import { hexToRgb } from "./libs/numbers";
import { Player } from "./types";

export const green = "rgb(0 102 51)";
export const purple = "rgb(84 0 139)";
export const BALL_COLOUR = "#FFFF00";
export const BALL_COLOUR_RGB = hexToRgb(BALL_COLOUR);
export const PLAYER_COLOURS = { [Player.Player1]: "#FF0000", [Player.Player2]: "#1e90ff" };

export const COURT = { width: 1200, height: 800 };
export const PADDLE = { width: 15, height: 90 };
export const BALL = { radius: 12 };
export const SERVING_HEIGHT_MULTIPLIER = 2;
export const SPEED_INCREMENT = 0.6;
export const INITIAL_SPEED = 10;
export const DELTA_TIME_DIVISOR = 21;
export const PADDLE_CONTACT_SPEED_BOOST_DIVISOR = 4;
export const PADDLE_GAP = 10;
export const SCORE_PAUSE_TIMEOUT = 75;
export const PADDLE_SPEED_DEVISOR = 15;
export const LONG_RALLY_ANNOUNCEMENT_THRESHOLD = 10;

// mouse input
export const MAX_MOUSE_PADDLE_SPEED = 30;

// bot setting
export const MAX_COMPUTER_PADDLE_SPEED = 10;

// gamepad api
export const GAMEPAD_AXIS_MULTIPLIER = 150;

export const MATCH_STATE_KEY = "matchState";
export const MATCH_CONFIG_KEY = "MATCH_CONFIG";

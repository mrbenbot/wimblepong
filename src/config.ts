import { Player } from "./types";

export const green = "rgb(0 102 51)";
export const purple = "rgb(84 0 139)";
export const BALL_COLOUR = "white";
export const PLAYER_COLOURS = { [Player.Player1]: "red", [Player.Player2]: "dodgerblue" };

export const COURT = { width: 1200, height: 800 };
export const PADDLE = { width: 15, height: 90 };
export const BALL = { radius: 12 };
export const SERVING_HEIGHT_MULTIPLIER = 2;
export const SPEED_INCREMENT = 0.25;
export const INITIAL_SPEED = 8;
export const DELTA_TIME_DIVISOR = 21;
export const PADDLE_SPEED_DEVISOR = 15;
export const LONG_RALLY_ANNOUNCEMENT_THRESHOLD = 10;

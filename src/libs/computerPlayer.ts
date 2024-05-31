import { MAX_COMPUTER_PADDLE_SPEED } from "../config";
import { GetPlayerActionsFunction } from "../types";
import { boundedValue } from "./numbers";

let serveDelay = 50;
let serveDelayCounter = 0;
let direction = 15;

export const getComputerPlayer: GetPlayerActionsFunction = (_, _state, canvas, positionsReversed) => {
  if (_state.ball.scoreMode) {
    serveDelayCounter = 0;
    direction = 30 * Math.random();
    serveDelay = 100 * Math.random();
    direction = Math.random() > 0.5 ? direction : -direction;
    return { buttonPressed: false, paddleDirection: 0 };
  }
  if (_state.ball.serveMode) {
    const paddle = positionsReversed ? _state.paddle1 : _state.paddle2;
    if (paddle.y <= 0 || paddle.y + paddle.height >= canvas.height) {
      direction = -direction;
    }
    if (serveDelayCounter++ > serveDelay) {
      return { buttonPressed: true, paddleDirection: direction };
    } else {
      return { buttonPressed: false, paddleDirection: direction };
    }
  }
  if (positionsReversed) {
    return {
      buttonPressed: false,
      paddleDirection: boundedValue(
        _state.paddle1.y - _state.ball.y + _state.paddle1.height / 2,
        -MAX_COMPUTER_PADDLE_SPEED,
        MAX_COMPUTER_PADDLE_SPEED
      ),
    };
  }
  return {
    buttonPressed: false,
    paddleDirection: -boundedValue(
      _state.paddle2.y - _state.ball.y + _state.paddle2.height / 2,
      -MAX_COMPUTER_PADDLE_SPEED,
      MAX_COMPUTER_PADDLE_SPEED
    ),
  };
};

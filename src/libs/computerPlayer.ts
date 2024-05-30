import { MAX_COMPUTER_PADDLE_SPEED } from "../config";
import { GetPlayerActionsFunction } from "../types";
import { boundedValue } from "./numbers";

export const getComputerPlayer: GetPlayerActionsFunction = (_, _state, __, positionsReversed) => {
  if (_state.ball.serveMode) {
    return { buttonPressed: true, paddleDirection: 0 };
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

import { useCallback } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { GetPlayerActionsFunction, Player } from "../types";
import { MAX_COMPUTER_PADDLE_SPEED } from "../config";
import { boundedValue } from "../libs/numbers";

const getComputerPlayer: GetPlayerActionsFunction = (_, _state, __, positionsReversed) => {
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

export default function MouseControlApp() {
  const { getPlayerActions } = useMouseInput();

  const getPlayerActionsRouter = useCallback<GetPlayerActionsFunction>(
    (player, ...args) => {
      if (player === Player.Player1) {
        return getPlayerActions(player, ...args);
      }
      return getComputerPlayer(player, ...args);
    },
    [getPlayerActions]
  );

  return (
    <>
      <App getPlayerActions={getPlayerActionsRouter} />
    </>
  );
}

import { COURT, MAX_COMPUTER_PADDLE_SPEED } from "../config";
import { GetPlayerActionsFunction, Player } from "../types";
import { boundedValue } from "./numbers";

export const getComputerPlayerActionsFunction: () => GetPlayerActionsFunction = () => {
  let serveDelay = 50;
  let serveDelayCounter = 0;
  let direction = 15;
  return (player, state) => {
    if (state.ball.scoreMode) {
      serveDelayCounter = 0;
      direction = 30 * Math.random();
      serveDelay = 100 * Math.random() + 100;
      direction = Math.random() > 0.5 ? direction : -direction;
      return { buttonPressed: false, paddleDirection: 0 };
    }
    const paddle = state[player];
    if (state.ball.serveMode) {
      if (paddle.y <= 0 || paddle.y + paddle.height >= COURT.height) {
        direction = -direction;
      }
      if (serveDelayCounter++ > serveDelay) {
        return { buttonPressed: true, paddleDirection: direction };
      } else {
        return { buttonPressed: false, paddleDirection: direction };
      }
    }
    const isLeft = (player === Player.Player1 && !state.positionsReversed) || (player === Player.Player2 && state.positionsReversed);
    if (isLeft) {
      return {
        buttonPressed: false,
        paddleDirection: boundedValue(
          paddle.y - state.ball.y + paddle.height / 2 + (Math.random() - 0.5) * 2,
          -MAX_COMPUTER_PADDLE_SPEED,
          MAX_COMPUTER_PADDLE_SPEED
        ),
      };
    }
    return {
      buttonPressed: false,
      paddleDirection: -boundedValue(
        paddle.y - state.ball.y + paddle.height / 2 + (Math.random() - 0.5) * 2,
        -MAX_COMPUTER_PADDLE_SPEED,
        MAX_COMPUTER_PADDLE_SPEED
      ),
    };
  };
};

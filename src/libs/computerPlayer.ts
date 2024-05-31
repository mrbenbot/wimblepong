import { MAX_COMPUTER_PADDLE_SPEED } from "../config";
import { GetPlayerActionsFunction, Player } from "../types";
import { boundedValue } from "./numbers";

export const getComputerPlayerActionsFunction: () => GetPlayerActionsFunction = () => {
  let serveDelay = 50;
  let serveDelayCounter = 0;
  let direction = 15;
  return (player, state, canvas, positionsReversed) => {
    const isLeft = player === Player.Player1 ? !positionsReversed : positionsReversed;
    if (state.ball.scoreMode) {
      serveDelayCounter = 0;
      direction = 30 * Math.random();
      serveDelay = 100 * Math.random();
      direction = Math.random() > 0.5 ? direction : -direction;
      return { buttonPressed: false, paddleDirection: 0 };
    }
    if (state.ball.serveMode) {
      const paddle = isLeft ? state.paddle1 : state.paddle2;
      if (paddle.y <= 0 || paddle.y + paddle.height >= canvas.height) {
        direction = -direction;
      }
      if (serveDelayCounter++ > serveDelay) {
        return { buttonPressed: true, paddleDirection: direction };
      } else {
        return { buttonPressed: false, paddleDirection: direction };
      }
    }
    if (isLeft) {
      return {
        buttonPressed: false,
        paddleDirection: boundedValue(
          state.paddle1.y - state.ball.y + state.paddle1.height / 2,
          -MAX_COMPUTER_PADDLE_SPEED,
          MAX_COMPUTER_PADDLE_SPEED
        ),
      };
    }
    return {
      buttonPressed: false,
      paddleDirection: -boundedValue(
        state.paddle2.y - state.ball.y + state.paddle2.height / 2,
        -MAX_COMPUTER_PADDLE_SPEED,
        MAX_COMPUTER_PADDLE_SPEED
      ),
    };
  };
};

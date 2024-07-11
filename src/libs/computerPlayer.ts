import { COURT, MAX_COMPUTER_PADDLE_SPEED, PADDLE } from "../config";
import { GetPlayerActionsFunction, Player } from "../types";
import { boundedValue } from "./numbers";

const speeds = {
  "bot-easy": MAX_COMPUTER_PADDLE_SPEED / 2,
  "bot-medium": MAX_COMPUTER_PADDLE_SPEED,
  "bot-hard": MAX_COMPUTER_PADDLE_SPEED * 2,
};

export const getComputerPlayerActionsFunction: (setting: "bot-easy" | "bot-medium" | "bot-hard") => GetPlayerActionsFunction = (setting) => {
  let serveDelay = 50;
  let serveDelayCounter = 0;
  let direction = 15;
  const paddleSpeed = speeds[setting] ?? MAX_COMPUTER_PADDLE_SPEED;
  const paddleOffset = (Math.random() * PADDLE.height) / 2;
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
        paddleDirection: boundedValue(paddle.y + paddleOffset - state.ball.y + paddle.height / 2, -paddleSpeed, paddleSpeed),
      };
    }
    return {
      buttonPressed: false,
      paddleDirection: -boundedValue(paddle.y + paddleOffset - state.ball.y + paddle.height / 2, -paddleSpeed, paddleSpeed),
    };
  };
};

export const botOptions = ["bot-easy", "bot-medium", "bot-hard"];

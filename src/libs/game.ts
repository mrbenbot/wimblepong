import { BALL_COLOUR, COURT, INITIAL_SPEED, PADDLE_CONTACT_SPEED_BOOST_DIVISOR, PADDLE_SPEED_DEVISOR, SPEED_INCREMENT } from "../config";
import { MutableGameState, Player } from "../types";

export const draw = (gameState: MutableGameState, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw paddles
  context.fillStyle = gameState.paddle1.colour;
  context.fillRect(gameState.paddle1.x, gameState.paddle1.y, gameState.paddle1.width, gameState.paddle1.height);
  context.fillStyle = gameState.paddle2.colour;
  context.fillRect(gameState.paddle2.x, gameState.paddle2.y, gameState.paddle2.width, gameState.paddle2.height);

  // Draw ball
  context.fillStyle = BALL_COLOUR;
  context.beginPath();
  context.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
  context.fill();
};

interface PlayerActions {
  buttonPressed: boolean;
  paddleDirection: number;
}

export enum GameEventType {
  ResetBall = "RESET_BALL",
  Serve = "SERVE",
  HitPaddle = "HIT_PADDLE",
  ScorePointLeft = "SCORE_POINT_LEFT",
  ScorePointRight = "SCORE_POINT_RIGHT",
  WallContact = "WALL_CONTACT",
}

export const updateGameState = (
  gameState: MutableGameState,
  leftPlayerActions: PlayerActions,
  rightPlayerActions: PlayerActions,
  servingPlayer: Player,
  positionsReversed: boolean,
  deltaTime: number,
  fireEvent: (str: GameEventType) => void
) => {
  // Update ball position
  const { ball, paddle1, paddle2, stats } = gameState;

  if (ball.scoreMode) {
    if (ball.scoreModeTimeout < 50) {
      ball.scoreModeTimeout += deltaTime;
    } else {
      fireEvent(GameEventType.ResetBall);
    }
  } else if (ball.serveMode) {
    if ((servingPlayer === Player.Player1 && !positionsReversed) || (servingPlayer === Player.Player2 && positionsReversed)) {
      ball.dy = (paddle1.y + paddle1.height / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
      ball.x = paddle1.width + ball.radius;
      if (leftPlayerActions.buttonPressed) {
        ball.speed = INITIAL_SPEED;
        ball.dx = INITIAL_SPEED;
        ball.serveMode = false;
        fireEvent(GameEventType.Serve);
      }
    } else {
      ball.dy = (paddle2.y + paddle2.height / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
      ball.x = COURT.width - paddle2.width - ball.radius;
      if (rightPlayerActions.buttonPressed) {
        ball.speed = INITIAL_SPEED;
        ball.dx = -INITIAL_SPEED;
        ball.serveMode = false;
        fireEvent(GameEventType.Serve);
      }
    }
    ball.y += ball.dy * deltaTime;
  } else {
    ball.x += ball.dx * deltaTime;
    ball.y += ball.dy * deltaTime;

    // Check for collisions with top and bottom walls
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
      ball.y = ball.radius; // Adjust ball position to avoid sticking
      fireEvent(GameEventType.WallContact);
    } else if (ball.y + ball.radius > COURT.height) {
      ball.dy = -ball.dy;
      ball.y = COURT.height - ball.radius; // Adjust ball position to avoid sticking
      fireEvent(GameEventType.WallContact);
    }

    // Update ball collision detection and response
    if (ball.x - ball.radius < paddle1.x + paddle1.width && ball.y + ball.radius > paddle1.y && ball.y - ball.radius < paddle1.y + paddle1.height) {
      const bounceAngle = getBounceAngle(paddle1.y, paddle1.height, ball.y);
      ball.dx = (ball.speed + Math.abs(paddle1.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
      ball.dy = (ball.speed + Math.abs(paddle1.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
      ball.x = paddle1.x + paddle1.width + ball.radius; // Adjust ball position to avoid sticking
      ball.speed += SPEED_INCREMENT;
      stats.rallyLength += 1;
      fireEvent(GameEventType.HitPaddle);
    } else if (ball.x + ball.radius > paddle2.x && ball.y + ball.radius > paddle2.y && ball.y - ball.radius < paddle2.y + paddle2.height) {
      const bounceAngle = getBounceAngle(paddle2.y, paddle2.height, ball.y);
      ball.dx = -(ball.speed + Math.abs(paddle2.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
      ball.dy = (ball.speed + Math.abs(paddle2.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
      ball.x = paddle2.x - ball.radius; // Adjust ball position to avoid sticking
      ball.speed += SPEED_INCREMENT;
      stats.rallyLength += 1;
      fireEvent(GameEventType.HitPaddle);
    }

    // Check for scoring
    if (ball.x - ball.radius < 0) {
      fireEvent(GameEventType.ScorePointLeft);
      ball.scoreMode = true;
    } else if (ball.x + ball.radius > COURT.width) {
      fireEvent(GameEventType.ScorePointRight);
      ball.scoreMode = true;
    }
  }

  paddle1.dy = -leftPlayerActions.paddleDirection;
  paddle1.y += paddle1.dy * deltaTime;

  paddle2.dy = rightPlayerActions.paddleDirection;
  paddle2.y += paddle2.dy * deltaTime;

  // Ensure paddles stay within screen bounds
  if (paddle1.y < 0) paddle1.y = 0;
  if (paddle1.y + paddle1.height > COURT.height) paddle1.y = COURT.height - paddle1.height;

  if (paddle2.y < 0) paddle2.y = 0;
  if (paddle2.y + paddle2.height > COURT.height) paddle2.y = COURT.height - paddle2.height;
};

export const resetBall = (gameState: MutableGameState, left: boolean) => {
  const { ball, stats, paddle1, paddle2 } = gameState;
  ball.y = left ? paddle1.height / 2 + paddle1.y : paddle2.height / 2 + paddle2.y;
  ball.x = left ? paddle1.width + ball.radius : COURT.width - paddle2.width - ball.radius;
  ball.speed = INITIAL_SPEED;
  ball.serveMode = true;
  ball.scoreMode = false;
  ball.scoreModeTimeout = 0;
  stats.rallyLength = 0;
};

const getBounceAngle = (paddleY: number, paddleHeight: number, ballY: number) => {
  const relativeIntersectY = paddleY + paddleHeight / 2 - ballY;
  const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  return normalizedIntersectY * (Math.PI / 4); // 45 degrees max
};

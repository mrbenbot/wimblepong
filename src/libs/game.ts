import {
  BALL_COLOUR,
  COURT,
  INITIAL_SPEED,
  PADDLE,
  PADDLE_CONTACT_SPEED_BOOST_DIVISOR,
  PADDLE_GAP,
  PADDLE_SPEED_DEVISOR,
  SERVING_HEIGHT_MULTIPLIER,
  SPEED_INCREMENT,
} from "../config";
import { MutableGameState, Player, PlayerPositions } from "../types";

export const draw = (gameState: MutableGameState, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.shadowColor = "#000000de";
  context.shadowBlur = 15;

  // Draw paddles
  context.fillStyle = gameState[Player.Player1].colour;
  context.fillRect(gameState[Player.Player1].x, gameState[Player.Player1].y, gameState[Player.Player1].width, gameState[Player.Player1].height);
  context.fillStyle = gameState[Player.Player2].colour;
  context.fillRect(gameState[Player.Player2].x, gameState[Player.Player2].y, gameState[Player.Player2].width, gameState[Player.Player2].height);

  context.shadowColor = "transparent";
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
  actions: { [Player.Player1]: PlayerActions; [Player.Player2]: PlayerActions },
  deltaTime: number,
  fireEvent: (str: GameEventType) => void
) => {
  // Update ball position
  const { ball, stats, server, positionsReversed } = gameState;

  const [paddleLeft, paddleRight] = positionsReversed
    ? [gameState[Player.Player2], gameState[Player.Player1]]
    : [gameState[Player.Player1], gameState[Player.Player2]];

  if (ball.scoreMode) {
    if (ball.scoreModeTimeout < 50) {
      ball.scoreModeTimeout += deltaTime;
    } else {
      fireEvent(GameEventType.ResetBall);
      resetBall(gameState);
    }
  } else if (ball.serveMode) {
    const servingFromLeft = (server === Player.Player1 && !positionsReversed) || (server === Player.Player2 && positionsReversed);
    if (servingFromLeft) {
      ball.dy = (paddleLeft.y + paddleLeft.height / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
      // ball.x = paddleLeft.width + ball.radius + PADDLE_GAP;
    } else {
      ball.dy = (paddleRight.y + paddleRight.height / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
      // ball.x = COURT.width - paddleRight.width - ball.radius - PADDLE_GAP;
    }
    if (actions[server].buttonPressed) {
      ball.speed = INITIAL_SPEED;
      ball.dx = servingFromLeft ? INITIAL_SPEED : -INITIAL_SPEED; // for when serve does happen
      ball.serveMode = false;
      fireEvent(GameEventType.Serve);
      stats.rallyLength += 1;
      stats.serveSpeed = Math.abs(ball.dy) + Math.abs(ball.dx);
      stats.server = server;
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
    if (
      ball.x - ball.radius < paddleLeft.x + paddleLeft.width &&
      ball.y + ball.radius > paddleLeft.y &&
      ball.y - ball.radius < paddleLeft.y + paddleLeft.height
    ) {
      const bounceAngle = getBounceAngle(paddleLeft.y, paddleLeft.height, ball.y);
      ball.dx = (ball.speed + Math.abs(paddleLeft.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
      ball.dy = (ball.speed + Math.abs(paddleLeft.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
      ball.x = paddleLeft.x + paddleLeft.width + ball.radius; // Adjust ball position to avoid sticking
      ball.speed += SPEED_INCREMENT;
      stats.rallyLength += 1;
      fireEvent(GameEventType.HitPaddle);
    } else if (
      ball.x + ball.radius > paddleRight.x &&
      ball.y + ball.radius > paddleRight.y &&
      ball.y - ball.radius < paddleRight.y + paddleRight.height
    ) {
      const bounceAngle = getBounceAngle(paddleRight.y, paddleRight.height, ball.y);
      ball.dx = -(ball.speed + Math.abs(paddleRight.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
      ball.dy = (ball.speed + Math.abs(paddleRight.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
      ball.x = paddleRight.x - ball.radius; // Adjust ball position to avoid sticking
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
  if (positionsReversed) {
    gameState[Player.Player1].dy = actions[Player.Player1].paddleDirection;
    gameState[Player.Player2].dy = -actions[Player.Player2].paddleDirection;
  } else {
    gameState[Player.Player1].dy = -actions[Player.Player1].paddleDirection;
    gameState[Player.Player2].dy = actions[Player.Player2].paddleDirection;
  }
  paddleLeft.y += paddleLeft.dy * deltaTime;
  paddleRight.y += paddleRight.dy * deltaTime;

  // Ensure paddles stay within screen bounds
  if (paddleLeft.y < 0) paddleLeft.y = 0;
  if (paddleLeft.y + paddleLeft.height > COURT.height) paddleLeft.y = COURT.height - paddleLeft.height;

  if (paddleRight.y < 0) paddleRight.y = 0;
  if (paddleRight.y + paddleRight.height > COURT.height) paddleRight.y = COURT.height - paddleRight.height;
};

export const resetBall = (gameState: MutableGameState) => {
  const { ball, stats, positionsReversed, server } = gameState;
  const servingPaddle = gameState[server];
  const left = (server === Player.Player1 && !positionsReversed) || (server === Player.Player2 && positionsReversed);
  ball.y = servingPaddle.height / 2 + servingPaddle.y;
  ball.x = left ? servingPaddle.width + ball.radius + PADDLE_GAP : COURT.width - servingPaddle.width - ball.radius - PADDLE_GAP;
  ball.speed = INITIAL_SPEED;
  ball.serveMode = true;
  ball.scoreMode = false;
  ball.scoreModeTimeout = 0;
  stats.rallyLength = 0;
};

export const applyMetaGameState = (gameState: MutableGameState, servingPlayer: Player, playerPositions: PlayerPositions) => {
  const positionsReversed = playerPositions === PlayerPositions.Reversed;

  gameState.server = servingPlayer;
  gameState.positionsReversed = positionsReversed;

  // Set paddle heights
  if (servingPlayer === Player.Player1) {
    gameState[Player.Player1].height = PADDLE.height * SERVING_HEIGHT_MULTIPLIER;
    gameState[Player.Player2].height = PADDLE.height;
  } else {
    gameState[Player.Player1].height = PADDLE.height;
    gameState[Player.Player2].height = PADDLE.height * SERVING_HEIGHT_MULTIPLIER;
  }

  // Set paddle colours
  if (positionsReversed) {
    gameState[Player.Player1].x = COURT.width - PADDLE.width - PADDLE_GAP;
    gameState[Player.Player2].x = PADDLE_GAP;
  } else {
    gameState[Player.Player1].x = PADDLE_GAP;
    gameState[Player.Player2].x = COURT.width - PADDLE.width - PADDLE_GAP;
  }
};

const getBounceAngle = (paddleY: number, paddleHeight: number, ballY: number) => {
  const relativeIntersectY = paddleY + paddleHeight / 2 - ballY;
  const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  return normalizedIntersectY * (Math.PI / 4); // 45 degrees max
};

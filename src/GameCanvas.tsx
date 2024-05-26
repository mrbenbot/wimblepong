import React, { useRef, useEffect } from "react";
import { GameState } from "./App";
import { DataRef } from "./ConnectDevices";
import { Action, MatchState, Player } from "./score";
import { BALL_COLOUR, COURT, DELTA_TIME_DIVISOR, INITIAL_SPEED, PLAYER_COLOURS, SERVING_HEIGHT_MULTIPLIER, SPEED_INCREMENT } from "./config";
import "./GameCanvas.css";

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<GameState>;
  inputRef: React.MutableRefObject<DataRef>;
  dispatch: React.Dispatch<Action>;
  matchState: MatchState;
  paused: boolean;
  leftPlayer: Player;
  rightPlayer: Player;
}

const getBounceAngle = (paddleY: number, paddleHeight: number, ballY: number) => {
  const relativeIntersectY = paddleY + paddleHeight / 2 - ballY;
  const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  return normalizedIntersectY * (Math.PI / 4); // 45 degrees max
};

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, inputRef, dispatch, matchState, paused, leftPlayer, rightPlayer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deltaTimeRef = useRef(0);

  const { servingPlayer, playerPositions: playerPosition } = matchState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (paused) return;
    console.log("render");

    const leftHeight =
      leftPlayer === servingPlayer ? gameStateRef.current.paddle1.height * SERVING_HEIGHT_MULTIPLIER : gameStateRef.current.paddle1.height;
    const rightHeight =
      rightPlayer === servingPlayer ? gameStateRef.current.paddle2.height * SERVING_HEIGHT_MULTIPLIER : gameStateRef.current.paddle2.height;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      context.fillStyle = PLAYER_COLOURS[leftPlayer];
      context.fillRect(gameStateRef.current.paddle1.x, gameStateRef.current.paddle1.y, gameStateRef.current.paddle1.width, leftHeight);
      context.fillStyle = PLAYER_COLOURS[rightPlayer];
      context.fillRect(gameStateRef.current.paddle2.x, gameStateRef.current.paddle2.y, gameStateRef.current.paddle2.width, rightHeight);

      // Draw ball
      context.fillStyle = BALL_COLOUR;
      context.beginPath();
      context.arc(gameStateRef.current.ball.x, gameStateRef.current.ball.y, gameStateRef.current.ball.radius, 0, Math.PI * 2);
      context.fill();
    };

    const update = (deltaTime: number) => {
      // Update ball position
      const ball = gameStateRef.current.ball;
      const paddle1 = gameStateRef.current.paddle1;
      const paddle2 = gameStateRef.current.paddle2;
      // Update paddle positions based on input
      const { [leftPlayer]: input1, [rightPlayer]: input2 } = inputRef.current;

      if (ball.serveMode) {
        if (leftPlayer === servingPlayer) {
          ball.dy = (paddle1.y + leftHeight / 2 - ball.y) / 15;
          ball.x = paddle1.width + ball.radius;
          if (getButtonPushed(input1.lastData || new Uint8Array())) {
            ball.speed = INITIAL_SPEED;
            ball.dx = INITIAL_SPEED;
            ball.serveMode = false;
          }
        } else {
          ball.dy = (paddle2.y + rightHeight / 2 - ball.y) / 15;
          ball.x = canvas.width - paddle2.width - ball.radius;
          if (getButtonPushed(input2.lastData || new Uint8Array())) {
            ball.speed = INITIAL_SPEED;
            ball.dx = -INITIAL_SPEED;
            ball.serveMode = false;
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
        } else if (ball.y + ball.radius > canvas.height) {
          ball.dy = -ball.dy;
          ball.y = canvas.height - ball.radius; // Adjust ball position to avoid sticking
        }

        // Update ball collision detection and response
        if (ball.x - ball.radius < paddle1.x + paddle1.width && ball.y > paddle1.y && ball.y < paddle1.y + leftHeight) {
          const bounceAngle = getBounceAngle(paddle1.y, leftHeight, ball.y);
          ball.dx = ball.speed * Math.cos(bounceAngle);
          ball.dy = ball.speed * -Math.sin(bounceAngle);
          ball.x = paddle1.x + paddle1.width + ball.radius; // Adjust ball position to avoid sticking
          ball.speed += SPEED_INCREMENT;
        } else if (ball.x + ball.radius > paddle2.x && ball.y > paddle2.y && ball.y < paddle2.y + rightHeight) {
          const bounceAngle = getBounceAngle(paddle2.y, rightHeight, ball.y);
          ball.dx = -ball.speed * Math.cos(bounceAngle);
          ball.dy = ball.speed * -Math.sin(bounceAngle);
          ball.x = paddle2.x - ball.radius; // Adjust ball position to avoid sticking
          ball.speed += SPEED_INCREMENT;
        }

        // Check for scoring
        if (ball.x - ball.radius < 0) {
          dispatch({ type: "POINT_SCORED", player: rightPlayer });
          resetBall();
        } else if (ball.x + ball.radius > canvas.width) {
          dispatch({ type: "POINT_SCORED", player: leftPlayer });
          resetBall();
        }
      }

      paddle1.dy = -getPaddleDirection(input1.lastData || new Uint8Array());
      paddle1.y += paddle1.dy * deltaTime;

      paddle2.dy = getPaddleDirection(input2.lastData || new Uint8Array());
      paddle2.y += paddle2.dy * deltaTime;

      // Ensure paddles stay within screen bounds
      if (paddle1.y < 0) paddle1.y = 0;
      if (paddle1.y + leftHeight > canvas.height) paddle1.y = canvas.height - leftHeight;

      if (paddle2.y < 0) paddle2.y = 0;
      if (paddle2.y + rightHeight > canvas.height) paddle2.y = canvas.height - rightHeight;
    };

    const resetBall = () => {
      const ball = gameStateRef.current.ball;
      ball.speed = INITIAL_SPEED;
      ball.serveMode = true;
    };

    let loopId: null | number = null;
    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - deltaTimeRef.current) / DELTA_TIME_DIVISOR;
      deltaTimeRef.current = timestamp;
      update(deltaTime);
      draw();
      loopId = requestAnimationFrame(gameLoop);
    };

    loopId = requestAnimationFrame(gameLoop);

    return () => {
      // Cleanup on unmount
      if (loopId !== null) {
        cancelAnimationFrame(loopId);
      }
    };
  }, [inputRef, gameStateRef, dispatch, servingPlayer, playerPosition, paused, leftPlayer, rightPlayer, deltaTimeRef]);

  // const handleFullscreen = () => {
  //   if (canvasRef.current !== null) {
  //     const methods = [
  //       "requestFullscreen",
  //       "mozRequestFullScreen", // Firefox
  //       "webkitRequestFullscreen", // Chrome, Safari, and Opera
  //       "msRequestFullscreen", // IE/Edge
  //     ];

  //     for (const method of methods) {
  //       if (method in canvasRef.current) {
  //         const func = (canvasRef.current as any)[method] as () => Promise<void>;
  //         func.call(canvasRef.current);
  //         break;
  //       }
  //     }
  //   }
  // };

  return (
    <div>
      <canvas ref={canvasRef} width={COURT.width} height={COURT.height} />
    </div>
  );
};

function getPaddleDirection(data: Uint8Array) {
  return 128 - data[6];
}

function getButtonPushed(data: Uint8Array) {
  // 7 green 9 red 12 blue 11 black
  return data[11] === 255;
}

export default GameCanvas;

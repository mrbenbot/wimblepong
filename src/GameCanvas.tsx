import React, { useRef, useEffect } from "react";
import { GameState } from "./App";
import { DataRef } from "./ConnectDevices";
import { Action } from "./score";
import {
  BALL_COLOUR,
  COURT,
  DELTA_TIME_DIVISOR,
  INITIAL_SPEED,
  PADDLE_CONTACT_SPEED_BOOST_DIVISOR,
  PADDLE_SPEED_DEVISOR,
  PLAYER_COLOURS,
  SERVING_HEIGHT_MULTIPLIER,
  SPEED_INCREMENT,
} from "./config";
import "./GameCanvas.css";
import { MatchState, Player } from "./types";
import GameScore from "./GameScore";

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
      const { ball, paddle1, paddle2, stats } = gameStateRef.current;
      // Update paddle positions based on input
      const { [leftPlayer]: input1, [rightPlayer]: input2 } = inputRef.current;

      if (ball.serveMode) {
        if (leftPlayer === servingPlayer) {
          ball.dy = (paddle1.y + leftHeight / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
          ball.x = paddle1.width + ball.radius;
          if (getButtonPushed(input1.lastData || new Uint8Array())) {
            dispatch({ type: "CLEAR_EVENTS" });
            ball.speed = INITIAL_SPEED;
            ball.dx = INITIAL_SPEED;
            ball.serveMode = false;

            stats.rallyLength += 1;
            stats.serveSpeed = Math.abs(ball.dy) + Math.abs(ball.dx);
            stats.server = leftPlayer;
          }
        } else {
          ball.dy = (paddle2.y + rightHeight / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
          ball.x = canvas.width - paddle2.width - ball.radius;
          if (getButtonPushed(input2.lastData || new Uint8Array())) {
            dispatch({ type: "CLEAR_EVENTS" });
            ball.speed = INITIAL_SPEED;
            ball.dx = -INITIAL_SPEED;
            ball.serveMode = false;

            stats.rallyLength += 1;
            stats.serveSpeed = Math.abs(ball.dy) + Math.abs(ball.dx);
            stats.server = rightPlayer;
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
          ball.dx = (ball.speed + Math.abs(paddle1.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
          ball.dy = (ball.speed + Math.abs(paddle1.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
          ball.x = paddle1.x + paddle1.width + ball.radius; // Adjust ball position to avoid sticking
          ball.speed += SPEED_INCREMENT;
          stats.rallyLength += 1;
        } else if (ball.x + ball.radius > paddle2.x && ball.y > paddle2.y && ball.y < paddle2.y + rightHeight) {
          const bounceAngle = getBounceAngle(paddle2.y, rightHeight, ball.y);
          ball.dx = -(ball.speed + Math.abs(paddle2.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
          ball.dy = (ball.speed + Math.abs(paddle2.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
          ball.x = paddle2.x - ball.radius; // Adjust ball position to avoid sticking
          ball.speed += SPEED_INCREMENT;
          stats.rallyLength += 1;
        }

        // Check for scoring
        if (ball.x - ball.radius < 0) {
          dispatch({ type: "POINT_SCORED", player: rightPlayer, stats: { ...stats } });
          resetBall();
        } else if (ball.x + ball.radius > canvas.width) {
          dispatch({ type: "POINT_SCORED", player: leftPlayer, stats: { ...stats } });
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
      const { ball, stats } = gameStateRef.current;

      ball.speed = INITIAL_SPEED;
      ball.serveMode = true;
      stats.rallyLength = 0;
      stats.rallyLength = 0;
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

  return (
    <div className="game-canvas-container">
      <GameScore leftPlayer={leftPlayer} rightPlayer={rightPlayer} matchState={matchState} />
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

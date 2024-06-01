import React, { useRef, useEffect } from "react";
import { Action } from "../libs/score";
import {
  BALL_COLOUR,
  COURT,
  DELTA_TIME_DIVISOR,
  INITIAL_SPEED,
  PADDLE,
  PADDLE_CONTACT_SPEED_BOOST_DIVISOR,
  PADDLE_SPEED_DEVISOR,
  PLAYER_COLOURS,
  SERVING_HEIGHT_MULTIPLIER,
  SPEED_INCREMENT,
} from "../config";
import "./GameCanvas.css";
import { GetPlayerActionsFunction, MatchState, MutableGameState, Player, PlayerPositions } from "../types";
import GameScore from "./GameScore";
import useRandomNotePlayer, { NoteType } from "../hooks/playNote";

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<MutableGameState>;
  dispatch: React.Dispatch<Action>;
  matchState: MatchState;
  paused: boolean;
  leftPlayer: Player;
  rightPlayer: Player;

  getPlayerActions: GetPlayerActionsFunction;
}

const getBounceAngle = (paddleY: number, paddleHeight: number, ballY: number) => {
  const relativeIntersectY = paddleY + paddleHeight / 2 - ballY;
  const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  return normalizedIntersectY * (Math.PI / 4); // 45 degrees max
};

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, dispatch, matchState, paused, leftPlayer, rightPlayer, getPlayerActions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deltaTimeRef = useRef(0);
  const playNote = useRandomNotePlayer();

  const { servingPlayer, playerPositions } = matchState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (paused) return;
    console.log("render");

    if (servingPlayer === leftPlayer) {
      gameStateRef.current.paddle1.height = PADDLE.height * SERVING_HEIGHT_MULTIPLIER;
      gameStateRef.current.paddle2.height = PADDLE.height;
    } else {
      gameStateRef.current.paddle1.height = PADDLE.height;
      gameStateRef.current.paddle2.height = PADDLE.height * SERVING_HEIGHT_MULTIPLIER;
    }

    const positionsReversed = playerPositions === PlayerPositions.Reversed;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      context.fillStyle = PLAYER_COLOURS[leftPlayer];
      context.fillRect(
        gameStateRef.current.paddle1.x,
        gameStateRef.current.paddle1.y,
        gameStateRef.current.paddle1.width,
        gameStateRef.current.paddle1.height
      );
      context.fillStyle = PLAYER_COLOURS[rightPlayer];
      context.fillRect(
        gameStateRef.current.paddle2.x,
        gameStateRef.current.paddle2.y,
        gameStateRef.current.paddle2.width,
        gameStateRef.current.paddle2.height
      );

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
      const leftPlayerActions = getPlayerActions(leftPlayer, gameStateRef.current, canvas, positionsReversed);
      const rightPlayerActions = getPlayerActions(rightPlayer, gameStateRef.current, canvas, positionsReversed);

      if (ball.scoreMode) {
        if (ball.scoreModeTimeout < 50) {
          ball.scoreModeTimeout += deltaTime;
        } else {
          resetBall();
        }
      } else if (ball.serveMode) {
        if (leftPlayer === servingPlayer) {
          ball.dy = (paddle1.y + paddle1.height / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
          ball.x = paddle1.width + ball.radius;
          if (leftPlayerActions.buttonPressed) {
            dispatch({ type: "CLEAR_EVENTS" });
            playNote(NoteType.Paddle);
            ball.speed = INITIAL_SPEED;
            ball.dx = INITIAL_SPEED;
            ball.serveMode = false;

            stats.rallyLength += 1;
            stats.serveSpeed = Math.abs(ball.dy) + Math.abs(ball.dx);
            stats.server = leftPlayer;
          }
        } else {
          ball.dy = (paddle2.y + paddle2.height / 2 - ball.y) / PADDLE_SPEED_DEVISOR;
          ball.x = canvas.width - paddle2.width - ball.radius;
          if (rightPlayerActions.buttonPressed) {
            dispatch({ type: "CLEAR_EVENTS" });
            playNote(NoteType.Paddle);
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
        if (ball.x - ball.radius < paddle1.x + paddle1.width && ball.y > paddle1.y && ball.y < paddle1.y + paddle1.height) {
          const bounceAngle = getBounceAngle(paddle1.y, paddle1.height, ball.y);
          ball.dx = (ball.speed + Math.abs(paddle1.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
          ball.dy = (ball.speed + Math.abs(paddle1.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
          ball.x = paddle1.x + paddle1.width + ball.radius; // Adjust ball position to avoid sticking
          ball.speed += SPEED_INCREMENT;
          stats.rallyLength += 1;
          playNote(NoteType.Paddle);
        } else if (ball.x + ball.radius > paddle2.x && ball.y > paddle2.y && ball.y < paddle2.y + paddle2.height) {
          const bounceAngle = getBounceAngle(paddle2.y, paddle2.height, ball.y);
          ball.dx = -(ball.speed + Math.abs(paddle2.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * Math.cos(bounceAngle);
          ball.dy = (ball.speed + Math.abs(paddle2.dy) / PADDLE_CONTACT_SPEED_BOOST_DIVISOR) * -Math.sin(bounceAngle);
          ball.x = paddle2.x - ball.radius; // Adjust ball position to avoid sticking
          ball.speed += SPEED_INCREMENT;
          stats.rallyLength += 1;
          playNote(NoteType.Paddle);
        }

        // Check for scoring
        if (ball.x - ball.radius < 0) {
          dispatch({ type: "POINT_SCORED", player: rightPlayer, stats: { ...stats } });
          playNote(rightPlayer === Player.Player1 ? NoteType.WinPoint : NoteType.LoosePoint);
          ball.scoreMode = true;
        } else if (ball.x + ball.radius > canvas.width) {
          dispatch({ type: "POINT_SCORED", player: leftPlayer, stats: { ...stats } });
          playNote(leftPlayer === Player.Player1 ? NoteType.WinPoint : NoteType.LoosePoint);
          ball.scoreMode = true;
        }
      }

      paddle1.dy = -leftPlayerActions.paddleDirection;
      paddle1.y += paddle1.dy * deltaTime;

      paddle2.dy = rightPlayerActions.paddleDirection;
      paddle2.y += paddle2.dy * deltaTime;

      // Ensure paddles stay within screen bounds
      if (paddle1.y < 0) paddle1.y = 0;
      if (paddle1.y + paddle1.height > canvas.height) paddle1.y = canvas.height - paddle1.height;

      if (paddle2.y < 0) paddle2.y = 0;
      if (paddle2.y + paddle2.height > canvas.height) paddle2.y = canvas.height - paddle2.height;
    };

    const resetBall = () => {
      const { ball, stats } = gameStateRef.current;
      ball.y = canvas.height / 2;
      ball.speed = INITIAL_SPEED;
      ball.serveMode = true;
      ball.scoreMode = false;
      ball.scoreModeTimeout = 0;
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

    // set deltaTimeRef so that initial delta time is not crazy big
    deltaTimeRef.current = performance.now();
    loopId = requestAnimationFrame(gameLoop);

    return () => {
      // Cleanup on unmount
      if (loopId !== null) {
        cancelAnimationFrame(loopId);
      }
    };
  }, [gameStateRef, dispatch, servingPlayer, playerPositions, paused, leftPlayer, rightPlayer, deltaTimeRef, getPlayerActions, playNote]);

  return (
    <div className="game-canvas-container">
      <GameScore leftPlayer={leftPlayer} rightPlayer={rightPlayer} matchState={matchState} />
      <canvas ref={canvasRef} width={COURT.width} height={COURT.height} />
    </div>
  );
};

export default GameCanvas;

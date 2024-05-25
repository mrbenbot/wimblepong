import React, { useRef, useEffect } from "react";
import { GameState } from "./App";
import { DataRef } from "./ConnectDevices";
import { Action, MatchState, Player, PlayerEnd } from "./score";

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<GameState>;
  inputRef: React.MutableRefObject<DataRef>;
  dispatch: React.Dispatch<Action>;
  matchState: MatchState;
  paused: boolean;
}

const getBounceAngle = (paddleY: number, paddleHeight: number, ballY: number) => {
  const relativeIntersectY = paddleY + paddleHeight / 2 - ballY;
  const normalizedIntersectY = relativeIntersectY / (paddleHeight / 2);
  return normalizedIntersectY * (Math.PI / 4); // 45 degrees max
};

const getLeftRightPlayer = (servingPlayer: Player, servingEnd: PlayerEnd) => {
  return { [servingEnd]: servingPlayer, [servingEnd === PlayerEnd.Right ? PlayerEnd.Left : PlayerEnd.Right]: servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1 };
};

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, inputRef, dispatch, matchState, paused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { servingPlayer, servingEnd } = matchState;
  const { [PlayerEnd.Left]: leftPlayer, [PlayerEnd.Right]: rightPlayer } = getLeftRightPlayer(servingPlayer, servingEnd);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (paused) return;
    console.log("render");

    const leftHeight = leftPlayer === servingPlayer ? gameStateRef.current.paddle1.height * 2 : gameStateRef.current.paddle1.height;
    const rightHeight = rightPlayer === servingPlayer ? gameStateRef.current.paddle2.height * 2 : gameStateRef.current.paddle2.height;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw paddles
      context.fillRect(gameStateRef.current.paddle1.x, gameStateRef.current.paddle1.y, gameStateRef.current.paddle1.width, leftHeight);
      context.fillRect(gameStateRef.current.paddle2.x, gameStateRef.current.paddle2.y, gameStateRef.current.paddle2.width, rightHeight);

      // Draw ball
      context.beginPath();
      context.arc(gameStateRef.current.ball.x, gameStateRef.current.ball.y, gameStateRef.current.ball.radius, 0, Math.PI * 2);
      context.fill();
    };

    const update = () => {
      // Update ball position
      const ball = gameStateRef.current.ball;
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Check for collisions with top and bottom walls
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
      }

      // Check for collisions with paddles
      const paddle1 = gameStateRef.current.paddle1;
      const paddle2 = gameStateRef.current.paddle2;

      // Update ball collision detection and response
      if (ball.x - ball.radius < paddle1.x + paddle1.width && ball.y > paddle1.y && ball.y < paddle1.y + leftHeight) {
        const bounceAngle = getBounceAngle(paddle1.y, leftHeight, ball.y);
        ball.dx = ball.speed * Math.cos(bounceAngle);
        ball.dy = ball.speed * -Math.sin(bounceAngle);
        ball.x = paddle1.x + paddle1.width + ball.radius; // Adjust ball position to avoid sticking
      } else if (ball.x + ball.radius > paddle2.x && ball.y > paddle2.y && ball.y < paddle2.y + rightHeight) {
        const bounceAngle = getBounceAngle(paddle2.y, rightHeight, ball.y);
        ball.dx = -ball.speed * Math.cos(bounceAngle);
        ball.dy = ball.speed * -Math.sin(bounceAngle);
        ball.x = paddle2.x - ball.radius; // Adjust ball position to avoid sticking
      }

      // Check for scoring
      if (ball.x - ball.radius < 0) {
        dispatch({ type: "POINT_SCORED", player: rightPlayer });
        resetBall();
      } else if (ball.x + ball.radius > canvas.width) {
        dispatch({ type: "POINT_SCORED", player: leftPlayer });
        resetBall();
      }

      // Update paddle positions based on input
      if (inputRef.current) {
        const { [leftPlayer]: input1, [rightPlayer]: input2 } = inputRef.current;

        paddle1.dy = getPaddleDirection(input1.lastData || new Uint8Array());
        paddle1.y += paddle1.dy;

        paddle2.dy = getPaddleDirection(input2.lastData || new Uint8Array());
        paddle2.y += paddle2.dy;

        // Ensure paddles stay within screen bounds
        if (paddle1.y < 0) paddle1.y = 0;
        if (paddle1.y + leftHeight > canvas.height) paddle1.y = canvas.height - leftHeight;

        if (paddle2.y < 0) paddle2.y = 0;
        if (paddle2.y + rightHeight > canvas.height) paddle2.y = canvas.height - rightHeight;
      }

      draw();
    };

    const resetBall = () => {
      const ball = gameStateRef.current.ball;
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = -ball.dx;
      ball.dy = 0;
    };
    let loopId: null | number = null;
    const gameLoop = () => {
      update();
      loopId = requestAnimationFrame(gameLoop);
    };

    loopId = requestAnimationFrame(gameLoop);

    return () => {
      // Cleanup on unmount
      if (loopId !== null) {
        cancelAnimationFrame(loopId);
      }
    };
  }, [inputRef, gameStateRef, dispatch, servingPlayer, servingEnd, paused, leftPlayer, rightPlayer]);

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
      <h1>
        {leftPlayer} --- {rightPlayer}
      </h1>
      <canvas ref={canvasRef} width={500} height={300} />;
    </div>
  );
};

function getPaddleDirection(data: Uint8Array) {
  return 128 - data[6];
}

export default GameCanvas;

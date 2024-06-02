import React, { useRef, useEffect } from "react";
import { Action } from "../libs/score";
import { COURT, DELTA_TIME_DIVISOR, PADDLE, PLAYER_COLOURS, SERVING_HEIGHT_MULTIPLIER } from "../config";
import "./GameCanvas.css";
import { GetPlayerActionsFunction, MatchState, MutableGameState, Player, PlayerPositions } from "../types";
import GameScore from "./GameScore";
import useSynthesizer, { NoteType } from "../hooks/playNote";
import { GameEventType, draw, resetBall, updateGameState } from "../libs/game";

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<MutableGameState>;
  dispatch: React.Dispatch<Action>;
  matchState: MatchState;
  paused: boolean;
  leftPlayer: Player;
  rightPlayer: Player;

  getPlayerActions: GetPlayerActionsFunction;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, dispatch, matchState, paused, leftPlayer, rightPlayer, getPlayerActions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deltaTimeRef = useRef(0);
  const playNote = useSynthesizer();

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

    if (positionsReversed) {
      gameStateRef.current.paddle1.colour = PLAYER_COLOURS[Player.Player2];
      gameStateRef.current.paddle2.colour = PLAYER_COLOURS[Player.Player1];
    } else {
      gameStateRef.current.paddle1.colour = PLAYER_COLOURS[Player.Player1];
      gameStateRef.current.paddle2.colour = PLAYER_COLOURS[Player.Player2];
    }

    const handleGameEvent = (event: GameEventType) => {
      switch (event) {
        case GameEventType.ResetBall:
          resetBall(
            gameStateRef.current,
            (servingPlayer === Player.Player1 && !positionsReversed) || (servingPlayer === Player.Player2 && positionsReversed)
          );
          break;
        case GameEventType.ScorePointLeft:
          dispatch({ type: "POINT_SCORED", player: rightPlayer, stats: { ...gameStateRef.current.stats } });
          playNote(positionsReversed ? NoteType.WinPoint : NoteType.LoosePoint);
          break;
        case GameEventType.ScorePointRight:
          dispatch({ type: "POINT_SCORED", player: leftPlayer, stats: { ...gameStateRef.current.stats } });
          playNote(!positionsReversed ? NoteType.WinPoint : NoteType.LoosePoint);
          break;
        case GameEventType.HitPaddle:
          playNote(NoteType.Paddle);
          break;
        case GameEventType.WallContact:
          playNote(NoteType.WallContact);
          break;
        case GameEventType.Serve:
          dispatch({ type: "CLEAR_EVENTS" });

          gameStateRef.current.stats.rallyLength += 1;
          gameStateRef.current.stats.serveSpeed = Math.abs(gameStateRef.current.ball.dy) + Math.abs(gameStateRef.current.ball.dx);
          gameStateRef.current.stats.server = servingPlayer;
          playNote(NoteType.Paddle);
          break;
        default:
          return;
      }
    };

    const update = (deltaTime: number) => {
      // getPlayerActions using current state
      const leftPlayerActions = getPlayerActions(leftPlayer, gameStateRef.current, canvas, positionsReversed);
      const rightPlayerActions = getPlayerActions(rightPlayer, gameStateRef.current, canvas, positionsReversed);
      // Update game state based on actions
      updateGameState(gameStateRef.current, leftPlayerActions, rightPlayerActions, servingPlayer, positionsReversed, deltaTime, handleGameEvent);
    };

    let loopId: null | number = null;
    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - deltaTimeRef.current) / DELTA_TIME_DIVISOR;
      deltaTimeRef.current = timestamp;
      update(deltaTime);
      draw(gameStateRef.current, canvas, context);
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

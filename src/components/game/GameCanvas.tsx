import React, { useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { Action } from "../../libs/score";
import { COURT, DELTA_TIME_DIVISOR } from "../../config";
import "./GameCanvas.css";
import { GetPlayerActionsFunction, MatchState, MutableGameState, Player } from "../../types";
import GameScore from "./GameScore";
import { GameEventType, applyMetaGameState, resetBall, updateGameState } from "../../libs/game";
import { initDrawingContext } from "../../libs/webgl";

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<MutableGameState>;
  dispatch: React.Dispatch<Action>;
  matchState: MatchState;
  paused: boolean;
  leftPlayer: Player;
  rightPlayer: Player;
  getPlayer1Actions: GetPlayerActionsFunction;
  getPlayer2Actions: GetPlayerActionsFunction;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameStateRef,
  dispatch,
  matchState,
  leftPlayer,
  rightPlayer,
  paused,
  getPlayer1Actions,
  getPlayer2Actions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webGlRef = useRef<ReturnType<typeof initDrawingContext> | null>(null);
  const deltaTimeRef = useRef(0);

  const { servingPlayer, playerPositions } = matchState;

  const handleGameEvent = useCallback(
    (event: GameEventType) => {
      switch (event) {
        case GameEventType.ScorePointLeft:
          dispatch({ type: "POINT_SCORED", player: rightPlayer, stats: { ...gameStateRef.current.stats } });
          break;
        case GameEventType.ScorePointRight:
          dispatch({ type: "POINT_SCORED", player: leftPlayer, stats: { ...gameStateRef.current.stats } });
          break;
        case GameEventType.HitPaddle:
          dispatch({ type: "HIT_PADDLE" });
          break;
        case GameEventType.WallContact:
          dispatch({ type: "WALL_CONTACT" });
          break;
        case GameEventType.Serve:
          dispatch({ type: "SERVE" });
          break;
        default:
          return;
      }
    },
    [dispatch, gameStateRef, leftPlayer, rightPlayer]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawingContext = initDrawingContext(canvas);
    console.log("init drawing context");
    webGlRef.current = drawingContext;
    return () => {
      drawingContext?.cleanup();
    };
  }, []);

  useLayoutEffect(() => {
    if (paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { draw } = webGlRef.current ?? {};
    if (!draw) return;
    const gameState = gameStateRef.current;

    console.log("applying meta game state");
    applyMetaGameState(gameState, servingPlayer, playerPositions);
    resetBall(gameState);

    const update = (deltaTime: number) => {
      // getPlayerActions using current state
      const actions = {
        [Player.Player1]: getPlayer1Actions(Player.Player1, gameState, canvas, deltaTimeRef.current),
        [Player.Player2]: getPlayer2Actions(Player.Player2, gameState, canvas, deltaTimeRef.current),
      };
      // Update game state based on actions
      updateGameState(gameState, actions, deltaTime, handleGameEvent);
    };

    let loopId: null | number = null;
    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - deltaTimeRef.current) / DELTA_TIME_DIVISOR;
      deltaTimeRef.current = timestamp;
      update(deltaTime);
      draw(gameState);
      loopId = requestAnimationFrame(gameLoop);
    };

    // set deltaTimeRef so that initial delta time is not crazy big
    deltaTimeRef.current = performance.now();
    console.log("starting game loop");
    loopId = requestAnimationFrame(gameLoop);

    return () => {
      // Cleanup on unmount
      if (loopId !== null) {
        console.log("stopping game loop");
        cancelAnimationFrame(loopId);
      }
    };
  }, [gameStateRef, getPlayer1Actions, getPlayer2Actions, handleGameEvent, paused, playerPositions, servingPlayer]);

  return (
    <div className={`game-canvas-container`}>
      <GameScore leftPlayer={leftPlayer} rightPlayer={rightPlayer} matchState={matchState} />
      <canvas className={`game-canvas`} ref={canvasRef} width={COURT.width} height={COURT.height} />
    </div>
  );
};

export default GameCanvas;

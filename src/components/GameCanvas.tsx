import React, { useRef, useEffect, useCallback } from "react";
import { Action } from "../libs/score";
import { COURT, DELTA_TIME_DIVISOR } from "../config";
import "./GameCanvas.css";
import { GetPlayerActionsFunction, MatchState, MutableGameState, Player } from "../types";
import GameScore from "./GameScore";
import useSynthesizer, { NoteType } from "../hooks/playNote";
import { GameEventType, applyMetaGameState, draw, updateGameState } from "../libs/game";

interface GameCanvasProps {
  gameStateRef: React.MutableRefObject<MutableGameState>;
  dispatch: React.Dispatch<Action>;
  matchState: MatchState;
  paused: boolean;
  leftPlayer: Player;
  rightPlayer: Player;

  getPlayerActions: GetPlayerActionsFunction;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameStateRef, dispatch, matchState, leftPlayer, rightPlayer, paused, getPlayerActions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deltaTimeRef = useRef(0);
  const playNote = useSynthesizer();

  const { servingPlayer, playerPositions } = matchState;

  const handleGameEvent = useCallback(
    (event: GameEventType) => {
      console.log(event);
      switch (event) {
        case GameEventType.ScorePointLeft:
          dispatch({ type: "POINT_SCORED", player: rightPlayer, stats: { ...gameStateRef.current.stats } });
          playNote(gameStateRef.current.positionsReversed ? NoteType.WinPoint : NoteType.LoosePoint);
          break;
        case GameEventType.ScorePointRight:
          dispatch({ type: "POINT_SCORED", player: leftPlayer, stats: { ...gameStateRef.current.stats } });
          playNote(!gameStateRef.current.positionsReversed ? NoteType.WinPoint : NoteType.LoosePoint);
          break;
        case GameEventType.HitPaddle:
          playNote(NoteType.Paddle);
          break;
        case GameEventType.WallContact:
          playNote(NoteType.WallContact);
          break;
        case GameEventType.Serve:
          dispatch({ type: "CLEAR_EVENTS" });
          playNote(NoteType.Paddle);
          break;
        default:
          return;
      }
    },
    [dispatch, playNote, gameStateRef, leftPlayer, rightPlayer]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (paused) return;
    console.log("render");

    applyMetaGameState(gameStateRef.current, servingPlayer, playerPositions);

    const update = (deltaTime: number) => {
      // getPlayerActions using current state
      const actions = {
        [Player.Player1]: getPlayerActions(Player.Player1, gameStateRef.current, canvas),
        [Player.Player2]: getPlayerActions(Player.Player2, gameStateRef.current, canvas),
      };
      // Update game state based on actions
      updateGameState(gameStateRef.current, actions, deltaTime, handleGameEvent);
    };

    let loopId: null | number = null;
    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - deltaTimeRef.current) / DELTA_TIME_DIVISOR;
      deltaTimeRef.current = timestamp;
      update(deltaTime);
      // update(1.5);
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
  }, [gameStateRef, getPlayerActions, handleGameEvent, paused, playerPositions, servingPlayer]);

  return (
    <div className={`game-canvas-container`}>
      <GameScore leftPlayer={leftPlayer} rightPlayer={rightPlayer} matchState={matchState} />
      <canvas className={`game-canvas`} ref={canvasRef} width={COURT.width} height={COURT.height} />
    </div>
  );
};

export default GameCanvas;

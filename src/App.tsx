import React, { useReducer, useRef } from "react";
import useDJHeroInput from "./ConnectDevices";
import GameCanvas from "./GameCanvas";
import { initialState, reducer } from "./score";
import Scoreboard from "./Scoreboard";

export interface GameState {
  paddle1: { x: number; y: number; dy: number; width: number; height: number };
  paddle2: { x: number; y: number; dy: number; width: number; height: number };
  ball: { x: number; y: number; dx: number; dy: number; radius: number; speed: number };
}

const App: React.FC = () => {
  const { connected, selectDevice, dataRef } = useDJHeroInput();
  const [matchState, dispatch] = useReducer(reducer, initialState);
  const gameStateRef = useRef<GameState>({
    paddle1: { x: 0, y: 125, dy: 0, width: 10, height: 50 },
    paddle2: { x: 500 - 10, y: 125, dy: 0, width: 10, height: 50 },
    ball: { x: 50, y: 150, dx: 5, dy: 0, radius: 5, speed: 5 },
  });

  return (
    <div>
      {String(connected)}
      <Scoreboard matchState={matchState} />
      <GameCanvas gameStateRef={gameStateRef} inputRef={dataRef} dispatch={dispatch} matchState={matchState} paused={!connected} />

      <button onClick={selectDevice}>select device</button>

      <pre>{JSON.stringify(matchState, null, 1)}</pre>
    </div>
  );
};

export default App;

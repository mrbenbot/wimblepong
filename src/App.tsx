import React, { useReducer, useRef } from "react";
import useDJHeroInput from "./ConnectDevices";
import GameCanvas from "./GameCanvas";
import { initialState, reducer } from "./score";
import { BALL, COURT, INITIAL_SPEED, PADDLE } from "./config";
import "./App.css";
import PlayerScore from "./PlayerScore";
import EventAnnouncement from "./EventAnnouncement";
import GameScore from "./GameScore";
import { Player, PlayerPositions } from "./types";

export interface GameState {
  paddle1: { x: number; y: number; dy: number; width: number; height: number };
  paddle2: { x: number; y: number; dy: number; width: number; height: number };
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    speed: number;
    serveMode: boolean;
  };
  stats: {
    rallyLength: number;
    serveSpeed: number;
    server: Player;
  };
}
const getLeftRightPlayer = (playerPositions: PlayerPositions) => {
  if (playerPositions === PlayerPositions.Reversed) {
    return { leftPlayer: Player.Player2, rightPlayer: Player.Player1 };
  }
  return { leftPlayer: Player.Player1, rightPlayer: Player.Player2 };
};

const App: React.FC = () => {
  const { connected, selectDevice, dataRef } = useDJHeroInput();
  const gameStateRef = useRef<GameState>({
    paddle1: { x: 0, y: COURT.height / 2 - PADDLE.height / 2, dy: 0, width: PADDLE.width, height: PADDLE.height },
    paddle2: { x: COURT.width - PADDLE.width, y: COURT.height / 2 - PADDLE.height / 2, dy: 0, width: PADDLE.width, height: PADDLE.height },
    ball: { x: PADDLE.width + BALL.radius, y: 150, dx: 0, dy: 0, radius: BALL.radius, speed: INITIAL_SPEED, serveMode: true },
    stats: { rallyLength: 0, serveSpeed: 0, server: Player.Player1 },
  });
  const [matchState, dispatch] = useReducer(reducer, initialState);
  const { leftPlayer, rightPlayer } = getLeftRightPlayer(matchState.playerPositions);
  // console.log(matchState);

  return (
    <>
      {matchState.events.map((event) => (
        <EventAnnouncement message={JSON.stringify(event)} />
      ))}
      <GameScore leftScore={matchState.gameState[leftPlayer]} rightScore={matchState.gameState[rightPlayer]} />
      <div className="main-container">
        {/* <Scoreboard matchState={matchState} /> */}
        <PlayerScore matchState={matchState} player={leftPlayer} />
        <GameCanvas
          gameStateRef={gameStateRef}
          inputRef={dataRef}
          dispatch={dispatch}
          matchState={matchState}
          paused={!connected}
          leftPlayer={leftPlayer}
          rightPlayer={rightPlayer}
        />
        <PlayerScore matchState={matchState} player={rightPlayer} />
      </div>
      {!connected && <button onClick={selectDevice}>select device</button>}
    </>
  );
};

export default App;

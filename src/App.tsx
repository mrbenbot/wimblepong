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
// import Scoreboard from "./Scoreboard";

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
  const containerDivRef = useRef(null);

  const handleFullscreen = () => {
    if (containerDivRef.current !== null) {
      const methods = [
        "requestFullscreen",
        "webkitRequestFullscreen", // Chrome, Safari, and Opera
      ];

      for (const method of methods) {
        if (method in containerDivRef.current) {
          const func = containerDivRef.current[method] as () => Promise<void>;
          func.call(containerDivRef.current);
          break;
        }
      }
    }
  };

  return (
    <>
      {/* <Scoreboard matchState={matchState} /> */}
      <div ref={containerDivRef} className="main-container">
        {matchState.events.map((event, i) => (
          <EventAnnouncement key={JSON.stringify(event) + i} message={JSON.stringify(event)} />
        ))}
        <GameScore leftPlayer={leftPlayer} rightPlayer={rightPlayer} matchState={matchState} />
        <div className="second-container">
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
      </div>
      {!connected && <button onClick={selectDevice}>select device</button>}
      <button onClick={handleFullscreen} className="full-screen-button">
        enter full screen
      </button>
    </>
  );
};

export default App;

import React, { useReducer, useRef } from "react";
import GameCanvas from "./GameCanvas";
import { initialState, reducer } from "../libs/score";
import { BALL, COURT, INITIAL_SPEED, PADDLE, PADDLE_GAP, PLAYER_COLOURS } from "../config";
import "./App.css";
import PlayerScore from "./PlayerScore";
import EventAnnouncement from "./EventAnnouncement";
import { GetPlayerActionsFunction, MatchState, MutableGameState, Player, PlayerPositions } from "../types";
import Scoreboard from "./Scoreboard";
import ScoreCircles from "./ScoreCircles";
import { hexToRgb } from "../libs/numbers";

const getLeftRightPlayer = (playerPositions: PlayerPositions) => {
  if (playerPositions === PlayerPositions.Reversed) {
    return { leftPlayer: Player.Player2, rightPlayer: Player.Player1 };
  }
  return { leftPlayer: Player.Player1, rightPlayer: Player.Player2 };
};

const App: React.FC<{
  connected?: boolean;
  getPlayer1Actions: GetPlayerActionsFunction;
  getPlayer2Actions: GetPlayerActionsFunction;
  matchConfig: MatchState["matchConfig"];
}> = ({ connected = true, getPlayer1Actions, getPlayer2Actions, matchConfig }) => {
  const gameStateRef = useRef<MutableGameState>({
    server: Player.Player1,
    positionsReversed: false,
    [Player.Player1]: {
      x: PADDLE_GAP,
      y: COURT.height / 2 - PADDLE.height / 2,
      dy: 0,
      width: PADDLE.width,
      height: PADDLE.height,
      colour: hexToRgb(PLAYER_COLOURS[Player.Player1]),
    },
    [Player.Player2]: {
      x: COURT.width - PADDLE.width - PADDLE_GAP,
      y: COURT.height / 2 - PADDLE.height / 2,
      dy: 0,
      width: PADDLE.width,
      height: PADDLE.height,
      colour: hexToRgb(PLAYER_COLOURS[Player.Player2]),
    },
    ball: {
      x: PADDLE.width + BALL.radius + PADDLE_GAP,
      y: 150,
      dx: 0,
      dy: 0,
      radius: BALL.radius,
      speed: INITIAL_SPEED,
      serveMode: true,
      scoreModeTimeout: 0,
      scoreMode: false,
    },
    stats: { rallyLength: 0, serveSpeed: 0, server: Player.Player1 },
  });
  const [matchState, dispatch] = useReducer(reducer, { ...initialState, matchConfig });
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
      <div ref={containerDivRef} className="main-container">
        <div className="game-announcements-wrapper">
          {matchState.events.map((event, i) => (
            <EventAnnouncement key={JSON.stringify(event) + i} event={event} />
          ))}
        </div>

        <main className="second-container">
          <header className="header">
            <Scoreboard matchState={matchState} />
            {/* <ScoreCircles matchState={matchState} /> */}
          </header>
          <PlayerScore matchState={matchState} player={leftPlayer} />
          <GameCanvas
            gameStateRef={gameStateRef}
            dispatch={dispatch}
            matchState={matchState}
            paused={!connected}
            leftPlayer={leftPlayer}
            rightPlayer={rightPlayer}
            getPlayer1Actions={getPlayer1Actions}
            getPlayer2Actions={getPlayer2Actions}
          />
          <PlayerScore matchState={matchState} player={rightPlayer} />
          <footer className="footer">
            <p className="match-info">
              Best of {matchState.matchConfig.numberOfSets} sets. Set length {matchState.matchConfig.setLength} games.
            </p>
            <div>
              <button onClick={handleFullscreen} className="full-screen-button">
                enter full screen
              </button>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default App;

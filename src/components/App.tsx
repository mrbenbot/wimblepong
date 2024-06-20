import { useEffect, useReducer, useRef } from "react";
import GameCanvas from "./GameCanvas";
import { getLeftRightPlayer, initialState, reducer } from "../libs/score";
import "./App.css";
import PlayerScore from "./PlayerScore";
import EventAnnouncement from "./EventAnnouncement";
import { GetPlayerActionsFunction, MatchState, MutableGameState } from "../types";
import Scoreboard from "./Scoreboard";
import useFullscreen from "../hooks/useFullScreen";
import { loadState, saveState } from "../libs/localStorage";
import { initialGameState } from "../libs/game";

interface AppProps {
  connected?: boolean;
  getPlayer1Actions: GetPlayerActionsFunction;
  getPlayer2Actions: GetPlayerActionsFunction;
  matchConfig: MatchState["matchConfig"];
}

const App = ({ connected = true, getPlayer1Actions, getPlayer2Actions, matchConfig }: AppProps) => {
  const gameStateRef = useRef<MutableGameState>(initialGameState);
  const [matchState, dispatch] = useReducer(reducer, { ...initialState, matchConfig }, (initial) => loadState() || initial);
  const [isFullScreen, toggleFullScreen] = useFullscreen();

  useEffect(() => {
    saveState(matchState);
  }, [matchState]);

  const { leftPlayer, rightPlayer } = getLeftRightPlayer(matchState.playerPositions);
  return (
    <>
      <div className="main-container">
        <div className="game-announcements-wrapper">
          {matchState.events.map((event, i) => (
            <EventAnnouncement key={JSON.stringify(event) + i} event={event} />
          ))}
        </div>

        <main className="second-container">
          <header className="header">
            <Scoreboard matchState={matchState} />
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
              {!isFullScreen && (
                <button onClick={toggleFullScreen} className="full-screen-button">
                  enter full screen
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default App;

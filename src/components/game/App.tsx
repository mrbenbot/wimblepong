import { useEffect, useMemo, useReducer, useRef } from "react";
import GameCanvas from "./GameCanvas";
import { getLeftRightPlayer, initialState, reducer } from "../../libs/score";
import PlayerScore from "./PlayerScore";
import EventAnnouncement from "./EventAnnouncement";
import { GetPlayerActionsFunction, MatchState, MutableGameState, Player } from "../../types";
import Scoreboard from "./Scoreboard";
import useFullscreen from "../../hooks/useFullScreen";
import { loadItem, saveItem } from "../../libs/localStorage";
import { initialGameState } from "../../libs/game";
import "./App.css";
import useSynthesizer from "../../hooks/useSynthesizer";
import soundMiddleware from "../../libs/soundMiddleware";
import { useLocation, useNavigate } from "react-router-dom";
import { MATCH_STATE_KEY } from "../../config";
import { hexToRgb } from "../../libs/numbers";

interface AppProps {
  connected?: boolean;
  getPlayer1Actions: GetPlayerActionsFunction;
  getPlayer2Actions: GetPlayerActionsFunction;
  matchConfig: MatchState["matchConfig"];
}

function getInitialGameState(matchConfig: MatchState["matchConfig"]):MutableGameState {
  return {
    ...initialGameState,
    [Player.Player1]: { ...initialGameState[Player.Player1], colour: hexToRgb(matchConfig.colors[Player.Player1]) },
    [Player.Player2]: { ...initialGameState[Player.Player2], colour: hexToRgb(matchConfig.colors[Player.Player2]) },
  };
}

const App = ({ connected = true, getPlayer1Actions, getPlayer2Actions, matchConfig }: AppProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const gameStateRef = useRef<MutableGameState>(getInitialGameState(matchConfig));
  const playNote = useSynthesizer();
  const reducerWithMiddleware = useMemo(() => soundMiddleware(playNote)(reducer), [playNote]);

  const [matchState, dispatch] = useReducer(
    reducerWithMiddleware,
    { ...initialState, matchConfig },
    (initial) => loadItem(MATCH_STATE_KEY) || initial
  );
  const [isFullScreen, toggleFullScreen] = useFullscreen();

  useEffect(() => {
    saveItem(MATCH_STATE_KEY, matchState);
    let id = null;
    if (matchState.matchWinner !== undefined) {
      id = setTimeout(() => {
        navigate("/gameover", { state: { matchState, path: location.pathname } });
      }, 3000);
    }
    return () => {
      if (id) {
        clearTimeout(id);
      }
    };
  }, [matchState, navigate, location]);

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
            <div>
              <p className="match-info">
                Best of {matchState.matchConfig.numberOfSets} sets. Set length {matchState.matchConfig.setLength} games.
              </p>
            </div>
            <div>
              <Scoreboard matchState={matchState} />
            </div>
            <div>
              {!isFullScreen && (
                <button onClick={toggleFullScreen} className="full-screen-button">
                  enter full screen
                </button>
              )}
            </div>
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
          <footer className="footer"></footer>
        </main>
      </div>
    </>
  );
};

export default App;

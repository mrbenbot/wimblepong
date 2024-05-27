import "./Scoreboard.css";
import { PLAYER_COLOURS } from "./config";
import { MatchState, Player } from "./types";

const Scoreboard = ({ matchState }: { matchState: MatchState }) => {
  const { sets, games, tiebreak, servingPlayer, gameState, matchConfig } = matchState;

  const isTieBreak =
    games.Player1 === matchConfig.setLength && games.Player2 === matchConfig.setLength && sets.length + 1 !== matchState.matchConfig.numberOfSets;

  return (
    <div className="scoreboard">
      <div className="row">
        <div className="cell">{sets.map((set) => set.Player1).join(" ")}</div>
        <div className="cell" style={{ color: PLAYER_COLOURS[Player.Player1] }}>
          Player 1 {servingPlayer === Player.Player1 ? "🔴" : " "}
        </div>
        <div className="cell">{sets.map((set) => set[Player.Player1] > set[Player.Player2]).length}</div>
        <div className="cell">{games[Player.Player1]}</div>
        <div className="cell">{isTieBreak ? tiebreak[Player.Player1] : gameState[Player.Player1]}</div>
      </div>
      <div className="row">
        <div className="cell">{sets.map((set) => set.Player2).join(" ")}</div>
        <div className="cell" style={{ color: PLAYER_COLOURS[Player.Player2] }}>
          Player 2 {servingPlayer === Player.Player2 ? "🔴" : " "}
        </div>
        <div className="cell">{sets.map((set) => set[Player.Player2] > set[Player.Player1]).length}</div>
        <div className="cell">{games[Player.Player2]}</div>
        <div className="cell">{isTieBreak ? tiebreak[Player.Player2] : gameState[Player.Player2]}</div>
      </div>
    </div>
  );
};

export default Scoreboard;

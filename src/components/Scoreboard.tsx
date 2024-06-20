import "./Scoreboard.css";
import { PLAYER_COLOURS } from "../config";
import { MatchState, Player, Score } from "../types";

const scoreMap: {
  [key in Score]?: string;
} = {
  [Score.Advantage]: "AD",
};

const Scoreboard = ({ matchState }: { matchState: MatchState }) => {
  const { sets, games, tiebreak, servingPlayer, gameState, matchConfig } = matchState;

  const isTieBreak =
    games[Player.Player1] === matchConfig.setLength &&
    games[Player.Player2] === matchConfig.setLength &&
    sets.length + 1 !== matchState.matchConfig.numberOfSets;

  const longestNameLength = Math.max(matchConfig.names[Player.Player1].length, matchConfig.names[Player.Player2].length);

  return (
    <div className="scoreboard">
      <div className="row">
        {sets.map((set) => (
          <div className="cell number-cell">{set[Player.Player1]}</div>
        ))}
        <div
          className="cell player-cell"
          style={{
            color: PLAYER_COLOURS[Player.Player1],
            textDecoration: servingPlayer === Player.Player1 ? "underline" : " ",
            width: longestNameLength * 10,
            textAlign: "left",
          }}
        >
          {matchConfig.names[Player.Player1]}
        </div>
        <div className="cell number-cell">{sets.filter((set) => set[Player.Player1] > set[Player.Player2]).length}</div>
        <div className="cell number-cell">{games[Player.Player1]}</div>
        <div className="cell game-cell">
          {isTieBreak ? tiebreak[Player.Player1] : scoreMap?.[gameState[Player.Player1]] ?? gameState[Player.Player1]}
        </div>
      </div>
      <div className="row">
        {sets.map((set) => (
          <div className="cell number-cell">{set[Player.Player2]}</div>
        ))}
        <div
          className="cell player-cell"
          style={{
            color: PLAYER_COLOURS[Player.Player2],
            textDecoration: servingPlayer === Player.Player2 ? "underline" : " ",
            textAlign: "left",
            width: longestNameLength * 10,
          }}
        >
          {matchConfig.names[Player.Player2]}
        </div>
        <div className="cell number-cell">{sets.filter((set) => set[Player.Player2] > set[Player.Player1]).length}</div>
        <div className="cell number-cell">{games[Player.Player2]}</div>
        <div className="cell game-cell">
          {isTieBreak ? tiebreak[Player.Player2] : scoreMap?.[gameState[Player.Player2]] ?? gameState[Player.Player2]}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;

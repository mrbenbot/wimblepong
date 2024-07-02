import "./Scoreboard.css";
import { PLAYER_COLOURS } from "../../config";
import { MatchState, Player, Score } from "../../types";
import { isTiebreak } from "../../libs/score";

const scoreMap: {
  [key in Score]?: string;
} = {
  [Score.Advantage]: "AD",
};

const Scoreboard = ({ matchState }: { matchState: MatchState }) => {
  const { sets, games, tiebreak, servingPlayer, gameState, matchConfig } = matchState;

  const inTiebreak = isTiebreak(matchState);

  const longestNameLength = Math.max(matchConfig.names[Player.Player1].length, matchConfig.names[Player.Player2].length);

  return (
    <div className="scoreboard">
      <div className="row">
        {sets.map((set, i) => (
          <div className="cell number-cell" key={i}>
            {set[Player.Player1]}
          </div>
        ))}
        <div
          className="cell player-cell"
          style={{
            color: PLAYER_COLOURS[Player.Player1],
            textDecoration: servingPlayer === Player.Player1 ? "underline" : " ",
            width: `calc(0.6em * ${longestNameLength})`,
            textAlign: "left",
          }}
        >
          {matchConfig.names[Player.Player1]}
        </div>
        <div className="cell number-cell">{sets.filter((set) => set[Player.Player1] > set[Player.Player2]).length}</div>
        <div className="cell number-cell">{games[Player.Player1]}</div>
        <div className="cell game-cell">
          {inTiebreak ? tiebreak[Player.Player1] : scoreMap?.[gameState[Player.Player1]] ?? gameState[Player.Player1]}
        </div>
      </div>
      <div className="row">
        {sets.map((set, i) => (
          <div className="cell number-cell" key={i}>
            {set[Player.Player2]}
          </div>
        ))}
        <div
          className="cell player-cell"
          style={{
            color: PLAYER_COLOURS[Player.Player2],
            textDecoration: servingPlayer === Player.Player2 ? "underline" : " ",
            textAlign: "left",
            width: `calc(0.6em * ${longestNameLength})`,
          }}
        >
          {matchConfig.names[Player.Player2]}
        </div>
        <div className="cell number-cell">{sets.filter((set) => set[Player.Player2] > set[Player.Player1]).length}</div>
        <div className="cell number-cell">{games[Player.Player2]}</div>
        <div className="cell game-cell">
          {inTiebreak ? tiebreak[Player.Player2] : scoreMap?.[gameState[Player.Player2]] ?? gameState[Player.Player2]}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;

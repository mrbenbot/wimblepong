import "./PlayerScore.css";
import { PLAYER_COLOURS } from "../config";
import { MatchState, Player } from "../types";

const PlayerScore = ({ matchState, player }: { matchState: MatchState; player: Player }) => {
  const { sets, games, servingPlayer, matchConfig } = matchState;

  const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;

  return (
    <div className="player-score">
      <h2 className="player display-item" style={{ color: PLAYER_COLOURS[player] }}>
        {matchConfig.names[player]}
      </h2>
      <p className="serving display-item">{servingPlayer === player ? "(serving)" : ""}</p>
      <h3 className="games display-item">
        <span>GAMES:</span>
        <span className="score-number">{games[player]}</span>
      </h3>
      <h3 className="sets display-item">
        <span>SETS:</span>
        <span className="score-number">{sets.filter((set) => set[player] > set[opponent]).length}</span>
      </h3>
    </div>
  );
};

export default PlayerScore;

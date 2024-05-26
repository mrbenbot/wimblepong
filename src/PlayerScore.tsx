import "./PlayerScore.css";
import { PLAYER_COLOURS } from "./config";
import { MatchState, Player } from "./types";

const PlayerScore = ({ matchState, player }: { matchState: MatchState; player: Player }) => {
  const { sets, games, servingPlayer } = matchState;

  const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;
  return (
    <div className="player-score">
      <h2 className="cell" style={{ color: PLAYER_COLOURS[player] }}>
        {player} {servingPlayer === player ? "🔴" : " "}
      </h2>
      <h3 className="cell">GAMES: {games[player]}</h3>
      <h3 className="cell">SETS: {sets.map((set) => set[player] > set[opponent]).length}</h3>
    </div>
  );
};

export default PlayerScore;

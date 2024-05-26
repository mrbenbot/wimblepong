import "./PlayerScore.css";
import { PLAYER_COLOURS } from "./config";
import { MatchState, Player } from "./types";

const PlayerScore = ({ matchState, player }: { matchState: MatchState; player: Player }) => {
  const { sets, games, tiebreak, servingPlayer, gameState } = matchState;

  const isTieBreak = games.Player1 === 6 && games.Player2 === 6 && sets.length + 1 !== matchState.matchConfig.setsToWin;
  const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;
  return (
    <div className="player-score">
      <h2 className="cell" style={{ color: PLAYER_COLOURS[player] }}>
        {player} {servingPlayer === player ? "🔴" : " "}
      </h2>
      <h3 className="cell">SCORE {isTieBreak ? tiebreak[player] : gameState[player]}</h3>
      <h3 className="cell">GAMES {games[player]}</h3>
      <h3 className="cell">SETS: {sets.map((set) => set[player] > set[opponent]).length}</h3>
      {/* <h4 className="cell">{sets.map((set) => set[player]).join(" ")}</h4> */}
    </div>
  );
};

export default PlayerScore;

import "./Scoreboard.css";
import { MatchState, Player } from "./score";

const Scoreboard = ({ matchState }: { matchState: MatchState }) => {
  const { sets, games, tiebreak, servingPlayer, gameState } = matchState;

  const isTieBreak = games.Player1 === 6 && games.Player2 === 6 && sets.length + 1 !== matchState.matchConfig.setsToWin;

  return (
    <div className="scoreboard">
      <div className="row header">
        <div className="cell">Previous Sets</div>
        <div className="cell">Player</div>
        <div className="cell">Sets</div>
        <div className="cell">Games</div>
        <div className="cell">Points</div>
      </div>
      <div className="row">
        <div className="cell">{sets.map((set) => set.Player1).join(" ")}</div>
        <div className="cell" style={{ color: servingPlayer === Player.Player1 ? "red" : "white" }}>
          Player 1
        </div>
        <div className="cell">{sets.map((set) => set[Player.Player1] > set[Player.Player2]).length}</div>
        <div className="cell">{games[Player.Player1]}</div>
        <div className="cell">{isTieBreak ? tiebreak[Player.Player1] : gameState.AdvantagePlayer === Player.Player1 ? "ADV." : gameState[Player.Player1]}</div>
      </div>
      <div className="row">
        <div className="cell">{sets.map((set) => set.Player2).join(" ")}</div>
        <div className="cell" style={{ color: servingPlayer === Player.Player2 ? "red" : "white" }}>
          Player 2
        </div>
        <div className="cell">{sets.map((set) => set[Player.Player2] > set[Player.Player1]).length}</div>
        <div className="cell">{games[Player.Player2]}</div>
        <div className="cell">{isTieBreak ? tiebreak[Player.Player2] : gameState.AdvantagePlayer === Player.Player2 ? "ADV." : gameState[Player.Player2]}</div>
      </div>
    </div>
  );
};

export default Scoreboard;

import { useLocation, useNavigate } from "react-router-dom";
import "./GameOver.css";
import { MatchState, Player, PointType } from "../types";
import { ReactNode } from "react";
import { clearItem } from "../libs/localStorage";
import { MATCH_STATE_KEY } from "../config";

const GameOver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sets, rallies, matchWinner, matchConfig } = location.state.matchState as MatchState;

  const getOpponent = (player: Player) => (player === Player.Player1 ? Player.Player2 : Player.Player1);

  const countSetsWon = (player: Player) => sets.filter((set) => set[player] > set[getOpponent(player)]).length;

  const countPointsWon = (player: Player) => rallies.filter((rally) => rally.winner === player).length;

  const averageRallyLength = () => rallies.reduce((sum, rally) => sum + rally.stats.rallyLength, 0) / rallies.length;

  const longestRally = () => Math.max(...rallies.map((rally) => rally.stats.rallyLength));

  const countAces = (player: Player) => rallies.filter((rally) => rally.stats.server === player && rally.stats.rallyLength === 1).length;

  const averageServeSpeed = (player: Player) => {
    const playerRallies = rallies.filter((rally) => rally.stats.server === player);
    return playerRallies.reduce((sum, rally) => sum + rally.stats.serveSpeed, 0) / playerRallies.length;
  };

  const countBreakPointsWon = (player: Player) =>
    rallies.filter(
      (rally) =>
        [PointType.BreakPoint, PointType.BreakSetPoint, PointType.BreakMatchPoint].includes(rally.pointType) &&
        rally.stats.server === getOpponent(player) &&
        rally.winner === player
    ).length;

  const countSetPointsWon = (player: Player) =>
    rallies.filter(
      (rally) =>
        ([PointType.SetPoint, PointType.MatchPoint].includes(rally.pointType) && rally.stats.server === player && rally.winner === player) ||
        ([PointType.BreakSetPoint, PointType.BreakMatchPoint].includes(rally.pointType) &&
          rally.stats.server === getOpponent(player) &&
          rally.winner === player)
    ).length;

  const totalBreakPointsPlayed = (player: Player) =>
    rallies.filter(
      (rally) =>
        [PointType.BreakPoint, PointType.BreakSetPoint, PointType.BreakMatchPoint].includes(rally.pointType) &&
        rally.stats.server === getOpponent(player)
    ).length;

  const totalSetPointsPlayed = (player: Player) =>
    rallies.filter(
      (rally) =>
        ([PointType.SetPoint, PointType.MatchPoint].includes(rally.pointType) && rally.stats.server === player) ||
        ([PointType.BreakSetPoint, PointType.BreakMatchPoint].includes(rally.pointType) && rally.stats.server === getOpponent(player))
    ).length;

  const countGamesWon = (player: Player) => sets.reduce((total, set) => total + set[player], 0);

  const renderStatRow = (title: string, player1Stat: ReactNode, player2Stat: ReactNode) => (
    <div className="stat-row">
      <div className="stat-value">{player1Stat}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{player2Stat}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className="match-statistics">
        <h2 className="stat-heading">Match Statistics</h2>
        <div className="stat-header">
          <div className={matchWinner === Player.Player1 ? `celebratory-colors` : ""}>{matchConfig.names[Player.Player1]}</div>
          <div className={matchWinner === Player.Player2 ? `celebratory-colors` : ""}>{matchConfig.names[Player.Player2]}</div>
        </div>
        {renderStatRow(
          "Winner",
          matchWinner === Player.Player1 ? <span className="celebratory-bounce">🏆</span> : "😢",
          matchWinner === Player.Player2 ? <span className="celebratory-bounce">🏆</span> : "😢"
        )}
        {renderStatRow("Points", countPointsWon(Player.Player1), countPointsWon(Player.Player2))}
        {renderStatRow("Games", countGamesWon(Player.Player1), countGamesWon(Player.Player2))}
        {renderStatRow("Sets", countSetsWon(Player.Player1), countSetsWon(Player.Player2))}
        {renderStatRow("Aces", countAces(Player.Player1), countAces(Player.Player2))}
        {renderStatRow("Av. serve speed", averageServeSpeed(Player.Player1).toFixed(2), averageServeSpeed(Player.Player2).toFixed(2))}
        {renderStatRow(
          "Br. points won",
          `${countBreakPointsWon(Player.Player1)}/${totalBreakPointsPlayed(Player.Player1)}`,
          `${countBreakPointsWon(Player.Player2)}/${totalBreakPointsPlayed(Player.Player2)}`
        )}
        {renderStatRow(
          "Set points won",
          `${countSetPointsWon(Player.Player1)}/${totalSetPointsPlayed(Player.Player1)}`,
          `${countSetPointsWon(Player.Player2)}/${totalSetPointsPlayed(Player.Player2)}`
        )}
        <p className="common-stat">
          <span>Average rally length:</span> {averageRallyLength().toFixed(2)}
          <span>Longest rally:</span> {longestRally()}
        </p>
        <div className="button-container">
          <button
            onClick={() => {
              clearItem(MATCH_STATE_KEY);
              navigate(location.state.path, { state: { matchConfig } });
            }}
          >
            rematch
          </button>
          <button
            onClick={() => {
              clearItem(MATCH_STATE_KEY);
              navigate("/play");
            }}
          >
            game setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;

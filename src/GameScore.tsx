import "./GameScore.css";
import { MatchState, Player, PointType, Score } from "./types";

const scoreMap: {
  [key in Score]?: string;
} = {
  [Score.Advantage]: "AD",
};

const pointMap: {
  [key in PointType]?: string;
} = {
  [PointType.Normal]: "",
  [PointType.Deuce]: "Deuce",
  [PointType.BreakPoint]: "Break Point",
  [PointType.GamePoint]: "Game Point",
  [PointType.SetPoint]: "Set Point",
  [PointType.MatchPoint]: "Match Point",
};

const GameScore = ({ leftPlayer, rightPlayer, matchState }: { leftPlayer: Player; rightPlayer: Player; matchState: MatchState }) => {
  const { gameState, matchConfig, games, tiebreak, sets } = matchState;
  const leftScore = gameState[leftPlayer];
  const rightScore = gameState[rightPlayer];
  const isTieBreak =
    games.Player1 === matchConfig.setLength && games.Player2 === matchConfig.setLength && sets.length + 1 !== matchState.matchConfig.numberOfSets;

  return (
    <div className="game-score-container">
      <div key={`left-${leftScore}`} className="score score-left new-score">
        {isTieBreak ? tiebreak[leftPlayer] : scoreMap?.[leftScore] ?? leftScore}
      </div>
      <div key={`middle-${matchState.pointType}`} className="score score-middle new-score">
        {pointMap?.[matchState.pointType] ?? matchState.pointType}
      </div>
      <div key={`right-${rightScore}`} className="score score-right new-score">
        {isTieBreak ? tiebreak[rightPlayer] : scoreMap?.[rightScore] ?? rightScore}
      </div>
    </div>
  );
};

export default GameScore;

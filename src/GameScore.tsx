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
  const leftScore = matchState.gameState[leftPlayer];
  const rightScore = matchState.gameState[rightPlayer];

  return (
    <div className="game-score-container">
      <div key={`left-${leftScore}`} className="score score-left new-score">
        {scoreMap?.[leftScore] ?? leftScore}
      </div>
      <div key={`middle-${matchState.pointType}`} className="score score-middle new-score">
        {pointMap?.[matchState.pointType] ?? matchState.pointType}
      </div>
      <div key={`right-${rightScore}`} className="score score-right new-score">
        {scoreMap?.[rightScore] ?? rightScore}
      </div>
    </div>
  );
};

export default GameScore;

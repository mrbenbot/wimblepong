import "./GameScore.css";
import { MatchState, Player, PointType, Score } from "../../types";
import { isTiebreak } from "../../libs/score";

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
  [PointType.BreakSetPoint]: "Set Point",
  [PointType.MatchPoint]: "Match Point",
  [PointType.BreakMatchPoint]: "Match Point",
};

const GameScore = ({ leftPlayer, rightPlayer, matchState }: { leftPlayer: Player; rightPlayer: Player; matchState: MatchState }) => {
  const { gameState, tiebreak } = matchState;
  const leftScore = gameState[leftPlayer];
  const rightScore = gameState[rightPlayer];
  const inTiebreak = isTiebreak(matchState);

  return (
    <div className="game-score-container">
      <div key={`left-${leftScore}`} className="score score-left new-score">
        {inTiebreak ? tiebreak[leftPlayer] : scoreMap?.[leftScore] ?? leftScore}
      </div>
      <div key={`middle-${matchState.pointType}`} className="score score-middle new-score">
        {pointMap?.[matchState.pointType] ?? matchState.pointType}
      </div>
      <div key={`right-${rightScore}`} className="score score-right new-score">
        {inTiebreak ? tiebreak[rightPlayer] : scoreMap?.[rightScore] ?? rightScore}
      </div>
    </div>
  );
};

export default GameScore;

import { useState, useEffect } from "react";
import "./GameScore.css";
import { PointType, Score } from "./types";

const scoreMap: {
  [key in Score]?: string;
} = {
  [Score.Advantage]: "AD",
};

const pointMap: {
  [key in PointType]?: string;
} = {
  [PointType.Normal]: "",
};

const GameScore = ({ leftScore, rightScore, pointType }: { leftScore: Score; rightScore: Score; pointType: PointType }) => {
  const [leftScoreState, setLeftScoreState] = useState(leftScore);
  const [rightScoreState, setRightScoreState] = useState(rightScore);
  const [leftKey, setLeftKey] = useState(0);
  const [rightKey, setRightKey] = useState(0);

  useEffect(() => {
    if (leftScore !== leftScoreState) {
      setLeftScoreState(leftScore);
      setLeftKey((prevKey) => prevKey + 1);
    }
  }, [leftScore, leftScoreState]);

  useEffect(() => {
    if (rightScore !== rightScoreState) {
      setRightScoreState(rightScore);
      setRightKey((prevKey) => prevKey + 1);
    }
  }, [rightScore, rightScoreState]);

  return (
    <div className="game-score-container">
      <div key={`left-${leftKey}`} className="score score-left new-score">
        {scoreMap?.[leftScoreState] ?? leftScoreState}
      </div>
      <div key={`middle-${leftKey}`} className="score score-middle new-score">
        {pointMap?.[pointType] ?? pointType}
      </div>
      <div key={`right-${rightKey}`} className="score score-right new-score">
        {scoreMap?.[rightScoreState] ?? rightScoreState}
      </div>
    </div>
  );
};

export default GameScore;

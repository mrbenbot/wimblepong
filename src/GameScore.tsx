import { useState, useEffect } from "react";
import "./GameScore.css";

const GameScore = ({ leftScore, rightScore }: { leftScore: string; rightScore: string }) => {
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
        {leftScoreState}
      </div>
      <div key={`right-${rightKey}`} className="score score-right new-score">
        {rightScoreState}
      </div>
    </div>
  );
};

export default GameScore;

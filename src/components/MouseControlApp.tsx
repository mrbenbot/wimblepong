import { useCallback } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";
import useMachineOpponent from "../hooks/useMachineOpponent";
import { getTensorFlowPlayer } from "../libs/tensorFlowPlayer";
import { useLocation, useParams } from "react-router-dom";

export default function MouseControlApp() {
  const location = useLocation();
  const { opponentType } = useParams<{ opponentType: "ai" | "auto" }>();
  const { getPlayerActions } = useMouseInput();

  const getComputerPlayer = useCallback(async () => {
    if (opponentType === "ai") {
      return getTensorFlowPlayer();
    } else {
      return getComputerPlayerActionsFunction();
    }
  }, [opponentType]);

  const { getComputerActions } = useMachineOpponent(getComputerPlayer);

  return <App getPlayer1Actions={getPlayerActions} getPlayer2Actions={getComputerActions} matchConfig={location.state.matchConfig} />;
}

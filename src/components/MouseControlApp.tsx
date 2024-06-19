import { useCallback } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { MatchState } from "../types";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";
import useMachineOpponent from "../hooks/useMachineOpponent";
import { getTensorFlowPlayer } from "../libs/tensorFlowPlayer";

export default function MouseControlApp({ matchConfig, opponentType }: { matchConfig: MatchState["matchConfig"]; opponentType: "ai" | "auto" }) {
  const { getPlayerActions } = useMouseInput();

  const getComputerPlayer = useCallback(async () => {
    if (opponentType === "ai") {
      return getTensorFlowPlayer();
    } else {
      return getComputerPlayerActionsFunction();
    }
  }, [opponentType]);

  const { getComputerActions } = useMachineOpponent(getComputerPlayer);

  return <App getPlayer1Actions={getPlayerActions} getPlayer2Actions={getComputerActions} matchConfig={matchConfig} />;
}

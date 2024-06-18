import { useCallback } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { MatchState } from "../types";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";
import useMachineOpponent from "../hooks/useMachineOpponent";

export default function MouseControlApp({ matchConfig }: { matchConfig: MatchState["matchConfig"]; mouseControl: boolean }) {
  const { getPlayerActions } = useMouseInput();
  const getComputerPlayer = useCallback(async () => getComputerPlayerActionsFunction(), []);
  const { getComputerActions } = useMachineOpponent(getComputerPlayer);

  return <App getPlayer1Actions={getPlayerActions} getPlayer2Actions={getComputerActions} matchConfig={matchConfig} />;
}

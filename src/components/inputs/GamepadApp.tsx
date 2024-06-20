import App from "../game/App";
import useGamepad from "../../hooks/useGamepad";
import useMachineOpponent from "../../hooks/useMachineOpponent";
import { useCallback } from "react";
import { getComputerPlayerActionsFunction } from "../../libs/computerPlayer";
import { useLocation } from "react-router-dom";

export default function GamepadApp() {
  const location = useLocation();
  const { connected, getPlayerActions } = useGamepad(1);
  const getComputerPlayer = useCallback(async () => getComputerPlayerActionsFunction(), []);
  const { getComputerActions } = useMachineOpponent(getComputerPlayer);
  return (
    <App connected={connected} getPlayer1Actions={getPlayerActions} getPlayer2Actions={getComputerActions} matchConfig={location.state.matchConfig} />
  );
}

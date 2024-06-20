import App from "../game/App";
import useGamepad from "../../hooks/useGamepad";
import useMachineOpponent from "../../hooks/useMachineOpponent";
import { useCallback } from "react";
import { getComputerPlayerActionsFunction } from "../../libs/computerPlayer";
import { useLocation, useParams } from "react-router-dom";

export default function GamepadApp() {
  const location = useLocation();
  const { opponentType } = useParams<{ opponentType: "gamepad" | "auto" | "ai" }>();
  const numberOfControllers = opponentType === "gamepad" ? 2 : 1;
  const { connected, getPlayerActions } = useGamepad(numberOfControllers);
  const getComputerPlayer = useCallback(async () => getComputerPlayerActionsFunction(), []);
  const { getComputerActions } = useMachineOpponent(getComputerPlayer);
  return (
    <App
      connected={connected}
      getPlayer1Actions={getPlayerActions}
      getPlayer2Actions={numberOfControllers === 2 ? getPlayerActions : getComputerActions}
      matchConfig={location.state.matchConfig}
    />
  );
}

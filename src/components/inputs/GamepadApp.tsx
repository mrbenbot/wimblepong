import App from "../game/App";
import useGamepad from "../../hooks/useGamepad";
import useMachineOpponent from "../../hooks/useMachineOpponent";
import { useCallback } from "react";
import { botOptions, getComputerPlayerActionsFunction } from "../../libs/computerPlayer";
import { useLocation } from "react-router-dom";
import { getTensorFlowPlayer } from "../../libs/tensorFlowPlayer";
import { Player } from "../../types";

export default function GamepadApp() {
  const location = useLocation();
  const numberOfControllers = Object.values(location.state.matchConfig.inputTypes).filter((type) => type === "gamepad").length;
  const { connected, getPlayerActions } = useGamepad(numberOfControllers);

  const getComputerPlayer = useCallback(async () => {
    const [opponentType] = Object.values<string>(location.state.matchConfig.inputTypes).filter((type) => type !== "gamepad");
    if (botOptions.includes(opponentType ?? "")) {
      return getComputerPlayerActionsFunction(opponentType as "bot-easy" | "bot-medium" | "bot-hard");
    } else {
      return getTensorFlowPlayer(opponentType);
    }
  }, [location.state]);

  const { getComputerActions } = useMachineOpponent(getComputerPlayer);
  return (
    <App
      connected={connected}
      getPlayer1Actions={location.state.matchConfig.inputTypes[Player.Player1] === "gamepad" ? getPlayerActions : getComputerActions}
      getPlayer2Actions={location.state.matchConfig.inputTypes[Player.Player2] === "gamepad" ? getPlayerActions : getComputerActions}
      matchConfig={location.state.matchConfig}
    />
  );
}

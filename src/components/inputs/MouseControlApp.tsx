import { useCallback } from "react";
import App from "../game/App";
import useMouseInput from "../../hooks/useMouse";
import { botOptions, getComputerPlayerActionsFunction } from "../../libs/computerPlayer";
import useMachineOpponent from "../../hooks/useMachineOpponent";
import { getTensorFlowPlayer } from "../../libs/tensorFlowPlayer";
import { useLocation } from "react-router-dom";
import { Player } from "../../types";

export default function MouseControlApp() {
  const location = useLocation();
  const { getPlayerActions } = useMouseInput();

  const getComputerPlayer = useCallback(async () => {
    const [opponentType] = Object.values<string>(location.state.matchConfig.inputTypes).filter((type) => type !== "mouse");
    if (botOptions.includes(opponentType ?? "")) {
      return getComputerPlayerActionsFunction(opponentType as "bot-easy" | "bot-medium" | "bot-hard");
    } else {
      return getTensorFlowPlayer(opponentType);
    }
  }, [location.state]);

  const { status, getComputerActions } = useMachineOpponent(getComputerPlayer);

  return (
    <App
      connected={status === "success"}
      getPlayer1Actions={location.state.matchConfig.inputTypes[Player.Player1] === "mouse" ? getPlayerActions : getComputerActions}
      getPlayer2Actions={location.state.matchConfig.inputTypes[Player.Player2] === "mouse" ? getPlayerActions : getComputerActions}
      matchConfig={location.state.matchConfig}
    />
  );
}

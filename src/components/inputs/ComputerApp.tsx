import { useCallback } from "react";
import App from "../game/App";
import { botOptions, getComputerPlayerActionsFunction } from "../../libs/computerPlayer";
import useMachineOpponent from "../../hooks/useMachineOpponent";
import { getTensorFlowPlayer } from "../../libs/tensorFlowPlayer";
import { useLocation } from "react-router-dom";
import { Player } from "../../types";

const getComputerPlayer = async (playerType: string) => {
  console.log(playerType);
  if (botOptions.includes(playerType ?? "")) {
    return getComputerPlayerActionsFunction(playerType as "bot-easy" | "bot-medium" | "bot-hard");
  } else {
    return getTensorFlowPlayer(playerType);
  }
};

export default function ComputerApp() {
  const location = useLocation();

  const getPlayer1 = useCallback(() => getComputerPlayer(location.state.matchConfig.inputTypes[Player.Player1]), [location.state]);
  const getPlayer2 = useCallback(() => getComputerPlayer(location.state.matchConfig.inputTypes[Player.Player2]), [location.state]);

  const { getComputerActions: getPlayer1Actions } = useMachineOpponent(getPlayer1);
  const { getComputerActions: getPlayer2Actions } = useMachineOpponent(getPlayer2);

  return <App getPlayer1Actions={getPlayer1Actions} getPlayer2Actions={getPlayer2Actions} matchConfig={location.state.matchConfig} />;
}

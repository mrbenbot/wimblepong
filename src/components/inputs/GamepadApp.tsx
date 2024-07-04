import App from "../game/App";
import useGamepad from "../../hooks/useGamepad";
import useMachineOpponent from "../../hooks/useMachineOpponent";
import { useCallback } from "react";
import { botOptions, getComputerPlayerActionsFunction } from "../../libs/computerPlayer";
import { useLocation } from "react-router-dom";
import { getTensorFlowPlayer } from "../../libs/tensorFlowPlayer";
import { Player } from "../../types";
import DisconnectionOverlay from "../game/DisconnectionOverlay";

export default function GamepadApp() {
  const location = useLocation();
  const numberOfControllers = Object.values(location.state.matchConfig.inputTypes).filter((type) => type === "gamepad").length;
  const { connected, getPlayerActions, gamepads } = useGamepad(numberOfControllers);

  const getComputerPlayer = useCallback(async () => {
    // can assume at least one player will be gamepad or will not be using this component
    const players = Object.values<string>(location.state.matchConfig.inputTypes).filter((type) => type !== "gamepad");
    if (players.length == 0 || botOptions.includes(players[0] ?? "")) {
      return getComputerPlayerActionsFunction((players[0] ?? "bot-easy") as "bot-easy" | "bot-medium" | "bot-hard");
    } else {
      return getTensorFlowPlayer(players[0]);
    }
  }, [location.state]);

  const { status, getComputerActions } = useMachineOpponent(getComputerPlayer);
  return (
    <>
      <App
        connected={connected && status === "success"}
        getPlayer1Actions={location.state.matchConfig.inputTypes[Player.Player1] === "gamepad" ? getPlayerActions : getComputerActions}
        getPlayer2Actions={location.state.matchConfig.inputTypes[Player.Player2] === "gamepad" ? getPlayerActions : getComputerActions}
        matchConfig={location.state.matchConfig}
      />
      {!connected && <DisconnectionOverlay devices={gamepads} numberOfControllers={numberOfControllers} />}
    </>
  );
}

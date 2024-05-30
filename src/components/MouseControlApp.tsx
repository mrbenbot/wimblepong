import { useCallback } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { GetPlayerActionsFunction, MatchState, Player } from "../types";
import { getComputerPlayer } from "../libs/computerPlayer";

export default function MouseControlApp({ matchConfig }: { matchConfig: MatchState["matchConfig"] }) {
  const { getPlayerActions } = useMouseInput();

  const getPlayerActionsRouter = useCallback<GetPlayerActionsFunction>(
    (player, ...args) => {
      if (player === Player.Player1) {
        return getPlayerActions(player, ...args);
      }
      return getComputerPlayer(player, ...args);
    },
    [getPlayerActions]
  );

  return (
    <>
      <App getPlayerActions={getPlayerActionsRouter} matchConfig={matchConfig} />
    </>
  );
}

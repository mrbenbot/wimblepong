import App from "./App";
import useDJHeroInput from "../hooks/useDjHeroInput";
import { useCallback } from "react";
import { GetPlayerActionsFunction, Player } from "../types";
import { getComputerPlayer } from "../libs/computerPlayer";

export default function DJHeroApp({ numberOfControllers }: { numberOfControllers: number }) {
  const { connected, selectDevice, getPlayerActions } = useDJHeroInput(numberOfControllers);

  const getPlayerActionsRouter = useCallback<GetPlayerActionsFunction>(
    (player, ...args) => {
      if (numberOfControllers == 2) {
        return getPlayerActions(player, ...args);
      }

      if (player === Player.Player1) {
        return getPlayerActions(player, ...args);
      }
      return getComputerPlayer(player, ...args);
    },
    [getPlayerActions, numberOfControllers]
  );

  return (
    <>
      <App connected={connected} selectDevice={selectDevice} getPlayerActions={getPlayerActionsRouter} />
    </>
  );
}

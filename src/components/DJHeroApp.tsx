import App from "./App";
import useDJHeroInput from "../hooks/useDjHeroInput";
import { useCallback } from "react";
import { GetPlayerActionsFunction, MatchState, Player } from "../types";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";

const getComputerPlayer = getComputerPlayerActionsFunction();

export default function DJHeroApp({ numberOfControllers, matchConfig }: { numberOfControllers: number; matchConfig: MatchState["matchConfig"] }) {
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
      <App connected={connected} selectDevice={selectDevice} getPlayerActions={getPlayerActionsRouter} matchConfig={matchConfig} />
    </>
  );
}

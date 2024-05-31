import { useCallback } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { GetPlayerActionsFunction, MatchState, Player } from "../types";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";

const getComputerActions = getComputerPlayerActionsFunction();

export default function MouseControlApp({ matchConfig }: { matchConfig: MatchState["matchConfig"] }) {
  const { getPlayerActions } = useMouseInput();

  const getPlayerActionsRouter = useCallback<GetPlayerActionsFunction>(
    (player, state, canvas, positionsReversed) => {
      if (player === Player.Player2) {
        return getComputerActions(player, state, canvas, positionsReversed);
      }
      return getPlayerActions(player, state, canvas, positionsReversed);
    },
    [getPlayerActions]
  );

  return (
    <>
      <App getPlayerActions={getPlayerActionsRouter} matchConfig={matchConfig} />
    </>
  );
}

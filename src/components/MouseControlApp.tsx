import { useCallback, useEffect } from "react";
import App from "./App";
import useMouseInput from "../hooks/useMouse";
import { GetPlayerActionsFunction, MatchState, Player } from "../types";
import { getModelPlayerActions, loadModel } from "../libs/tensorFlowPlayer";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";

const getComputerActions = getComputerPlayerActionsFunction();

export default function MouseControlApp({ matchConfig, mouseControl = true }: { matchConfig: MatchState["matchConfig"]; mouseControl: boolean }) {
  const { getPlayerActions } = useMouseInput();

  useEffect(() => {
    console.log("loading model");
    loadModel();
  }, []);

  const getPlayerActionsRouter = useCallback<GetPlayerActionsFunction>(
    (player, state, canvas, positionsReversed) => {
      if (player === Player.Player2) {
        return getModelPlayerActions(player, state, canvas, positionsReversed);
      }
      if (player === Player.Player1 && !mouseControl) {
        return getComputerActions(player, state, canvas, positionsReversed);
      }
      return getPlayerActions(player, state, canvas, positionsReversed);
    },
    [getPlayerActions, mouseControl]
  );

  return (
    <>
      <App getPlayerActions={getPlayerActionsRouter} matchConfig={matchConfig} />
    </>
  );
}

import App from "./App";
import useDJHeroInput from "../hooks/useDjHeroInput";
import { MatchState } from "../types";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";
import useMachineOpponent from "../hooks/useMachineOpponent";
import { useCallback } from "react";

export default function DJHeroApp({ numberOfControllers, matchConfig }: { numberOfControllers: 1 | 2; matchConfig: MatchState["matchConfig"] }) {
  const { connected, selectDevice, getPlayerActions } = useDJHeroInput(numberOfControllers);
  const getComputerPlayer = useCallback(async () => getComputerPlayerActionsFunction(), []);
  const { getComputerActions } = useMachineOpponent(getComputerPlayer);
  return (
    <App
      connected={connected}
      selectDevice={selectDevice}
      getPlayer1Actions={getPlayerActions}
      getPlayer2Actions={numberOfControllers == 2 ? getPlayerActions : getComputerActions}
      matchConfig={matchConfig}
    />
  );
}

import App from "./App";
import useGamepad from "../hooks/useGamepad";
import { MatchState } from "../types";

export default function GamepadApp({ matchConfig }: { matchConfig: MatchState["matchConfig"] }) {
  const { connected, getPlayerActions } = useGamepad();

  return (
    <>
      <App connected={connected} getPlayerActions={getPlayerActions} matchConfig={matchConfig} />
    </>
  );
}

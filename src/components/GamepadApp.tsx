import App from "./App";
import useGamepad from "../hooks/useGamepad";
import { MatchState } from "../types";

export default function GamepadApp({ matchConfig }: { matchConfig: MatchState["matchConfig"] }) {
  const { connected, getPlayerActions } = useGamepad();

  return <App connected={connected} getPlayer1Actions={getPlayerActions} getPlayer2Actions={getPlayerActions} matchConfig={matchConfig} />;
}

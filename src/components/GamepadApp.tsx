import App from "./App";
import useGamepad from "../hooks/useGamepad";

export default function GamepadApp() {
  const { connected, getPlayerActions } = useGamepad();

  return (
    <>
      <App connected={connected} getPlayerActions={getPlayerActions} />
    </>
  );
}

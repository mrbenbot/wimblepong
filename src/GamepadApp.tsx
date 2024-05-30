import App from "./App";
import useGamepad from "./useGamepad";

export default function GamepadApp() {
  const { connected, getPlayerActions } = useGamepad();

  return (
    <>
      <App connected={connected} getPlayerActions={getPlayerActions} />
    </>
  );
}

import App from "./App";
import useMouseInput from "../hooks/useMouse";

export default function MouseControlApp() {
  const { getPlayerActions } = useMouseInput();

  return (
    <>
      <App getPlayerActions={getPlayerActions} />
    </>
  );
}

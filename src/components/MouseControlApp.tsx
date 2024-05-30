import App from "./App";
import useMouseInput from "./useMouse";

export default function MouseControlApp() {
  const { getPlayerActions } = useMouseInput();

  return (
    <>
      <App getPlayerActions={getPlayerActions} />
    </>
  );
}

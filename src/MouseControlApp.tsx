import App from "./App";
import useMouseInput from "./useMouse";

export default function DJHeroApp() {
  const { getPlayerActions } = useMouseInput();

  return (
    <>
      <App getPlayerActions={getPlayerActions} />
    </>
  );
}

import App from "./App";
import useDJHeroInput from "../hooks/useDjHeroInput";

export default function DJHeroApp() {
  const { connected, selectDevice, getPlayerActions } = useDJHeroInput();

  return (
    <>
      <App connected={connected} selectDevice={selectDevice} getPlayerActions={getPlayerActions} />
    </>
  );
}

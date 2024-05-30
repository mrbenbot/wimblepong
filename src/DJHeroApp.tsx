import App from "./App";
import useDJHeroInput from "./useDjHeroInput";

export default function DJHeroApp() {
  const { connected, selectDevice, getPlayerActions } = useDJHeroInput();

  return (
    <>
      <App connected={connected} selectDevice={selectDevice} getPlayerActions={getPlayerActions} />
    </>
  );
}

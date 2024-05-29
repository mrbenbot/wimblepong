import App from "./App";
import useDJHeroInput from "./useDjHeroInput";

export default function DJHeroApp() {
  const { connected, selectDevice, dataRef, getPaddleUpdate, getButtonPushed } = useDJHeroInput();

  return (
    <>
      <App connected={connected} selectDevice={selectDevice} dataRef={dataRef} getPaddleUpdate={getPaddleUpdate} getButtonPushed={getButtonPushed} />
    </>
  );
}

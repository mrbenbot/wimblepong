import App from "./App";
import useMouseInput from "./useMouse";

export default function DJHeroApp() {
  const { dataRef, getButtonPushed, getPaddleUpdate } = useMouseInput();

  return (
    <>
      <App dataRef={dataRef} getPaddleUpdate={getPaddleUpdate} getButtonPushed={getButtonPushed} />
    </>
  );
}

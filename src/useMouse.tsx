import { useEffect, useRef } from "react";
import { DataRef, InputData, Player } from "./types";

const useMouseInput = () => {
  const ZERO = 128;
  const PADDLE_SPEED_MOUSE = 5;

  const dataRef = useRef<DataRef>({
    [Player.Player1]: { lastData: null, lastUpdated: null },
    [Player.Player2]: { lastData: null, lastUpdated: null },
  });

  useEffect(() => {
    if (!dataRef.current[Player.Player1].lastData || !dataRef.current[Player.Player2].lastData) {
      dataRef.current[Player.Player1].lastData = new Uint8Array(12);
      dataRef.current[Player.Player2].lastData = new Uint8Array(12);

      dataRef.current[Player.Player1].lastData[6] = ZERO;
      dataRef.current[Player.Player2].lastData[6] = ZERO;
    }

    function updateDirection(deltaY: number) {
      const lastData1 = dataRef.current[Player.Player1].lastData;
      const lastData2 = dataRef.current[Player.Player2].lastData;
      if (lastData1 && lastData2) {
        const newDirection1 = Math.max(0, Math.min(255, 128 - deltaY * PADDLE_SPEED_MOUSE));
        const newDirection2 = Math.max(0, Math.min(255, 128 - deltaY * PADDLE_SPEED_MOUSE));
        lastData1[6] = newDirection1;
        lastData2[6] = newDirection2;
        console.log(`Direction Y value: Player1=${newDirection1}, Player2=${newDirection2}`);
      }
    }

    function buttonPressed(on: boolean) {
      const lastData1 = dataRef.current[Player.Player1].lastData;
      const lastData2 = dataRef.current[Player.Player2].lastData;
      if (lastData1 && lastData2) {
        console.log(`button pressed: ${on}`);
        lastData1[11] = on ? 255 : 0;
        lastData2[11] = on ? 255 : 0;
      }
    }

    function wheelEventHandler(event: WheelEvent) {
      event.preventDefault();
      updateDirection(event.deltaY / 100);
    }
    function keyDownEventHandler(event: KeyboardEvent) {
      if (event.code === "Space") {
        buttonPressed(true);
      }
    }

    function keyUpEventHandler(event: KeyboardEvent) {
      if (event.code === "Space") {
        buttonPressed(false);
      }
    }

    document.addEventListener("wheel", wheelEventHandler);
    document.addEventListener("keydown", keyDownEventHandler);
    document.addEventListener("keyup", keyUpEventHandler);
    return () => {
      document.removeEventListener("wheel", wheelEventHandler);
      document.removeEventListener("keydown", keyDownEventHandler);
      document.removeEventListener("keyup", keyUpEventHandler);
    };
  }, [dataRef]);

  return { dataRef, getPaddleUpdate, getButtonPushed };
};

function getPaddleUpdate(
  input: InputData,
  paddle: {
    x: number;
    y: number;
    dy: number;
    width: number;
    height: number;
  },
  deltaTime: number,
  inverse: boolean
) {
  if (inverse) {
    paddle.dy = -getPaddleDirection(input.lastData || new Uint8Array());
  } else {
    paddle.dy = getPaddleDirection(input.lastData || new Uint8Array());
  }
  paddle.y += paddle.dy * deltaTime;
}

export function getPaddleDirection(data: Uint8Array) {
  return 128 - data[6] || 0;
}

export function getButtonPushed(data: Uint8Array) {
  // 7 green 9 red 12 blue 11 black
  return data[11] === 255;
}

export default useMouseInput;

import { useEffect, useRef } from "react";
import { GetPlayerActionsFunction } from "../types";
import { MAX_MOUSE_PADDLE_SPEED } from "../config";

const useMouseInput = () => {
  const dataRef = useRef({ buttonPressed: false, mouseY: 0 });

  useEffect(() => {
    function mouseMoveEventHandler(event: MouseEvent) {
      const player1Data = dataRef.current;
      if (player1Data) {
        player1Data.mouseY = event.clientY;
      }
    }

    function buttonPressed(on: boolean) {
      const player1Data = dataRef.current;
      if (player1Data) {
        player1Data.buttonPressed = on;
      }
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

    document.addEventListener("mousemove", mouseMoveEventHandler);
    document.addEventListener("keydown", keyDownEventHandler);
    document.addEventListener("keyup", keyUpEventHandler);
    return () => {
      document.removeEventListener("mousemove", mouseMoveEventHandler);
      document.removeEventListener("keydown", keyDownEventHandler);
      document.removeEventListener("keyup", keyUpEventHandler);
    };
  }, [dataRef]);

  const getPlayerActions: GetPlayerActionsFunction = (_player, _state, canvas, positionsReversed) => {
    const { buttonPressed, mouseY } = dataRef.current;
    const rects = canvas.getBoundingClientRect();
    if (positionsReversed) {
      return {
        buttonPressed,
        paddleDirection: -boundedValue(
          _state.paddle2.y - mouseY + rects.top + _state.paddle2.height,
          -MAX_MOUSE_PADDLE_SPEED,
          MAX_MOUSE_PADDLE_SPEED
        ),
      };
    }
    return {
      buttonPressed,
      paddleDirection: boundedValue(_state.paddle1.y - mouseY + rects.top + _state.paddle1.height, -MAX_MOUSE_PADDLE_SPEED, MAX_MOUSE_PADDLE_SPEED),
    };
  };

  return { dataRef, getPlayerActions };
};

function boundedValue(n: number, lower: number, upper: number) {
  return Math.min(Math.max(n, lower), upper);
}

export default useMouseInput;

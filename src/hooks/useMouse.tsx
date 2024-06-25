import { useEffect, useRef } from "react";
import { GetPlayerActionsFunction, Player } from "../types";
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

  const getPlayerActions: GetPlayerActionsFunction = (player, state, canvas) => {
    const { buttonPressed, mouseY } = dataRef.current;
    const rects = canvas.getBoundingClientRect();
    const paddle = state[player];
    if ((state.positionsReversed && player === Player.Player1) || (!state.positionsReversed && player === Player.Player2)) {
      return {
        buttonPressed,
        paddleDirection: -boundedValue(paddle.y - mouseY + rects.top + paddle.height, -MAX_MOUSE_PADDLE_SPEED, MAX_MOUSE_PADDLE_SPEED),
      };
    }
    return {
      buttonPressed,
      paddleDirection: boundedValue(paddle.y - mouseY + rects.top + paddle.height, -MAX_MOUSE_PADDLE_SPEED, MAX_MOUSE_PADDLE_SPEED),
    };
  };

  return { dataRef, getPlayerActions };
};

function boundedValue(n: number, lower: number, upper: number) {
  return Math.min(Math.max(n, lower), upper);
}

export default useMouseInput;

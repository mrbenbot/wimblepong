import { useEffect, useRef } from "react";
import { InputData, MutableGameState, Player } from "./types";

const MAX_PADDLE_SPEED = 25;
const MAX_COMPUTER_PADDLE_SPEED = 10;

const useMouseInput = () => {
  const dataRef = useRef({
    [Player.Player1]: { buttonPressed: false, mouseY: 0 },
    [Player.Player2]: { buttonPressed: false, mouseY: 0 },
  });

  useEffect(() => {
    function mouseMoveEventHandler(event: MouseEvent) {
      const player1Data = dataRef.current[Player.Player1];
      const player2Data = dataRef.current[Player.Player2];
      if (player1Data && player2Data) {
        player1Data.mouseY = event.clientY;
        player2Data.mouseY = event.clientY;
      }
    }

    function buttonPressed(on: boolean) {
      const player1Data = dataRef.current[Player.Player1];
      const player2Data = dataRef.current[Player.Player2];
      if (player1Data && player2Data) {
        player1Data.buttonPressed = on;
        player2Data.buttonPressed = on;
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

  const getPlayerActions = (player: Player, _state: MutableGameState, canvas: HTMLCanvasElement, leftPlayer: boolean) => {
    const { buttonPressed, mouseY } = dataRef.current[player];
    const rects = canvas.getBoundingClientRect();
    if (leftPlayer) {
      return {
        buttonPressed,
        paddleDirection: boundedValue(_state.paddle1.y - mouseY + rects.top + _state.paddle1.height, -MAX_PADDLE_SPEED, MAX_PADDLE_SPEED),
      };
    } else {
      // return {
      //   buttonPressed,
      //   paddleDirection: -boundedValue(_state.paddle1.y - mouseY + rects.top + _state.paddle1.height, -MAX_PADDLE_SPEED, MAX_PADDLE_SPEED),
      // };
      return {
        buttonPressed,
        paddleDirection: -boundedValue(
          _state.paddle2.y - _state.ball.y + _state.paddle2.height / 2,
          -MAX_COMPUTER_PADDLE_SPEED,
          MAX_COMPUTER_PADDLE_SPEED
        ),
      };
    }
  };

  return { dataRef, getPaddleUpdate, getButtonPushed, getPlayerActions };
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

function boundedValue(n: number, lower: number, upper: number) {
  return Math.min(Math.max(n, lower), upper);
}

export default useMouseInput;

import { useEffect, useState } from "react";
import { GetPlayerActionsFunction, MutableGameState, Player } from "./types";
import { GAMEPAD_AXIS_MULTIPLIER } from "./config";

const players = { [Player.Player1]: 0, [Player.Player2]: 1 };

const useGamepad = () => {
  const [bothReceiving, setBothReceiving] = useState(false);
  const [gamepads, setGamepads] = useState<Gamepad[]>([]);

  const updateGamepads = () => {
    const gamepads = navigator.getGamepads().filter((gp) => gp !== null);
    console.log(`Gamepad connection update. Gamepads: ${gamepads.length}`);
    setBothReceiving(gamepads.length == 2);
    setGamepads(gamepads as Gamepad[]);
  };

  useEffect(() => {
    window.addEventListener("gamepadconnected", updateGamepads);
    window.addEventListener("gamepaddisconnected", updateGamepads);

    updateGamepads();

    return () => {
      window.removeEventListener("gamepadconnected", updateGamepads);
      window.removeEventListener("gamepaddisconnected", updateGamepads);
    };
  }, []);

  const getPlayerActions: GetPlayerActionsFunction = (player: Player, _state: MutableGameState, _canvas: HTMLCanvasElement) => {
    const gamepad = navigator.getGamepads()[players[player]];
    if (gamepad) {
      if (!bothReceiving) {
        setBothReceiving(true);
      }
      return {
        buttonPressed: gamepad.buttons[3].pressed,
        paddleDirection: -clampNumber(gamepad.axes[5]) * GAMEPAD_AXIS_MULTIPLIER,
      };
    } else {
      if (bothReceiving) {
        setBothReceiving(false);
      }
      return {
        buttonPressed: false,
        paddleDirection: 0,
      };
    }
  };

  return {
    connected: gamepads.length == 2 && bothReceiving,
    getPlayerActions,
  };
};

function clampNumber(value: number): number {
  return value < -0.004 || value > 0.004 ? value : 0;
}

export default useGamepad;

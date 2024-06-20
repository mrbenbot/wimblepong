import { useCallback, useEffect, useState } from "react";
import { GetPlayerActionsFunction, Player } from "../types";
import { GAMEPAD_AXIS_MULTIPLIER } from "../config";

const players = { [Player.Player1]: 0, [Player.Player2]: 1 };

const useGamepad = (numberOfControllers: number) => {
  const [bothReceiving, setBothReceiving] = useState(false);
  const [gamepads, setGamepads] = useState<(Gamepad | null)[]>([]);

  const updateGamepads = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const activeGamepads = gamepads.filter((gp) => gp !== null);
    console.log(`Gamepad connection update. Gamepads: ${activeGamepads.length}`);
    setBothReceiving(activeGamepads.length >= numberOfControllers);
    setGamepads(activeGamepads as Gamepad[]);
  }, [numberOfControllers, setBothReceiving, setGamepads]);

  useEffect(() => {
    window.addEventListener("gamepadconnected", updateGamepads);
    window.addEventListener("gamepaddisconnected", updateGamepads);

    updateGamepads();

    return () => {
      window.removeEventListener("gamepadconnected", updateGamepads);
      window.removeEventListener("gamepaddisconnected", updateGamepads);
    };
  }, [updateGamepads]);

  const getPlayerActions: GetPlayerActionsFunction = (player: Player, _state, _canvas) => {
    const gamepads = navigator.getGamepads();
    const activeGamepads = gamepads.filter((gp) => gp !== null);
    const gamepad = activeGamepads[players[player]];
    if (gamepad) {
      return {
        buttonPressed: gamepad.buttons[3].pressed,
        paddleDirection: -clampNumber(gamepad.axes[5]) * GAMEPAD_AXIS_MULTIPLIER,
      };
    } else {
      return {
        buttonPressed: false,
        paddleDirection: 0,
      };
    }
  };

  return {
    connected: gamepads.length >= numberOfControllers && bothReceiving,
    getPlayerActions,
  };
};

function clampNumber(value: number): number {
  return value > -0.004 && value < 0.004 ? 0 : value;
}

export default useGamepad;

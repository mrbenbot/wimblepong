import { useCallback, useEffect, useReducer } from "react";
import { GetPlayerActionsFunction, Player } from "../types";
import { GAMEPAD_AXIS_MULTIPLIER } from "../config";

const players = { [Player.Player1]: 0, [Player.Player2]: 1 };

type GamepadState = {
  gamepads: Gamepad[];
  gamepadIndices: number[];
  isConnected: boolean;
  numberOfControllers: number;
};

type GamepadAction = { type: "SET_GAMEPADS"; payload: Gamepad[] } | { type: "SET_GAMEPAD_INDICES"; payload: number[] };

const gamepadReducer = (state: GamepadState, action: GamepadAction): GamepadState => {
  switch (action.type) {
    case "SET_GAMEPADS": {
      return { ...state, gamepads: action.payload, isConnected: false, gamepadIndices: [] };
    }
    case "SET_GAMEPAD_INDICES": {
      const isConnected = action.payload.length >= state.numberOfControllers;
      return { ...state, gamepadIndices: action.payload, isConnected };
    }
    default:
      return state;
  }
};

const initialState = (numberOfControllers: number): GamepadState => ({
  gamepads: [],
  gamepadIndices: [],
  isConnected: false,
  numberOfControllers,
});

const useGamepad = (numberOfControllers: number) => {
  const [state, dispatch] = useReducer(gamepadReducer, initialState(numberOfControllers));

  useEffect(() => {
    const updateGamepads = () => {
      const gamepads = navigator.getGamepads();
      const activeGamepads = gamepads.filter((gp) => gp !== null);
      console.log(`Gamepad connection update. Gamepads: ${activeGamepads.length}`);
      dispatch({ type: "SET_GAMEPADS", payload: activeGamepads as Gamepad[] });
    };
    window.addEventListener("gamepadconnected", updateGamepads);
    window.addEventListener("gamepaddisconnected", updateGamepads);

    updateGamepads();

    return () => {
      window.removeEventListener("gamepadconnected", updateGamepads);
      window.removeEventListener("gamepaddisconnected", updateGamepads);
    };
  }, []);

  useEffect(() => {
    if (state.gamepads.length < state.numberOfControllers || state.isConnected) return;

    let loopId: ReturnType<typeof setInterval> | null = null;

    const loopAndCheckActive = () => {
      console.log("Checking gamepads active");
      const gamepads = navigator.getGamepads();
      const indices: number[] = [];
      const now = performance.now();
      // check each gamepad has had a recent update (dongle may not be connected to device)
      gamepads.forEach((gamepad, i) => {
        if (gamepad) {
          const { timestamp } = gamepad;
          if (now - timestamp < 1000) {
            indices.push(i);
          }
        }
      });

      if (indices.length >= state.numberOfControllers) {
        console.log("Gamepad(s) connected!");
        dispatch({ type: "SET_GAMEPAD_INDICES", payload: indices });
        clearInterval(loopId as ReturnType<typeof setInterval>);
      }
    };

    loopId = setInterval(loopAndCheckActive, 1000);

    return () => {
      if (loopId !== null) {
        clearInterval(loopId);
      }
    };
  }, [state.isConnected, state.numberOfControllers, state.gamepads.length]);

  const getPlayerActions: GetPlayerActionsFunction = useCallback(
    (player, _state, _canvas, now) => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[state.numberOfControllers > 1 ? state.gamepadIndices[players[player]] : 0];
      if (gamepad) {
        if (now - gamepad.timestamp > 10000) {
          dispatch({ type: "SET_GAMEPAD_INDICES", payload: [] });
          return {
            buttonPressed: false,
            paddleDirection: 0,
          };
        }
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
    },
    [state.gamepadIndices, state.numberOfControllers]
  );

  return {
    connected: state.isConnected,
    gamepads: state.gamepads,
    getPlayerActions,
  };
};

function clampNumber(value: number): number {
  return value > -0.004 && value < 0.004 ? 0 : value;
}

export default useGamepad;

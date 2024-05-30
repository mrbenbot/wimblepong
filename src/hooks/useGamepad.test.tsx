import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";
import { render } from "@testing-library/react";
import { act, useEffect } from "react";
import useGamepad from "../hooks/useGamepad";
import { GetPlayerActionsFunction, Player } from "../types";
import { GAMEPAD_AXIS_MULTIPLIER } from "../config";

type SpyType = MockInstance<
  [type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined],
  void
>;

describe("useGamepad", () => {
  let addEventListenerSpy: SpyType;
  let removeEventListenerSpy: SpyType;
  let getGamepadsSpy: MockInstance<[], (Gamepad | null)[]>;

  beforeEach(() => {
    navigator.getGamepads = () => [];
    window.console.log = vi.fn();
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    getGamepadsSpy = vi.spyOn(navigator, "getGamepads");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    getGamepadsSpy.mockRestore();
  });

  function TestComponent({ callback }: { callback: (hookValue: ReturnType<typeof useGamepad>) => void }) {
    const hookValue = useGamepad();
    useEffect(() => {
      callback(hookValue);
    }, [hookValue, callback]);
    return null;
  }

  function renderHook(callback: (hookValue: ReturnType<typeof useGamepad>) => void) {
    return render(<TestComponent callback={callback} />);
  }

  it("should initialize correctly", () => {
    const callback = vi.fn();
    renderHook(callback);

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ connected: false }));
    expect(addEventListenerSpy).toHaveBeenCalledWith("gamepadconnected", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("gamepaddisconnected", expect.any(Function));
  });

  it("should update state when gamepads are connected and disconnected", () => {
    const callback = vi.fn();
    const mockGamepad = {
      buttons: Array(17).fill({ pressed: false }),
      axes: Array(6).fill(0),
    } as unknown as Gamepad;
    getGamepadsSpy.mockReturnValue([mockGamepad, mockGamepad]);

    renderHook(callback);

    act(() => {
      window.dispatchEvent(new Event("gamepadconnected"));
    });

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ connected: true }));

    getGamepadsSpy.mockReturnValue([]);

    act(() => {
      window.dispatchEvent(new Event("gamepaddisconnected"));
    });

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ connected: false }));
  });

  it("should return correct player actions", () => {
    const callback = vi.fn();
    const mockGamepad = {
      buttons: Array(17).fill({ pressed: false }),
      axes: Array(6).fill(0),
    };
    mockGamepad.buttons[3] = { pressed: true } as GamepadButton;
    mockGamepad.axes[5] = 0.5;
    getGamepadsSpy.mockReturnValue([mockGamepad as unknown as Gamepad, null]);
    act(() => {
      renderHook(callback);
    });

    const hookValue = callback.mock.calls[callback.mock.calls.length - 1][0];

    let actions: null | ReturnType<GetPlayerActionsFunction> = null;

    act(() => {
      actions = hookValue.getPlayerActions(Player.Player1, {} as unknown, document.createElement("canvas"));
    });

    expect((actions as unknown as ReturnType<GetPlayerActionsFunction>).buttonPressed).toBe(true);
    expect((actions as unknown as ReturnType<GetPlayerActionsFunction>).paddleDirection).toBe(-0.5 * GAMEPAD_AXIS_MULTIPLIER);
  });

  it("should clean up event listeners on unmount", () => {
    const callback = vi.fn();
    let unmount: () => void;

    act(() => {
      const result = render(<TestComponent callback={callback} />);
      unmount = result.unmount;
    });

    act(() => {
      unmount();
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith("gamepadconnected", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("gamepaddisconnected", expect.any(Function));
  });
});

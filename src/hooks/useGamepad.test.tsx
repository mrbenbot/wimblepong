import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";
import { RenderResult, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import useGamepad from "../hooks/useGamepad";

type SpyType = MockInstance<
  [type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined],
  void
>;

describe("useGamepad", () => {
  let addEventListenerSpy: SpyType;
  let removeEventListenerSpy: SpyType;
  let getGamepadsSpy: MockInstance<[], (Gamepad | null)[]>;
  let requestAnimationFrameSpy: MockInstance<[callback: FrameRequestCallback], number>;
  let cancelAnimationFrameSpy: MockInstance<[handle: number], void>;

  beforeEach(() => {
    navigator.getGamepads = () => [];
    window.console.log = vi.fn();
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    getGamepadsSpy = vi.spyOn(navigator, "getGamepads");
    requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame");
    cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    getGamepadsSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });

  function TestComponent({
    callback,
    numberOfControllers,
  }: {
    callback: (hookValue: ReturnType<typeof useGamepad>) => void;
    numberOfControllers: number;
  }) {
    const hookValue = useGamepad(numberOfControllers);
    useEffect(() => {
      callback(hookValue);
    }, [hookValue, callback]);
    return null;
  }

  function renderHook(callback: (hookValue: ReturnType<typeof useGamepad>) => void, numberOfControllers: number = 2): RenderResult {
    return render(<TestComponent callback={callback} numberOfControllers={numberOfControllers} />);
  }

  it.each([[2], [1]])("should initialize correctly with %i controllers", async (numberOfControllers) => {
    const callback = vi.fn();
    // requestAnimationFrameSpy.mockImplementation(vi.fn());
    renderHook(callback, numberOfControllers);
    const mockGamepad = {
      buttons: Array(17).fill({ pressed: false }),
      axes: Array(6).fill(0),
      timestamp: performance.now(),
    } as unknown as Gamepad;

    // Simulate two gamepads being already connected even if only one is needed
    getGamepadsSpy.mockReturnValue([mockGamepad, mockGamepad]);

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ connected: false }));
    expect(addEventListenerSpy).toHaveBeenCalledWith("gamepadconnected", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("gamepaddisconnected", expect.any(Function));
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ connected: true }));
      expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    });
    // check loop stops
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
  });
});

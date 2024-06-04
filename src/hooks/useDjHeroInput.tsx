import { useCallback, useEffect, useRef, useState } from "react";
import { DataRef, GetPlayerActionsFunction, Player } from "../types";

function arraysEqual(a: Uint8Array | null, b: Uint8Array) {
  if (!a || a.length !== b.length) return false;
  for (let i = a.length - 1; i > 0; i--) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

enum DeviceConnectionStatus {
  NoneConnected = "NONE_CONNECTED",
  OneConnected = "ONE_CONNECTED",
  TwoConnected = "TWO_CONNECTED",
  Unknown = "UNKNOWN",
}

const connectionStatuses = [DeviceConnectionStatus.NoneConnected, DeviceConnectionStatus.OneConnected, DeviceConnectionStatus.TwoConnected];

const players = [Player.Player1, Player.Player2];

const useDJHeroInput = (numberOfControllers: number = 2) => {
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState(DeviceConnectionStatus.NoneConnected);
  const [bothReceiving, setBothReceiving] = useState(false);
  const [devices, setDevices] = useState<HIDDevice[]>([]);
  const dataRef = useRef<DataRef>({
    [Player.Player1]: { lastData: null, lastUpdated: null },
    [Player.Player2]: { lastData: null, lastUpdated: null },
  });

  const selectDevice = async () => {
    console.log("requesting new devices");
    const [newDevice] = await navigator.hid.requestDevice({ filters: [{ vendorId: 4794, productId: 320 }] });
    if (!newDevice) {
      console.log("no new device");
      return;
    }
    console.log("got device:", newDevice);
    await newDevice.open();
    const newDevices = [...new Set([...devices, newDevice])];
    newDevice.addEventListener("inputreport", handleInputReport(players[newDevices.length === 1 ? 1 : 0]));
    setDeviceConnectionStatus(connectionStatuses[newDevices.length]);
    setDevices(newDevices);
  };

  useEffect(() => {
    const handleDisconnect = async (event: HIDConnectionEvent) => {
      console.log(`HID disconnected: ${event.device.productName}`);
      const remainingDevices = await navigator.hid.getDevices();
      setDeviceConnectionStatus(connectionStatuses[remainingDevices.length]);
      setDevices(remainingDevices);
    };

    navigator.hid.addEventListener("disconnect", handleDisconnect);
    return () => {
      navigator.hid.removeEventListener("disconnect", handleDisconnect);
    };
  }, []);

  const handleInputReport = useCallback(
    (player: Player) => (event: HIDInputReportEvent) => {
      if (dataRef.current) {
        const { data } = event;
        const dataArray = new Uint8Array(data.buffer);
        if (!dataRef.current[player].lastData || !arraysEqual(dataRef.current[player].lastData, dataArray)) {
          dataRef.current[player].lastData = dataArray;
          dataRef.current[player].lastUpdated = Date.now();
        }
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const getExistingDevices = async () => {
      if (mounted) {
        const existingDevices = await navigator.hid.getDevices();
        console.log("received: ", existingDevices);
        if (existingDevices.length > numberOfControllers) {
          setDeviceConnectionStatus(DeviceConnectionStatus.Unknown);
          return;
        }

        existingDevices.forEach((device, i) => {
          if (!device.opened) {
            if (mounted) {
              console.log("opening device", i);
              device.open();
              device.addEventListener("inputreport", handleInputReport(players[i]));
            }
          }
        });

        setDeviceConnectionStatus(connectionStatuses[existingDevices.length]);

        setDevices(existingDevices);
      }
    };
    getExistingDevices();
    return () => {
      mounted = false;
    };
  }, [handleInputReport, numberOfControllers]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (numberOfControllers === 2) {
        const diff0 = now - (dataRef.current[Player.Player1].lastUpdated ?? 0);
        const diff1 = now - (dataRef.current[Player.Player2].lastUpdated ?? 0);
        setBothReceiving(diff0 < 500 && diff1 < 500);
      } else {
        const diff0 = now - (dataRef.current[Player.Player1].lastUpdated ?? 0);
        setBothReceiving(diff0 < 500);
      }
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [dataRef, numberOfControllers]);

  const getPlayerActions: GetPlayerActionsFunction = (player: Player, _state, _canvas) => {
    const { lastData } = dataRef.current[player];
    if (lastData) {
      return {
        buttonPressed: getButtonPushed(lastData),
        paddleDirection: getPaddleDirection(lastData),
      };
    } else {
      return {
        buttonPressed: false,
        paddleDirection: 0,
      };
    }
  };

  return {
    connected: deviceConnectionStatus === connectionStatuses[numberOfControllers] && bothReceiving,
    selectDevice,
    getPlayerActions,
  };
};

export function getPaddleDirection(data: Uint8Array) {
  return 128 - data[6] || 0;
}

export function getButtonPushed(data: Uint8Array) {
  // 7 green 9 red 12 blue 11 black
  return data[11] === 255;
}

export default useDJHeroInput;

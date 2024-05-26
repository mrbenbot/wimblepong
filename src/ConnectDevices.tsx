import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "./types";

function arraysEqual(a: Uint8Array | null, b: Uint8Array) {
  if (!a || a.length !== b.length) return false;
  for (let i = a.length - 1; i > 0; i--) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export interface InputData {
  lastData: Uint8Array | null;
  lastUpdated: number | null;
}

export interface DataRef {
  [Player.Player1]: InputData;
  [Player.Player2]: InputData;
}

enum DeviceConnectionStatus {
  NoneConnected = "NONE_CONNECTED",
  OneConnected = "ONE_CONNECTED",
  TwoConnected = "TWO_CONNECTED",
  Unknown = "UNKNOWN",
}

const players = [Player.Player1, Player.Player2];

const useDJHeroInput = () => {
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
    setDeviceConnectionStatus(
      [DeviceConnectionStatus.NoneConnected, DeviceConnectionStatus.OneConnected, DeviceConnectionStatus.TwoConnected][newDevices.length]
    );
    setDevices(newDevices);
  };

  useEffect(() => {
    const handleDisconnect = async (event: HIDConnectionEvent) => {
      console.log(`HID disconnected: ${event.device.productName}`);
      const remainingDevices = await navigator.hid.getDevices();
      setDeviceConnectionStatus(
        [DeviceConnectionStatus.NoneConnected, DeviceConnectionStatus.OneConnected, DeviceConnectionStatus.TwoConnected][remainingDevices.length]
      );
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
        if (existingDevices.length > 2) {
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

        setDeviceConnectionStatus(
          [DeviceConnectionStatus.NoneConnected, DeviceConnectionStatus.OneConnected, DeviceConnectionStatus.TwoConnected][existingDevices.length]
        );

        setDevices(existingDevices);
      }
    };
    getExistingDevices();
    return () => {
      mounted = false;
    };
  }, [handleInputReport]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const diff0 = now - (dataRef.current[Player.Player1].lastUpdated ?? 0);
      const diff1 = now - (dataRef.current[Player.Player2].lastUpdated ?? 0);
      // console.log(dataRef.current);
      setBothReceiving(diff0 < 500 && diff1 < 500);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [dataRef]);

  return { connected: deviceConnectionStatus === DeviceConnectionStatus.TwoConnected && bothReceiving, selectDevice, dataRef };
};

export default useDJHeroInput;

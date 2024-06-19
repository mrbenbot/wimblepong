import App from "./App";
import useDJHeroInput from "../hooks/useDjHeroInput";
import { getComputerPlayerActionsFunction } from "../libs/computerPlayer";
import useMachineOpponent from "../hooks/useMachineOpponent";
import { useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";

import "./DJHeroApp.css";

export default function DJHeroApp() {
  const location = useLocation();
  const { opponentType } = useParams<{ opponentType: "dj" | "auto" | "ai" }>();
  const numberOfControllers = opponentType === "dj" ? 2 : 1;
  const { connected, selectDevice, devices, getPlayerActions } = useDJHeroInput(numberOfControllers);
  const getComputerPlayer = useCallback(async () => getComputerPlayerActionsFunction(), []);
  const { getComputerActions } = useMachineOpponent(getComputerPlayer);
  return (
    <>
      <App
        connected={connected}
        // selectDevice={selectDevice}
        getPlayer1Actions={getPlayerActions}
        getPlayer2Actions={opponentType === "dj" ? getPlayerActions : getComputerActions}
        matchConfig={location.state.matchConfig}
      />
      {/* TODO: put the select device button in overlay */}
      {!connected && (
        <div className="button-select-overlay">
          <div>
            <p>
              There are <span style={{ color: devices.length == numberOfControllers ? "green" : "red", fontWeight: "bold" }}>{devices.length}</span>{" "}
              of <span style={{ fontWeight: "bold" }}>{numberOfControllers}</span> dongles connected to USB
            </p>
            <p>
              Please make sure the DJ Hero Controllers are connected the dongles by pressing the{" "}
              <img
                src="/playstation.webp"
                alt="playstation"
                width={40}
                style={{ transform: "translateY(9px)", border: "2px solid black", borderRadius: "50%", backgroundColor: "black" }}
              ></img>{" "}
              button.
            </p>
            <p style={{ fontSize: "1.5rem" }}>(This screen should automatically disappear.)</p>
            <button onClick={selectDevice}>select device</button>
          </div>
        </div>
      )}
    </>
  );
}

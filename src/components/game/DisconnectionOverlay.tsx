import "./DisconnectionOverlay.css";

function DisconnectionOverlay({ numberOfControllers, devices }: { numberOfControllers: number; devices: unknown[] }) {
  return (
    <div className="button-select-overlay">
      <div>
        <p>
          <span style={{ color: devices.length == numberOfControllers ? "green" : "red", fontWeight: "bold" }}>{devices.length}</span> of{" "}
          <span style={{ fontWeight: "bold" }}>{numberOfControllers}</span> dongles connected to USB
        </p>
        <p>Wiggle the disk.</p>
        <p>Unplug and replug the dongles.</p>
        <p>
          Press the{" "}
          <img
            src="/playstation.webp"
            alt="playstation"
            width={40}
            style={{ transform: "translateY(9px)", border: "2px solid black", borderRadius: "50%", backgroundColor: "black" }}
          ></img>{" "}
          button.
        </p>
        <p style={{ fontSize: "1.5rem" }}>(This screen should automatically disappear.)</p>
      </div>
    </div>
  );
}

export default DisconnectionOverlay;

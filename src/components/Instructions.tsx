import { GITHUB_COLAB_LINK } from "../config";
import Navigation from "./Navigation";

export default function Instructions() {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1000, textAlign: "justify", fontSize: "1.5em" }}>
        <Navigation />
        <h2>Humans</h2>
        <p>You can play solo with a mouse or a DJ Hero controller or play against a human opponent using two DJ Hero controllers.</p>
        <p>
          From Monday 8th July the DJ Hero controllers will be stored in the office and available to use. Any meeting room with a TV can be a suitable
          venue or you can use the laptop screen anywhere within the BJSS office
        </p>
        <p>Dongle facts</p>
        <ul>
          <li>Each controller has a dongle which you will need to plug into the host laptop via USB.</li>
          <li>The dongles are fragile! Please be careful so that they last for the duration of the competition.</li>
          <li>
            You may have to plug/unplug the dongles and press/unpress buttons whilst wiggling/unwiggling the control disk. This is best achieved after
            selecting gamepad(s) from the player options and clicking play. Instructions will pop up if no gamepads are found.
          </li>
        </ul>
        <h2>Sovereign Agents</h2>
        <p>
          You can train an agent and run it in the browser. Is freedom really worth it if it comes at the cost of self annihilation? For more info see{" "}
          <a href={GITHUB_COLAB_LINK}>this google colab</a> as a starting point and come to the lunch and learn.
        </p>
      </div>
    </div>
  );
}

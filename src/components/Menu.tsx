// MenuComponent.tsx
import React, { useState } from "react";
import MouseControlApp from "./MouseControlApp";
import DJHeroApp from "./DJHeroApp";
import GamepadApp from "./GamepadApp";
import { MatchState } from "../types";

/*
Set Length -> 1 - 6
Match Length -> 1,3,5
Input Mode
  - Mouse vs Computer ✅
  - Gamepad vs Computer 
  - Gamepad vs Gamepad
  - HID vs Computer ✅
  - HID vs HID ✅
  - Computer (Model) vs Computer
  - Computer (Model) vs Computer (Model)
 */

const MenuComponent: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<"computer/model" | "mouse/model" | "dj" | "dj/computer" | "gamepad" | "mouse/computer" | null>(
    null
  );
  const [matchConfig, setMatchConfig] = useState<MatchState["matchConfig"]>({ numberOfSets: 3, setLength: 6 });

  return (
    <div>
      <h1>Select an Option</h1>
      <div>
        <button onClick={() => setSelectedOption("computer/model")}>Computer vs Model</button>
        <button onClick={() => setSelectedOption("mouse/model")}>Mouse vs Model</button>
        {/* <button onClick={() => setSelectedOption("mouse/computer")}>Mouse vs Computer</button> */}
        <button onClick={() => setSelectedOption("dj")}>DJ vs DJ</button>
        <button onClick={() => setSelectedOption("dj/computer")}>DJ vs Computer</button>
        <button onClick={() => setSelectedOption("gamepad")}>Gamepad vs Gamepad</button>
      </div>
      <div>
        {selectedOption === "computer/model" && <MouseControlApp matchConfig={matchConfig} mouseControl={false} />}
        {selectedOption === "mouse/model" && <MouseControlApp matchConfig={matchConfig} mouseControl />}
        {/* {selectedOption === "mouse/computer" && <MouseControlApp matchConfig={matchConfig} mouseControl />} */}
        {selectedOption === "dj/computer" && <DJHeroApp numberOfControllers={1} matchConfig={matchConfig} />}
        {selectedOption === "dj" && <DJHeroApp numberOfControllers={2} matchConfig={matchConfig} />}
        {selectedOption === "gamepad" && <GamepadApp matchConfig={matchConfig} />}
      </div>
      <br />
      <label>
        Set Length: First to{" "}
        <select onChange={(e) => setMatchConfig({ ...matchConfig, setLength: Number(e.target.value) })} value={matchConfig.setLength}>
          {[1, 2, 3, 4, 5, 6].map((length) => (
            <option key={length}>{length}</option>
          ))}
        </select>{" "}
        Games
        <br />
      </label>
      <label>
        Match Length: Best of{" "}
        <select onChange={(e) => setMatchConfig({ ...matchConfig, numberOfSets: Number(e.target.value) })} value={matchConfig.numberOfSets}>
          {[1, 3, 5].map((length) => (
            <option key={length}>{length}</option>
          ))}
        </select>{" "}
        Sets
      </label>
    </div>
  );
};

export default MenuComponent;

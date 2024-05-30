// MenuComponent.tsx
import React, { useState } from "react";
import MouseControlApp from "./MouseControlApp";
import DJHeroApp from "./DJHeroApp";
import GamepadApp from "./GamepadApp";

/*
Set Length -> 1 - 6
Match Length -> 1,3,5
Input Mode
  - Mouse vs Computer
  - Gamepad vs Computer 
  - Gamepad vs Gamepad
  - HID vs Gamepad
  - Gamepad vs HID
  - Mouse vs Gamepad
  - Mouse vs HID
  - Computer (Model) vs Computer
  - Computer (Model) vs Computer (Model)
 */

const MenuComponent: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<"mouse" | "dj" | "gamepad" | null>(null);

  return (
    <div>
      <h1>Select an Option</h1>
      <div>
        <button onClick={() => setSelectedOption("mouse")}>Mouse</button>
        <button onClick={() => setSelectedOption("dj")}>DJ</button>
        <button onClick={() => setSelectedOption("gamepad")}>Gamepad</button>
      </div>
      <div>
        {selectedOption === "mouse" && <MouseControlApp />}
        {selectedOption === "dj" && <DJHeroApp />}
        {selectedOption === "gamepad" && <GamepadApp />}
      </div>
      <label>
        Set Length: <select></select>
      </label>
      <label>
        Game Length: <select></select>
      </label>
    </div>
  );
};

export default MenuComponent;

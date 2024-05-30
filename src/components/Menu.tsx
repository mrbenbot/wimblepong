// MenuComponent.tsx
import React, { useState } from "react";
import MouseControlApp from "./MouseControlApp";
import DJHeroApp from "./DJHeroApp";
import GamepadApp from "./GamepadApp";

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
    </div>
  );
};

export default MenuComponent;

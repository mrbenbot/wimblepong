// MenuComponent.tsx
import React, { useState } from "react";
import MouseControlApp from "./MouseControlApp";
import DJHeroApp from "./MouseControlApp";
const MenuComponent: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<"mouse" | "dj" | null>(null);

  return (
    <div>
      <h1>Select an Option</h1>
      <div>
        <button onClick={() => setSelectedOption("mouse")}>Mouse</button>
        <button onClick={() => setSelectedOption("dj")}>DJ</button>
      </div>
      <div>
        {selectedOption === "mouse" && <MouseControlApp />}
        {selectedOption === "dj" && <DJHeroApp />}
      </div>
    </div>
  );
};

export default MenuComponent;

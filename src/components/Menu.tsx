import React, { useState } from "react";
import { MatchState } from "../types";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

const playOptions = [
  { path: "/mouse/ai", title: "Mouse vs Model" },
  { path: "/mouse/auto", title: "Mouse vs Computer" },
  { path: "/dj/dj", title: "DJ vs DJ" },
  { path: "/dj/auto", title: "DJ vs Computer" },
  { path: "/dj/ai", title: "DJ vs Model" },
];

const MenuComponent: React.FC = () => {
  const navigate = useNavigate();
  const [matchConfig, setMatchConfig] = useState<MatchState["matchConfig"]>({ numberOfSets: 3, setLength: 6 });
  const [path, setPath] = useState("/mouse/auto");

  const handleNavigation = (path: string) => {
    navigate(path, { state: { matchConfig } });
  };

  return (
    <div>
      <h1>Select an Option</h1>
      <div>
        {playOptions.map((option) => (
          <button onClick={() => setPath(option.path)} key={option.path} className={path === option.path ? "selected" : ""}>
            {option.title}
          </button>
        ))}
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
      <br />
      <button onClick={() => handleNavigation(path)} className="play-button">
        PLAY
      </button>
    </div>
  );
};

export default MenuComponent;

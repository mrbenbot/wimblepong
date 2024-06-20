import React, { useState } from "react";
import { MatchState, Player } from "../types";
import { useNavigate } from "react-router-dom";
import "./Menu.css";
import { clearState } from "../libs/localStorage";

const playOptions = [
  { path: "/mouse/ai", title: "Mouse vs Model" },
  { path: "/mouse/auto", title: "Mouse vs Computer" },
  { path: "/dj/dj", title: "DJ vs DJ" },
  { path: "/dj/auto", title: "DJ vs Computer" },
  { path: "/dj/ai", title: "DJ vs Model" },
  { path: "/gamepad", title: "Gamepad vs Computer" },
];

const MenuComponent: React.FC = () => {
  const navigate = useNavigate();
  const [matchConfig, setMatchConfig] = useState<MatchState["matchConfig"]>({
    numberOfSets: 3,
    setLength: 6,
    names: {
      [Player.Player1]: "Player1",
      [Player.Player2]: "Player2",
    },
  });
  const [path, setPath] = useState("/mouse/auto");

  const handleNavigation = (path: string) => {
    clearState();
    navigate(path, { state: { matchConfig } });
  };

  const handleNameChange = (player: Player) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setMatchConfig({
      ...matchConfig,
      names: {
        ...matchConfig.names,
        [player]: event.target.value.slice(0, 8),
      },
    });
  };

  return (
    <div className="menu">
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
        Player 1 Name: <input className="input" type="text" value={matchConfig.names[Player.Player1]} onChange={handleNameChange(Player.Player1)} />
      </label>
      <br />
      <label>
        Player 2 Name: <input className="input" type="text" value={matchConfig.names[Player.Player2]} onChange={handleNameChange(Player.Player2)} />
      </label>
      <br />
      <br />
      <label>
        Set Length: First to{" "}
        <select
          className="input"
          onChange={(e) => setMatchConfig({ ...matchConfig, setLength: Number(e.target.value) })}
          value={matchConfig.setLength}
        >
          {[1, 2, 3, 4, 5, 6].map((length) => (
            <option key={length}>{length}</option>
          ))}
        </select>{" "}
        Games
      </label>
      <br />
      <label>
        Match Length: Best of{" "}
        <select
          className="input"
          onChange={(e) => setMatchConfig({ ...matchConfig, numberOfSets: Number(e.target.value) })}
          value={matchConfig.numberOfSets}
        >
          {[1, 3, 5].map((length) => (
            <option key={length}>{length}</option>
          ))}
        </select>{" "}
        Sets
      </label>
      <br />
      <br />
      <button onClick={() => handleNavigation(path)} className="play-button">
        PLAY
      </button>
    </div>
  );
};

export default MenuComponent;

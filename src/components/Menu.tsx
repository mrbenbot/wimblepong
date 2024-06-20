import React, { useState } from "react";
import { MatchState, Player } from "../types";
import { useNavigate } from "react-router-dom";
import "./Menu.css";
import { clearState } from "../libs/localStorage";

const playOptions = [
  { path: "/mouse/ai", title: "Mouse vs Model" },
  { path: "/mouse/auto", title: "Mouse vs Computer" },
  // { path: "/dj/dj", title: "DJ vs DJ" },
  // { path: "/dj/auto", title: "DJ vs Computer" },
  // { path: "/dj/ai", title: "DJ vs Model" },
  { path: "/gamepad/gamepad", title: "Gamepad vs Gamepad" },
  { path: "/gamepad/auto", title: "Gamepad vs Computer" },
  // { path: "/gamepad/ai", title: "Gamepad vs Computer" },
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
    soundOn: true,
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
      <h1>Game Setup</h1>
      <div>
        {playOptions.map((option) => (
          <button onClick={() => setPath(option.path)} key={option.path} className={path === option.path ? "selected" : ""}>
            {option.title}
          </button>
        ))}
      </div>
      <br />
      <label>
        <span>Player 1 Name:</span>
        <input className="input" type="text" value={matchConfig.names[Player.Player1]} onChange={handleNameChange(Player.Player1)} />
      </label>
      <br />
      <label>
        <span>Player 2 Name:</span>
        <input className="input" type="text" value={matchConfig.names[Player.Player2]} onChange={handleNameChange(Player.Player2)} />
      </label>
      <br />
      <br />
      <label>
        <span>Set Length:</span>{" "}
        <span>
          First to{" "}
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
        </span>
      </label>
      <br />
      <label>
        <span>Match Length:</span>{" "}
        <span>
          Best of{" "}
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
        </span>
      </label>
      <br />
      <label>
        <span>Sound On:</span>
        <input
          className="input"
          type="checkbox"
          checked={matchConfig.soundOn}
          onChange={() => setMatchConfig({ ...matchConfig, soundOn: !matchConfig.soundOn })}
        />
      </label>
      <br />
      <button onClick={() => handleNavigation(path)} className="play-button">
        PLAY
      </button>
    </div>
  );
};

export default MenuComponent;

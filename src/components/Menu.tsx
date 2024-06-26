import React, { useState, useEffect } from "react";
import { MatchState, Player } from "../types";
import { useNavigate } from "react-router-dom";
import "./Menu.css";
import { clearItem } from "../libs/localStorage";
import { MATCH_STATE_KEY } from "../config";

const MenuComponent: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<string[]>([]);
  const [matchConfig, setMatchConfig] = useState<MatchState["matchConfig"]>({
    numberOfSets: 3,
    setLength: 6,
    names: {
      [Player.Player1]: "Player1",
      [Player.Player2]: "Player2",
    },
    inputTypes: {
      [Player.Player1]: "mouse",
      [Player.Player2]: "bot-easy",
    },
    soundOn: true,
  });

  useEffect(() => {
    const manifest = JSON.parse(localStorage.getItem("model-manifest") || "[]");
    setModels(manifest);
  }, []);

  const handleNavigation = () => {
    const { [Player.Player1]: player1Option, [Player.Player2]: player2Option } = matchConfig.inputTypes;
    if (player1Option && player2Option) {
      clearItem(MATCH_STATE_KEY); // clear match state in local storage in case remaining from previous match
      const options = { state: { matchConfig } };
      if ([player1Option, player2Option].includes("mouse")) {
        navigate(`/mouse`, options);
      } else if ([player1Option, player2Option].includes("gamepad")) {
        navigate(`/gamepad`, options);
      } else {
        navigate(`/computer`, options);
      }
    } else {
      alert("Please select options for both players.");
    }
  };

  const handleConfigChange = (key: "names" | "inputTypes", player: Player) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMatchConfig({
      ...matchConfig,
      [key]: {
        ...matchConfig[key],
        [player]: key == "names" ? event.target.value.slice(0, 8) : event.target.value,
      },
    });
  };

  const renderOptions = (otherSelectedOption: string) => {
    const isMouseSelected = otherSelectedOption === "mouse";
    const isGamepadSelected = otherSelectedOption === "gamepad";
    return (
      <>
        <optgroup label="Human">
          <option value="mouse" disabled={isMouseSelected || isGamepadSelected}>
            Mouse
          </option>
          <option value="gamepad" disabled={isMouseSelected}>
            Gamepad
          </option>
        </optgroup>
        <optgroup label="Bot">
          <option value="bot-easy">Bot - Easy</option>
          <option value="bot-medium">Bot - Medium</option>
          <option value="bot-hard">Bot - Hard</option>
        </optgroup>
        <optgroup label="AI">
          {models.map((model) => (
            <option key={model} value={`${model}`}>
              {model}
            </option>
          ))}
        </optgroup>
      </>
    );
  };

  return (
    <div className="menu">
      <h1>Game Setup</h1>
      <div>
        <label>
          <span>Player 1 Option:</span>
          <select value={matchConfig.inputTypes[Player.Player1]} onChange={handleConfigChange("inputTypes", Player.Player1)} className="input">
            {renderOptions(matchConfig.inputTypes[Player.Player2])}
          </select>
        </label>
      </div>
      <div>
        <label>
          <span>Player 2 Option:</span>
          <select value={matchConfig.inputTypes[Player.Player2]} onChange={handleConfigChange("inputTypes", Player.Player2)} className="input">
            {renderOptions(matchConfig.inputTypes[Player.Player1])}
          </select>
        </label>
      </div>
      <br />
      <label>
        <span>Player 1 Name:</span>
        <input className="input" type="text" value={matchConfig.names[Player.Player1]} onChange={handleConfigChange("names", Player.Player1)} />
      </label>
      <br />
      <label>
        <span>Player 2 Name:</span>
        <input className="input" type="text" value={matchConfig.names[Player.Player2]} onChange={handleConfigChange("names", Player.Player2)} />
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
      <div style={{ display: "flex", justifyContent: "space-evenly", width: "100%" }}>
        <button onClick={() => navigate("/upload")} className="upload-button">
          Manage Local Models
        </button>
        <button onClick={handleNavigation} className="play-button">
          PLAY
        </button>
      </div>
    </div>
  );
};

export default MenuComponent;

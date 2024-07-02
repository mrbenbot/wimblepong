import React, { useState, useEffect } from "react";
import { MatchState, Player } from "../types";
import { useNavigate } from "react-router-dom";
import "./Menu.css";
import { clearItem, loadItem, saveItem } from "../libs/localStorage";
import { MATCH_STATE_KEY } from "../config";

const MATCH_CONFIG_KEY = "MATCH_CONFIG";
const initialMatchConfig = {
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
};

const humanInputs = [
  { value: "mouse", label: "Mouse" },
  { value: "gamepad", label: "Gamepad" },
];

const botInputs = [
  { value: "bot-easy", label: "Bot - Easy" },
  { value: "bot-medium", label: "Bot - Medium" },
  { value: "bot-hard", label: "Bot - Hard" },
];

const staticInputs = [...humanInputs, ...botInputs].map(({ value }) => value);

function checkOptionExists(option: string, models: string[]) {
  return [...models, ...staticInputs].includes(option) ? option : "bot-easy";
}

const MenuComponent: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<string[]>(() => loadItem("model-manifest") || []);
  const [matchConfig, setMatchConfig] = useState<MatchState["matchConfig"]>(() => loadItem(MATCH_CONFIG_KEY) ?? initialMatchConfig);

  useEffect(() => {
    const manifest = loadItem("model-manifest") || [];
    setModels(manifest);
    setMatchConfig((config) => ({
      ...config,
      inputTypes: {
        [Player.Player1]: checkOptionExists(config.inputTypes[Player.Player1], manifest),
        [Player.Player2]: checkOptionExists(config.inputTypes[Player.Player2], manifest),
      },
    }));
  }, []);

  useEffect(() => {
    saveItem(MATCH_CONFIG_KEY, matchConfig);
  }, [matchConfig]);

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
          {humanInputs.map((input) => (
            <option key={input.value} value={input.value} disabled={input.value === "mouse" ? isMouseSelected || isGamepadSelected : isMouseSelected}>
              {input.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Bot">
          {botInputs.map((input) => (
            <option key={input.value} value={input.value}>
              {input.label}
            </option>
          ))}
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

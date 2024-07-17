import React, { useState, useEffect } from "react";
import { MatchState, Player } from "../types";
import { useNavigate } from "react-router-dom";
import "./Menu.css";
import { clearItem, loadItem, saveItem } from "../libs/localStorage";
import { MATCH_CONFIG_KEY, MATCH_STATE_KEY, PLAYER_COLOURS } from "../config";
import Navigation from "./Navigation";

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
  colors: PLAYER_COLOURS,
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

function forceLegalOpponent(playerInput: string, opponentInput: string): string {
  if (playerInput === "mouse") {
    if (["mouse", "gamepad"].includes(opponentInput)) {
      return "bot-medium";
    }
  } else if (playerInput === "gamepad") {
    if (opponentInput === "mouse") {
      return "gamepad";
    }
  }
  return opponentInput;
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

  const handleConfigChange =
    (key: "names" | "inputTypes" | "colors", player: Player) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setMatchConfig({
        ...matchConfig,
        [key]: {
          ...matchConfig[key],
          [player]: key == "names" ? event.target.value.slice(0, 8) : event.target.value,
        },
      });
    };

  const handleInputTypeChange = (player: Player) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const playerInput = event.target.value;
    const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;

    setMatchConfig({
      ...matchConfig,
      inputTypes: {
        [opponent as Player.Player1]: forceLegalOpponent(playerInput, matchConfig.inputTypes[opponent]),
        [player as Player.Player2]: playerInput,
      },
    });
  };

  const renderOptions = () => {
    return (
      <>
        <optgroup label="Human">
          {humanInputs.map((input) => (
            <option key={input.value} value={input.value}>
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
      <Navigation />
      <h2>Game Setup</h2>
      <div>
        <label htmlFor="player1-option">
          <span>Player 1 Option:</span>
          <select
            id="player1-option"
            value={matchConfig.inputTypes[Player.Player1]}
            onChange={handleInputTypeChange(Player.Player1)}
            className="input"
          >
            {renderOptions()}
          </select>
        </label>
        <label htmlFor="player2-option">
          <span>Player 2 Option:</span>
          <select
            id="player2-option"
            value={matchConfig.inputTypes[Player.Player2]}
            onChange={handleInputTypeChange(Player.Player2)}
            className="input"
          >
            {renderOptions()}
          </select>
        </label>
      </div>
      <div>
        <label htmlFor="player1-name">
          <span>Player 1 Name:</span>
          <input
            id="player1-name"
            className="input"
            type="text"
            value={matchConfig.names[Player.Player1]}
            onChange={handleConfigChange("names", Player.Player1)}
          />
        </label>
        <label htmlFor="player2-name">
          <span>Player 2 Name:</span>
          <input
            id="player2-name"
            className="input"
            type="text"
            value={matchConfig.names[Player.Player2]}
            onChange={handleConfigChange("names", Player.Player2)}
          />
        </label>
      </div>
      <div>
        <label htmlFor="player1-color">
          <span>Player 1 Colour:</span>
          <input
            id="player1-color"
            className="input"
            type="color"
            value={matchConfig.colors[Player.Player1]}
            onChange={handleConfigChange("colors", Player.Player1)}
          />
        </label>
        <label htmlFor="player2-color">
          <span>Player 2 Colour:</span>
          <input
            id="player2-color"
            className="input"
            type="color"
            value={matchConfig.colors[Player.Player2]}
            onChange={handleConfigChange("colors", Player.Player2)}
          />
        </label>
      </div>
      <div>
        <label htmlFor="set-length">
          <span>Set Length:</span>{" "}
          <span>
            First to{" "}
            <select
              id="set-length"
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
        <label htmlFor="match-length">
          <span>Match Length:</span>{" "}
          <span>
            Best of{" "}
            <select
              id="match-length"
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
      </div>
      <label htmlFor="sound-on">
        <span>Sound On:</span>
        <input
          id="sound-on"
          className="input"
          type="checkbox"
          checked={matchConfig.soundOn}
          onChange={() => setMatchConfig({ ...matchConfig, soundOn: !matchConfig.soundOn })}
        />
      </label>
      <div>
        <label htmlFor="tiebreak-last-set">
          <span>Tiebreak in Last Set:</span>
          <input
            id="tiebreak-last-set"
            className="input"
            type="checkbox"
            checked={matchConfig.tieBreakLastSet ?? false}
            onChange={() => setMatchConfig({ ...matchConfig, tieBreakLastSet: !matchConfig.tieBreakLastSet })}
          />
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "center", width: "min(450px, 100vw)" }}>
        <button onClick={handleNavigation} className="play-button">
          PLAY
        </button>
      </div>
    </div>
  );
};

export default MenuComponent;

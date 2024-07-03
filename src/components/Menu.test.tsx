import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Menu from "./Menu";
import * as localStorage from "../libs/localStorage";
import { MATCH_CONFIG_KEY } from "../config";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("MenuComponent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(localStorage, "loadItem").mockImplementation(() => null);
    vi.spyOn(localStorage, "saveItem").mockImplementation(() => {});
    vi.spyOn(localStorage, "clearItem").mockImplementation(() => {});
  });

  it("renders the component", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    expect(screen.getByText("Game Setup")).toBeInTheDocument();
  });

  it("initializes with default match config", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    const player1Option = screen.getByLabelText("Player 1 Option:");
    const player2Option = screen.getByLabelText("Player 2 Option:");
    const player1Name = screen.getByLabelText("Player 1 Name:");
    const player2Name = screen.getByLabelText("Player 2 Name:");
    const setLength = screen.getByLabelText("Set Length:", { exact: false });
    const matchLength = screen.getByLabelText("Match Length:", { exact: false });
    const soundOn = screen.getByLabelText("Sound On:");
    const tiebreak = screen.getByLabelText("Tiebreak in Last Set:");

    expect(player1Option).toHaveValue("mouse");
    expect(player2Option).toHaveValue("bot-easy");
    expect(player1Name).toHaveValue("Player1");
    expect(player2Name).toHaveValue("Player2");
    expect(setLength).toHaveValue("6");
    expect(matchLength).toHaveValue("3");
    expect(soundOn).toBeChecked();
    expect(tiebreak).not.toBeChecked();
  });

  it("changes player names", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    const player1Name = screen.getByLabelText("Player 1 Name:");
    const player2Name = screen.getByLabelText("Player 2 Name:");

    fireEvent.change(player1Name, { target: { value: "John" } });
    fireEvent.change(player2Name, { target: { value: "Doe" } });

    expect(player1Name).toHaveValue("John");
    expect(player2Name).toHaveValue("Doe");
  });

  it("handles navigation based on player options", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    const playButton = screen.getByText("PLAY");

    fireEvent.click(playButton);
    expect(mockNavigate).toHaveBeenCalledWith("/mouse", expect.anything());

    fireEvent.change(screen.getByLabelText("Player 1 Option:"), { target: { value: "bot-hard" } });
    fireEvent.change(screen.getByLabelText("Player 2 Option:"), { target: { value: "bot-medium" } });
    fireEvent.click(playButton);
    expect(mockNavigate).toHaveBeenCalledWith("/computer", expect.anything());

    fireEvent.change(screen.getByLabelText("Player 1 Option:"), { target: { value: "gamepad" } });
    fireEvent.change(screen.getByLabelText("Player 2 Option:"), { target: { value: "gamepad" } });
    fireEvent.click(playButton);
    expect(mockNavigate).toHaveBeenCalledWith("/gamepad", expect.anything());
  });

  it("toggles checkboxes", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    const soundOn = screen.getByLabelText("Sound On:");
    const tiebreak = screen.getByLabelText("Tiebreak in Last Set:");

    expect(soundOn).toBeChecked();
    fireEvent.click(soundOn);
    expect(soundOn).not.toBeChecked();

    expect(tiebreak).not.toBeChecked();
    fireEvent.click(tiebreak);
    expect(tiebreak).toBeChecked();
  });

  it("changes match and set length", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    const setLength = screen.getByLabelText("Set Length:", { exact: false });
    const matchLength = screen.getByLabelText("Match Length:", { exact: false });

    fireEvent.change(setLength, { target: { value: "4" } });
    fireEvent.change(matchLength, { target: { value: "5" } });

    expect(setLength).toHaveValue("4");
    expect(matchLength).toHaveValue("5");
  });

  it("saves match config to local storage", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );
    const setLength = screen.getByLabelText("Set Length:", { exact: false });

    fireEvent.change(setLength, { target: { value: "4" } });

    expect(localStorage.saveItem).toHaveBeenCalledWith(MATCH_CONFIG_KEY, expect.objectContaining({ setLength: 4 }));
  });

  it("forces legal opponent option when 'mouse' or 'gamepad' is selected", () => {
    render(
      <Router>
        <Menu />
      </Router>
    );

    const player1Option = screen.getByLabelText("Player 1 Option:");
    const player2Option = screen.getByLabelText("Player 2 Option:");

    // Select 'mouse' for Player 1
    fireEvent.change(player1Option, { target: { value: "mouse" } });
    expect(player1Option).toHaveValue("mouse");

    // Select 'mouse' for Player 2
    fireEvent.change(player2Option, { target: { value: "mouse" } });

    // Player 2 has 'mouse' and Player 1 has been forced to 'bot-medium'
    expect(player1Option).toHaveValue("bot-medium");
    expect(player2Option).toHaveValue("mouse");

    // Select 'gamepad' for Player 1
    fireEvent.change(player1Option, { target: { value: "gamepad" } });

    // Player 1 has 'gamepad' and Player 2 has been forced to 'gamepad'
    expect(player1Option).toHaveValue("gamepad");
    expect(player2Option).toHaveValue("gamepad");
  });
});

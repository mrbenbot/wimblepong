import { MatchState } from "../types";

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem("matchState");
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state", err);
    return undefined;
  }
};

export const saveState = (state: MatchState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("matchState", serializedState);
  } catch (err) {
    console.error("Could not save state", err);
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem("matchState");
  } catch (err) {
    console.error("Could not clear state", err);
  }
};

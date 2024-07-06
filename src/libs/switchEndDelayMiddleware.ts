import { MatchState } from "../types";
import { Action } from "./score";

type MatchStateReducer = (state: MatchState, action: Action) => MatchState;

const switchEndDelayMiddleWare = (): ((reducer: MatchStateReducer) => MatchStateReducer) => {
  let delayedState: MatchState | null = null;
  return (reducer) => {
    return (state, action) => {
      if (action.type === "RESET_BALL") {
        if (delayedState) {
          const returnedState = delayedState;
          delayedState = null;
          return returnedState;
        }
      }
      const newState = reducer(state, action);
      // point has been one
      if (newState.servingPlayer !== state.servingPlayer) {
        // do this so that ball pause is respected even at the end of the point as changing playerPositions/servingPlayer resets mutable game state.
        delayedState = newState;
        return { ...newState, playerPositions: state.playerPositions, servingPlayer: state.servingPlayer };
      }
      return newState;
    };
  };
};

export default switchEndDelayMiddleWare;

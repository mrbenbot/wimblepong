import { describe, it, expect } from "vitest";
import { Score, Player, PlayerPositions, MatchState, Action, reducer } from "./score"; // Adjust the import path as needed

describe("Tennis Match Reducer", () => {
  const initialState: MatchState = {
    sets: [],
    games: { Player1: 0, Player2: 0 },
    tiebreak: { Player1: 0, Player2: 0 },
    servingPlayer: Player.Player1,
    playerPositions: PlayerPositions.Initial,
    gameState: {
      Player1: Score.Love,
      Player2: Score.Love,
    },
    matchConfig: {
      setsToWin: 3,
    },
  };

  describe("should update the number of games won and sets won correctly", () => {
    it("should update number of games correctly", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1 };
      const state = { ...initialState, gameState: { Player1: Score.Forty, Player2: Score.Thirty } };
      const updatedState = reducer(state, action); // Player1 wins the game
      expect(updatedState.games.Player1).toBe(1);
      expect(updatedState.games.Player2).toBe(0);
    });

    it("should update number of sets correctly", () => {
      const state = { ...initialState, gameState: { Player1: Score.Forty, Player2: Score.Thirty }, games: { Player1: 5, Player2: 0 } };
      const action: Action = { type: "POINT_SCORED", player: Player.Player1 };
      const updatedState = reducer(state, action); // Player1 wins the set
      expect(updatedState.games.Player1).toBe(0);
      expect(updatedState.games.Player2).toBe(0);
      expect(updatedState.sets.length).toBe(1);
      expect(updatedState.sets[0]).toEqual({ Player1: 6, Player2: 0 });
    });

    it("should enter tie break if 6 games all", () => {
      const state = { ...initialState, gameState: { Player1: Score.Forty, Player2: Score.Thirty }, games: { Player1: 5, Player2: 6 } };
      const action: Action = { type: "POINT_SCORED", player: Player.Player1 };
      const updatedState = reducer(state, action); // Should be tie break
      expect(updatedState.games.Player1).toBe(6);
      expect(updatedState.games.Player2).toBe(6);
      expect(updatedState.sets.length).toBe(0);
    });

    it("should score tie break point if 6 games all", () => {
      const state = { ...initialState, games: { Player1: 6, Player2: 6 } };
      const action: Action = { type: "POINT_SCORED", player: Player.Player1 };
      const updatedState = reducer(state, action); // Should be tie break
      expect(updatedState.games.Player1).toBe(6);
      expect(updatedState.games.Player2).toBe(6);
      expect(updatedState.tiebreak.Player1).toBe(1);
      expect(updatedState.tiebreak.Player2).toBe(0);
    });

    it("should change serve and ends correctly during tiebreak", () => {
      let state = { ...initialState, games: { Player1: 6, Player2: 6 }, tiebreak: { Player1: 0, Player2: 0 } };

      // Point 1: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(1);
      expect(state.tiebreak.Player2).toBe(0);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after the first point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 2: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2 });
      expect(state.tiebreak.Player1).toBe(1);
      expect(state.tiebreak.Player2).toBe(1);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after two points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 3: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2 });
      expect(state.tiebreak.Player1).toBe(1);
      expect(state.tiebreak.Player2).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 4: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(2);
      expect(state.tiebreak.Player2).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 5: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(3);
      expect(state.tiebreak.Player2).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 6: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2 });
      expect(state.tiebreak.Player1).toBe(3);
      expect(state.tiebreak.Player2).toBe(3);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // Ends change after 6 points

      // Point 7: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2 });
      expect(state.tiebreak.Player1).toBe(3);
      expect(state.tiebreak.Player2).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 8: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(4);
      expect(state.tiebreak.Player2).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 9: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(5);
      expect(state.tiebreak.Player2).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 10: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2 });
      expect(state.tiebreak.Player1).toBe(5);
      expect(state.tiebreak.Player2).toBe(5);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 11: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2 });
      expect(state.tiebreak.Player1).toBe(5);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 12: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(6);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // Ends change after 6 points

      // Point 13: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(7);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 13: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1 });
      expect(state.tiebreak.Player1).toBe(8);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same
    });

    it.only("should change ends after the first game and every two games thereafter", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1 };
      let state: MatchState = {
        ...initialState,
        playerPositions: PlayerPositions.Initial,
        servingPlayer: Player.Player1,
        gameState: { Player1: Score.Forty, Player2: Score.Thirty },
      };

      state = reducer(state, action); // Player1 wins the first game
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // should swap ends after first game
      expect(state.servingPlayer).toBe(Player.Player2);

      state = { ...state, gameState: { Player1: Score.Forty, Player2: Score.Thirty } };
      state = reducer(state, action); // Player1 wins the second game
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // No change after the second game

      state = { ...state, gameState: { Player1: Score.Forty, Player2: Score.Thirty } };
      state = reducer(state, action); // Player1 wins the third game
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // Change after the third game

      state = { ...state, gameState: { Player1: Score.Forty, Player2: Score.Thirty } };
      state = reducer(state, action); // Player1 wins the fourth game
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // No change after the fourth game

      state = { ...state, gameState: { Player1: Score.Forty, Player2: Score.Thirty } };
      state = reducer(state, action); // Player1 wins the fifth game
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // Change after the fifth game
    });

    it("should determine the match winner correctly", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1 };
      const state = {
        ...initialState,
        sets: [
          { Player1: 6, Player2: 0 },
          { Player1: 7, Player2: 6 },
        ],
        games: { Player1: 5, Player2: 3 },
        gameState: { Player1: Score.Forty, Player2: Score.Thirty },
        matchConfig: { setsToWin: 3 },
      };
      const newState = reducer(state, action);
      expect(newState.matchWinner).toBe(Player.Player1);
    });
  });
});

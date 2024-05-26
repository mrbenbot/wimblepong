import { describe, it, expect } from "vitest";
import { Action, addPointState, getWinStreak, reducer } from "./score"; // Adjust the import path as needed
import { MatchState, Player, PlayerPositions, PointType, Score } from "./types";

describe("Tennis Match Reducer", () => {
  const initialState: MatchState = {
    sets: [],
    games: { Player1: 0, Player2: 0 },
    tiebreak: { Player1: 0, Player2: 0 },
    rallies: [],
    servingPlayer: Player.Player1,
    playerPositions: PlayerPositions.Initial,
    gameState: {
      Player1: Score.Love,
      Player2: Score.Love,
    },
    events: [],
    matchConfig: {
      setsToWin: 3,
    },
    pointType: PointType.Normal,
  };

  describe("should update the number of games won and sets won correctly", () => {
    it("should update number of games correctly", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const state = { ...initialState, gameState: { Player1: Score.Forty, Player2: Score.Thirty } };
      const updatedState = reducer(state, action); // Player1 wins the game
      expect(updatedState.games.Player1).toBe(1);
      expect(updatedState.games.Player2).toBe(0);
    });

    it("should update number of sets correctly", () => {
      const state = { ...initialState, gameState: { Player1: Score.Forty, Player2: Score.Thirty }, games: { Player1: 5, Player2: 0 } };
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const updatedState = reducer(state, action); // Player1 wins the set
      expect(updatedState.games.Player1).toBe(0);
      expect(updatedState.games.Player2).toBe(0);
      expect(updatedState.sets.length).toBe(1);
      expect(updatedState.sets[0]).toEqual({ Player1: 6, Player2: 0 });
    });

    it("should enter tie break if 6 games all", () => {
      const state = { ...initialState, gameState: { Player1: Score.Forty, Player2: Score.Thirty }, games: { Player1: 5, Player2: 6 } };
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const updatedState = reducer(state, action); // Should be tie break
      expect(updatedState.games.Player1).toBe(6);
      expect(updatedState.games.Player2).toBe(6);
      expect(updatedState.sets.length).toBe(0);
    });

    it("should score tie break point if 6 games all", () => {
      const state = { ...initialState, games: { Player1: 6, Player2: 6 } };
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const updatedState = reducer(state, action); // Should be tie break
      expect(updatedState.games.Player1).toBe(6);
      expect(updatedState.games.Player2).toBe(6);
      expect(updatedState.tiebreak.Player1).toBe(1);
      expect(updatedState.tiebreak.Player2).toBe(0);
    });

    it("should change serve and ends correctly during tiebreak", () => {
      let state = { ...initialState, games: { Player1: 6, Player2: 6 }, tiebreak: { Player1: 0, Player2: 0 } };

      // Point 1: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(1);
      expect(state.tiebreak.Player2).toBe(0);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after the first point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 2: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(1);
      expect(state.tiebreak.Player2).toBe(1);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after two points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 3: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(1);
      expect(state.tiebreak.Player2).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 4: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(2);
      expect(state.tiebreak.Player2).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 5: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(3);
      expect(state.tiebreak.Player2).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 6: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(3);
      expect(state.tiebreak.Player2).toBe(3);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // Ends change after 6 points

      // Point 7: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(3);
      expect(state.tiebreak.Player2).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 8: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(4);
      expect(state.tiebreak.Player2).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 9: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(5);
      expect(state.tiebreak.Player2).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 10: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(5);
      expect(state.tiebreak.Player2).toBe(5);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 11: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(5);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 12: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(6);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // Ends change after 6 points

      // Point 13: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(7);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 13: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak.Player1).toBe(8);
      expect(state.tiebreak.Player2).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same
    });

    it("should change ends after the first game and every two games thereafter", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
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
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
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

    it("should work going from deuce to advantage", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const state: MatchState = {
        ...initialState,
        playerPositions: PlayerPositions.Initial,
        servingPlayer: Player.Player1,
        gameState: { Player1: Score.Forty, Player2: Score.Forty },
      };
      const nextState = reducer(state, action); // should be advantage player 1
      expect(nextState.gameState[Player.Player1]).toBe(Score.Advantage);
    });

    it("should work going from advantage to next game", () => {
      const action: Action = { type: "POINT_SCORED", player: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const state: MatchState = {
        ...initialState,
        games: { [Player.Player1]: 0, [Player.Player2]: 0 },
        playerPositions: PlayerPositions.Initial,
        servingPlayer: Player.Player1,
        gameState: { Player1: Score.Advantage, Player2: Score.Forty },
      };
      const nextState = reducer(state, action); // should be advantage player 1
      expect(nextState.gameState[Player.Player1]).toBe(Score.Love);
      expect(nextState.gameState[Player.Player1]).toBe(Score.Love);
      expect(nextState.games[Player.Player1]).toBe(1);
      expect(nextState.games[Player.Player2]).toBe(0);
    });
  });
});

describe("getWinStreak", () => {
  it.each([
    { rallies: [], expected: 0 },
    {
      rallies: [{ winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } }],
      expected: 1,
    },
    {
      rallies: [
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
      ],
      expected: 2,
    },
    {
      rallies: [
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
      ],
      expected: 3,
    },
    {
      rallies: [
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
      ],
      expected: 1,
    },
  ])("win streak should be $expected", ({ rallies, expected }) => {
    expect(getWinStreak(rallies)).toBe(expected);
  });
});

describe("addPointState", () => {
  const initialState: MatchState = {
    sets: [{ Player1: 0, Player2: 0 }],
    games: { Player1: 0, Player2: 0 },
    tiebreak: { Player1: 0, Player2: 0 },
    rallies: [],
    servingPlayer: Player.Player1,
    playerPositions: PlayerPositions.Initial,
    gameState: {
      Player1: Score.Love,
      Player2: Score.Love,
    },
    matchConfig: {
      setsToWin: 3,
    },
    events: [],
    pointType: PointType.Normal,
  };

  it("should set point type to DEUCE", () => {
    const state = {
      ...initialState,
      gameState: {
        Player1: Score.Forty,
        Player2: Score.Forty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.Deuce);
  });

  it("should set point type to GAME_POINT", () => {
    const state = {
      ...initialState,
      gameState: {
        Player1: Score.Forty,
        Player2: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.GamePoint);
  });

  it("should set point type to GAME_POINT when advantage", () => {
    const state = {
      ...initialState,
      gameState: {
        Player1: Score.Advantage,
        Player2: Score.Forty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.GamePoint);
  });

  it("should set point type to BREAK_POINT", () => {
    const state = {
      ...initialState,
      servingPlayer: Player.Player2,
      gameState: {
        Player1: Score.Forty,
        Player2: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.BreakPoint);
  });

  it("should set point type to BREAK_POINT when advantage", () => {
    const state = {
      ...initialState,
      servingPlayer: Player.Player2,
      gameState: {
        Player1: Score.Advantage,
        Player2: Score.Forty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.BreakPoint);
  });

  it("should set point type to SET_POINT", () => {
    const state = {
      ...initialState,
      games: { Player1: 5, Player2: 4 },
      gameState: {
        Player1: Score.Forty,
        Player2: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.SetPoint);
  });

  it("should set point type to MATCH_POINT", () => {
    const state: MatchState = {
      ...initialState,
      sets: [
        { [Player.Player1]: 7, [Player.Player2]: 6 },
        { [Player.Player1]: 6, [Player.Player2]: 7 },
      ],
      games: { Player1: 5, Player2: 4 },
      gameState: {
        Player1: Score.Forty,
        Player2: Score.Thirty,
      },
      matchConfig: {
        setsToWin: 3,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.MatchPoint);
  });

  it("should handle tiebreak and set point type to SET_POINT", () => {
    const state = {
      ...initialState,
      games: { Player1: 6, Player2: 6 },
      tiebreak: { Player1: 6, Player2: 5 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.SetPoint);
  });

  it("should handle tiebreak and set point type to MATCH_POINT for server", () => {
    const state = {
      ...initialState,
      sets: [{ Player1: 6, Player2: 4 }],
      games: { Player1: 6, Player2: 6 },
      tiebreak: { Player1: 6, Player2: 5 },
      servingPlayer: Player.Player1,
      matchConfig: {
        setsToWin: 3,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.MatchPoint);
  });

  it("should handle tiebreak and set point type to MATCH_POINT", () => {
    const state = {
      ...initialState,
      servingPlayer: Player.Player2,
      sets: [{ Player1: 6, Player2: 4 }],
      games: { Player1: 6, Player2: 6 },
      tiebreak: { Player1: 6, Player2: 5 },
      matchConfig: {
        setsToWin: 3,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.MatchPoint);
  });

  it("should return NORMAL point type when no specific conditions are met", () => {
    const state = {
      ...initialState,
      gameState: {
        Player1: Score.Thirty,
        Player2: Score.Fifteen,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.Normal);
  });
});

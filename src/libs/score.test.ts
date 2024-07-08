import { describe, it, expect } from "vitest";
import { Action, addPointState, getDeuceCount, getWinStreak, reducer } from "./score"; // Adjust the import path as needed
import { AnnouncementEventType, MatchState, Player, PlayerPositions, PointType, Score } from "../types";

const defaultMatchConfig: MatchState["matchConfig"] = {
  numberOfSets: 3,
  setLength: 6,
  names: { [Player.Player1]: "Player1", [Player.Player2]: "Player2" },
  inputTypes: { [Player.Player1]: "gamepad", [Player.Player2]: "gamepad" },
  soundOn: true,
  tieBreakLastSet: false,
};
describe("Tennis Match Reducer", () => {
  const initialState: MatchState = {
    sets: [],
    games: { [Player.Player1]: 0, [Player.Player2]: 0 },
    tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
    rallies: [],
    servingPlayer: Player.Player1,
    playerPositions: PlayerPositions.Initial,
    gameState: {
      [Player.Player1]: Score.Love,
      [Player.Player2]: Score.Love,
    },
    events: [],
    matchConfig: defaultMatchConfig,
    pointType: PointType.Normal,
  };

  describe("should update the number of games won and sets won correctly", () => {
    it("should update number of games correctly", () => {
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const state = { ...initialState, gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty } };
      const updatedState = reducer(state, action); // Player1 wins the game
      expect(updatedState.games[Player.Player1]).toBe(1);
      expect(updatedState.games[Player.Player2]).toBe(0);
    });

    it("should update number of sets correctly", () => {
      const state = {
        ...initialState,
        gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty },
        games: { [Player.Player1]: 5, [Player.Player2]: 0 },
      };
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const updatedState = reducer(state, action); // Player1 wins the set
      expect(updatedState.games[Player.Player1]).toBe(0);
      expect(updatedState.games[Player.Player2]).toBe(0);
      expect(updatedState.sets.length).toBe(1);
      expect(updatedState.matchWinner).toBe(undefined);
      expect(updatedState.sets[0]).toEqual({ [Player.Player1]: 6, [Player.Player2]: 0 });
    });

    it("should enter tie break if 6 games all", () => {
      const state = {
        ...initialState,
        gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty },
        games: { [Player.Player1]: 5, [Player.Player2]: 6 },
      };
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const updatedState = reducer(state, action); // Should be tie break
      expect(updatedState.games[Player.Player1]).toBe(6);
      expect(updatedState.games[Player.Player2]).toBe(6);
      expect(updatedState.sets.length).toBe(0);
    });

    it.each([
      { sets: [], matchConfig: { numberOfSets: 3, setLength: 6 } },
      { sets: [{ [Player.Player1]: 7, [Player.Player2]: 6 }], matchConfig: { numberOfSets: 3, setLength: 6 } },
      {
        sets: [
          { [Player.Player1]: 7, [Player.Player2]: 6 },
          { [Player.Player1]: 6, [Player.Player2]: 7 },
        ],
        matchConfig: { numberOfSets: 5, setLength: 6 },
      },
      {
        sets: [
          { [Player.Player1]: 4, [Player.Player2]: 3 },
          { [Player.Player1]: 3, [Player.Player2]: 1 },
          { [Player.Player1]: 2, [Player.Player2]: 4 },
        ],
        matchConfig: { numberOfSets: 5, setLength: 3 },
      },
      {
        sets: [
          { [Player.Player1]: 7, [Player.Player2]: 5 },
          { [Player.Player1]: 6, [Player.Player2]: 4 },
          { [Player.Player1]: 4, [Player.Player2]: 6 },
        ],
        matchConfig: { numberOfSets: 5, setLength: 6 },
      },
    ])("should score tie break point if $matchConfig.setLength games all not in final set", ({ sets, matchConfig }) => {
      const state: MatchState = {
        ...initialState,
        sets,
        matchConfig: { ...defaultMatchConfig, ...matchConfig },
        games: { [Player.Player1]: matchConfig.setLength, [Player.Player2]: matchConfig.setLength },
      };
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const updatedState = reducer(state, action); // Should be tie break
      expect(updatedState.games[Player.Player1]).toBe(matchConfig.setLength);
      expect(updatedState.games[Player.Player2]).toBe(matchConfig.setLength);
      expect(updatedState.tiebreak[Player.Player1]).toBe(1);
      expect(updatedState.tiebreak[Player.Player2]).toBe(0);
    });

    it("should change serve and ends correctly during tiebreak", () => {
      let state: MatchState = {
        ...initialState,
        servingPlayer: Player.Player1,

        sets: [],
        games: { [Player.Player1]: 6, [Player.Player2]: 6 },
        tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
      };

      // Point 1: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(1);
      expect(state.tiebreak[Player.Player2]).toBe(0);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after the first point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 2: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", side: "rightPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(1);
      expect(state.tiebreak[Player.Player2]).toBe(1);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after two points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 3: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", side: "rightPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(1);
      expect(state.tiebreak[Player.Player2]).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 4: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(2);
      expect(state.tiebreak[Player.Player2]).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 5: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(3);
      expect(state.tiebreak[Player.Player2]).toBe(2);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 6: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", side: "rightPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(3);
      expect(state.tiebreak[Player.Player2]).toBe(3);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // Ends change after 6 points

      // Point 7: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(3);
      expect(state.tiebreak[Player.Player2]).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 8: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "rightPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(4);
      expect(state.tiebreak[Player.Player2]).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 9: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "rightPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(5);
      expect(state.tiebreak[Player.Player2]).toBe(4);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 10: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(5);
      expect(state.tiebreak[Player.Player2]).toBe(5);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 11: Player2 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(5);
      expect(state.tiebreak[Player.Player2]).toBe(6);
      expect(state.pointType).toBe(PointType.BreakSetPoint);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End stays the same

      // Point 12: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "rightPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(6);
      expect(state.tiebreak[Player.Player2]).toBe(6);
      expect(state.servingPlayer).toBe(Player.Player1); // Serve stays the same after one point
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // Ends change after 6 points

      // Point 13: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(7);
      expect(state.tiebreak[Player.Player2]).toBe(6);
      expect(state.pointType).toBe(PointType.BreakSetPoint);
      expect(state.servingPlayer).toBe(Player.Player2); // Serve changes after two more points
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // End stays the same

      // Point 13: Player1 scores
      state = reducer(state, { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } });
      expect(state.tiebreak[Player.Player1]).toBe(0);
      expect(state.tiebreak[Player.Player2]).toBe(0);
      expect(state.servingPlayer).toBe(Player.Player2); // 13 games played so player two serves in the 14th
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // End Changes because 14th game
      expect(state.sets).toEqual([{ [Player.Player1]: 7, [Player.Player2]: 6 }]);
    });

    it("should win the tiebreak at 7 - 5", () => {
      const state: MatchState = {
        ...initialState,
        servingPlayer: Player.Player1,

        sets: [],
        games: { [Player.Player1]: 6, [Player.Player2]: 6 },
        tiebreak: { [Player.Player1]: 6, [Player.Player2]: 5 },
      };

      const nextState = reducer(state, {
        type: "POINT_SCORED",
        side: "leftPlayer",
        stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 },
      });
      expect(nextState.tiebreak[Player.Player1]).toBe(0);
      expect(nextState.tiebreak[Player.Player2]).toBe(0);
      expect(nextState.servingPlayer).toBe(Player.Player2); // 13 games played so player two serves in the 14th
      expect(nextState.playerPositions).toBe(PlayerPositions.Reversed); // End Changes because 14th game
      expect(nextState.sets).toEqual([{ [Player.Player1]: 7, [Player.Player2]: 6 }]);
    });

    it("should change ends after the first game and every two games thereafter", () => {
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      let state: MatchState = {
        ...initialState,
        playerPositions: PlayerPositions.Initial,
        servingPlayer: Player.Player1,
        gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty },
      };

      state = reducer(state, action); // Player1 wins the first game
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // should swap ends after first game
      expect(state.servingPlayer).toBe(Player.Player2);
      expect(state.events).toEqual(expect.arrayContaining([{ type: AnnouncementEventType.SwitchEnds }]));

      state = { ...state, gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty } };
      state = reducer(state, { ...action, side: "rightPlayer" }); // Player1 wins the second game
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // No change after the second game
      expect(state.events).not.toEqual(expect.arrayContaining([{ type: AnnouncementEventType.SwitchEnds }]));

      state = { ...state, gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty } };
      state = reducer(state, { ...action, side: "rightPlayer" }); // Player1 wins the third game
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // Change after the third game
      expect(state.events).toEqual(expect.arrayContaining([{ type: AnnouncementEventType.SwitchEnds }]));

      state = { ...state, gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty } };
      state = reducer(state, { ...action, side: "leftPlayer" }); // Player1 wins the fourth game
      expect(state.playerPositions).toBe(PlayerPositions.Initial); // No change after the fourth game
      expect(state.events).not.toEqual(expect.arrayContaining([{ type: AnnouncementEventType.SwitchEnds }]));

      state = { ...state, gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty } };
      state = reducer(state, { ...action, side: "leftPlayer" }); // Player1 wins the fifth game
      expect(state.playerPositions).toBe(PlayerPositions.Reversed); // Change after the fifth game
      expect(state.events).toEqual(expect.arrayContaining([{ type: AnnouncementEventType.SwitchEnds }]));
    });

    it.each([
      // player 1 winning in straight sets (3 set match)
      {
        stateSettings: {
          sets: [{ [Player.Player1]: 6, [Player.Player2]: 0 }],
          games: { [Player.Player1]: 5, [Player.Player2]: 3 },
          gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
        },
        actionSettings: { side: "leftPlayer" },
        winner: Player.Player1,
      },
      // player 2 winning in straight sets (3 set match)
      {
        stateSettings: {
          sets: [{ [Player.Player1]: 0, [Player.Player2]: 6 }],
          games: { [Player.Player1]: 4, [Player.Player2]: 5 },
          gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Advantage },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
        },
        actionSettings: { side: "rightPlayer" },
        winner: Player.Player2,
      },
      // player 1 winning in straight sets (5 set match)
      {
        stateSettings: {
          sets: [
            { [Player.Player1]: 6, [Player.Player2]: 0 },
            { [Player.Player1]: 6, [Player.Player2]: 0 },
          ],
          games: { [Player.Player1]: 5, [Player.Player2]: 3 },
          gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Thirty },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 5, setLength: 6 },
        },
        actionSettings: { side: "leftPlayer" },
        winner: Player.Player1,
      },
      // player 2 winning in straight sets (5 set match)
      {
        stateSettings: {
          sets: [
            { [Player.Player1]: 0, [Player.Player2]: 6 },
            { [Player.Player1]: 0, [Player.Player2]: 6 },
          ],
          games: { [Player.Player1]: 4, [Player.Player2]: 5 },
          gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Advantage },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 5, setLength: 6 },
        },
        actionSettings: { side: "rightPlayer" },
        winner: Player.Player2,
      },
      // player 1 winning in 3rd set (3 set match)
      {
        stateSettings: {
          sets: [
            { [Player.Player1]: 0, [Player.Player2]: 6 },
            { [Player.Player1]: 6, [Player.Player2]: 0 },
          ],
          games: { [Player.Player1]: 5, [Player.Player2]: 4 },
          gameState: { [Player.Player1]: Score.Advantage, [Player.Player2]: Score.Forty },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
        },
        actionSettings: { side: "leftPlayer" },
        winner: Player.Player1,
      },
      // player 2 winning in 3rd set (3 set match)
      {
        stateSettings: {
          sets: [
            { [Player.Player1]: 0, [Player.Player2]: 6 },
            { [Player.Player1]: 6, [Player.Player2]: 0 },
          ],
          games: { [Player.Player1]: 4, [Player.Player2]: 5 },
          gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Advantage },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
        },
        actionSettings: { side: "rightPlayer" },
        winner: Player.Player2,
      },
      // player 2 winning in 3rd set (3 set match)
      {
        stateSettings: {
          sets: [
            { [Player.Player1]: 0, [Player.Player2]: 4 },
            { [Player.Player1]: 4, [Player.Player2]: 0 },
          ],
          games: { [Player.Player1]: 2, [Player.Player2]: 3 },
          gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Advantage },
          matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 4 },
        },
        actionSettings: { side: "rightPlayer" },
        winner: Player.Player2,
      },
    ])(
      "$winner winning in set $stateSettings.sets.length + 1 ($stateSettings.matchConfig.numberOfSets set match of set length $stateSettings.matchConfig.setLength)",
      ({ stateSettings, actionSettings, winner }) => {
        const action: Action = {
          type: "POINT_SCORED",
          stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 },
          ...(actionSettings as { side: "leftPlayer" | "rightPlayer" }),
        };
        const state: MatchState = {
          ...initialState,
          playerPositions: PlayerPositions.Initial,
          ...stateSettings,
        };
        const newState = reducer(state, action);
        expect(newState.matchWinner).toBe(winner);
        expect(newState.events).toEqual(
          expect.arrayContaining([{ type: AnnouncementEventType.WinGame, winType: "match", playerName: state.matchConfig.names[winner] }])
        );
      }
    );

    it("should work going from deuce to advantage", () => {
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const state: MatchState = {
        ...initialState,
        playerPositions: PlayerPositions.Initial,
        servingPlayer: Player.Player1,
        gameState: { [Player.Player1]: Score.Forty, [Player.Player2]: Score.Forty },
      };
      const nextState = reducer(state, action); // should be advantage player 1
      expect(nextState.gameState[Player.Player1]).toBe(Score.Advantage);
    });

    it("should work going from advantage to next game", () => {
      const action: Action = { type: "POINT_SCORED", side: "leftPlayer", stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } };
      const state: MatchState = {
        ...initialState,
        games: { [Player.Player1]: 0, [Player.Player2]: 0 },
        playerPositions: PlayerPositions.Initial,
        servingPlayer: Player.Player1,
        gameState: { [Player.Player1]: Score.Advantage, [Player.Player2]: Score.Forty },
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
    { rallies: [], expected: { streak: 0 } },
    {
      rallies: [{ winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } }],
      expected: { player: Player.Player1, streak: 1 },
    },
    {
      rallies: [
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
      ],
      expected: { player: Player.Player1, streak: 2 },
    },
    {
      rallies: [
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
      ],
      expected: { player: Player.Player1, streak: 3 },
    },
    {
      rallies: [
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player2, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
        { winner: Player.Player1, stats: { rallyLength: 5, serveSpeed: 5, server: Player.Player1 } },
      ],
      expected: { player: Player.Player1, streak: 1 },
    },
  ])("win streak should be $expected", ({ rallies, expected }) => {
    expect(getWinStreak(rallies as MatchState["rallies"])).toEqual(expected);
  });
});

describe("addPointState", () => {
  const initialState: MatchState = {
    sets: [{ [Player.Player1]: 0, [Player.Player2]: 0 }],
    games: { [Player.Player1]: 0, [Player.Player2]: 0 },
    tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
    rallies: [],
    servingPlayer: Player.Player1,
    playerPositions: PlayerPositions.Initial,
    gameState: {
      [Player.Player1]: Score.Love,
      [Player.Player2]: Score.Love,
    },
    matchConfig: defaultMatchConfig,
    events: [],
    pointType: PointType.Normal,
  };

  it("should set point type to DEUCE", () => {
    const state = {
      ...initialState,
      gameState: {
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Forty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.Deuce);
  });

  it("should set point type to GAME_POINT", () => {
    const state = {
      ...initialState,
      gameState: {
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.GamePoint);
  });

  it("should set point type to GAME_POINT when advantage", () => {
    const state = {
      ...initialState,
      gameState: {
        [Player.Player1]: Score.Advantage,
        [Player.Player2]: Score.Forty,
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
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Thirty,
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
        [Player.Player1]: Score.Advantage,
        [Player.Player2]: Score.Forty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.BreakPoint);
  });

  it("should set point type to SET_POINT", () => {
    const state = {
      ...initialState,
      games: { [Player.Player1]: 5, [Player.Player2]: 4 },
      gameState: {
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.SetPoint);
  });

  it("should NOT set point type to SET_POINT if games not clear by two", () => {
    const state = {
      ...initialState,
      games: { [Player.Player1]: 5, [Player.Player2]: 5 },
      gameState: {
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).not.toBe(PointType.SetPoint);
  });

  it("should set point type to SET_POINT if games ARE clear by two", () => {
    const state = {
      ...initialState,
      games: { [Player.Player1]: 6, [Player.Player2]: 5 },
      gameState: {
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Thirty,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.SetPoint);
  });

  it.each([{ ...defaultMatchConfig, setLength: 4, numberOfSets: 3 }])(
    "should set point type to SET_POINT in set length $setLength",
    (matchConfig) => {
      const state = {
        ...initialState,
        games: { [Player.Player1]: 3, [Player.Player2]: 2 },
        gameState: {
          [Player.Player1]: Score.Forty,
          [Player.Player2]: Score.Thirty,
        },
        matchConfig,
      };
      const updatedState = addPointState(state);
      expect(updatedState.pointType).toBe(PointType.SetPoint);
    }
  );

  it("should set point type to MATCH_POINT", () => {
    const state: MatchState = {
      ...initialState,
      sets: [
        { [Player.Player1]: 7, [Player.Player2]: 6 },
        { [Player.Player1]: 6, [Player.Player2]: 7 },
      ],
      games: { [Player.Player1]: 5, [Player.Player2]: 4 },
      gameState: {
        [Player.Player1]: Score.Forty,
        [Player.Player2]: Score.Thirty,
      },
      matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.MatchPoint);
  });

  it("should handle tiebreak and set point type to TIEBREAK", () => {
    const state = {
      ...initialState,
      games: { [Player.Player1]: 6, [Player.Player2]: 6 },
      tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.Tiebreak);
  });

  it("should handle tiebreak and set point type to TIEBREAK", () => {
    const state: MatchState = {
      ...initialState,
      matchConfig: { ...initialState.matchConfig, numberOfSets: 1, tieBreakLastSet: true },
      games: { [Player.Player1]: 6, [Player.Player2]: 6 },
      tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.Tiebreak);
  });

  it("should handle tiebreak and set point type to SET_POINT", () => {
    const state = {
      ...initialState,
      games: { [Player.Player1]: 6, [Player.Player2]: 6 },
      tiebreak: { [Player.Player1]: 6, [Player.Player2]: 5 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.SetPoint);
  });

  it("should handle tiebreak and set point type to MATCH_POINT for server", () => {
    const state = {
      ...initialState,
      sets: [{ [Player.Player1]: 6, [Player.Player2]: 4 }],
      games: { [Player.Player1]: 6, [Player.Player2]: 6 },
      tiebreak: { [Player.Player1]: 6, [Player.Player2]: 5 },
      servingPlayer: Player.Player1,
      matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.MatchPoint);
  });

  it("should handle tiebreak and set point type to BREAK_MATCH_POINT", () => {
    const state: MatchState = {
      ...initialState,
      servingPlayer: Player.Player2,
      sets: [{ [Player.Player1]: 6, [Player.Player2]: 4 }],
      games: { [Player.Player1]: 6, [Player.Player2]: 6 },
      tiebreak: { [Player.Player1]: 6, [Player.Player2]: 5 },
      matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.BreakMatchPoint);
  });

  it("should handle tiebreak and set point type to MATCH_POINT in set length of 4", () => {
    const state: MatchState = {
      ...initialState,
      servingPlayer: Player.Player2,
      sets: [{ [Player.Player1]: 4, [Player.Player2]: 2 }],
      games: { [Player.Player1]: 4, [Player.Player2]: 4 },
      tiebreak: { [Player.Player1]: 6, [Player.Player2]: 5 },
      matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 4 },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.BreakMatchPoint);
  });

  it("should return NORMAL point type when no specific conditions are met", () => {
    const state = {
      ...initialState,
      gameState: {
        [Player.Player1]: Score.Thirty,
        [Player.Player2]: Score.Fifteen,
      },
    };
    const updatedState = addPointState(state);
    expect(updatedState.pointType).toBe(PointType.Normal);
  });
});

describe("getDeuceCount", () => {
  const initialState: MatchState = {
    sets: [],
    games: { [Player.Player1]: 0, [Player.Player2]: 0 },
    tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
    rallies: [],
    servingPlayer: Player.Player1,
    playerPositions: PlayerPositions.Initial,
    gameState: {
      [Player.Player1]: Score.Love,
      [Player.Player2]: Score.Love,
    },
    events: [],
    matchConfig: { ...defaultMatchConfig, numberOfSets: 3, setLength: 6 },
    pointType: PointType.Normal,
  };

  const defaultStats = { rallyLength: 1, serveSpeed: 1, server: Player.Player1 };

  it.each([
    { rallies: [], pointType: PointType.GamePoint, expected: 0 },
    { rallies: [], pointType: PointType.Deuce, expected: 1 },
    { rallies: [{ stats: defaultStats, winner: Player.Player1, pointType: PointType.GamePoint }], pointType: PointType.Deuce, expected: 1 },
    {
      rallies: [
        { stats: defaultStats, winner: Player.Player1, pointType: PointType.Deuce },
        { stats: defaultStats, winner: Player.Player1, pointType: PointType.GamePoint },
      ],
      pointType: PointType.Deuce,
      expected: 2,
    },
    {
      rallies: [
        { stats: defaultStats, winner: Player.Player1, pointType: PointType.Deuce },
        { stats: defaultStats, winner: Player.Player1, pointType: PointType.GamePoint },
        { stats: defaultStats, winner: Player.Player1, pointType: PointType.Deuce },
        { stats: defaultStats, winner: Player.Player1, pointType: PointType.GamePoint },
      ],
      pointType: PointType.Deuce,
      expected: 3,
    },
  ])("should count $expected previous deuces", ({ rallies, pointType, expected }) => {
    const matchState: MatchState = {
      ...initialState,
      rallies,
      pointType,
    };
    expect(getDeuceCount(matchState)).toBe(expected);
  });
});

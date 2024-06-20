import { LONG_RALLY_ANNOUNCEMENT_THRESHOLD } from "../config";
import { AnnouncementEvent, AnnouncementEventType, MatchState, Player, PlayerPositions, PointType, Score, WinGameEvent } from "../types";

export const initialState: MatchState = {
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
  matchConfig: {
    numberOfSets: 3,
    setLength: 6,
    names: { [Player.Player1]: "Player1", [Player.Player2]: "Player2" },
    soundOn: true,
  },
  events: [],
  pointType: PointType.Normal,
};

export type Action =
  | { type: "POINT_SCORED"; player: Player; stats: { rallyLength: number; serveSpeed: number; server: Player } }
  | { type: "CLEAR_EVENTS" }
  | { type: "HIT_PADDLE" }
  | { type: "WALL_CONTACT" }
  | { type: "SERVE" };

export function reducer(state: MatchState, action: Action): MatchState {
  if (state.matchWinner) {
    return state; // No changes if there's already a match winner
  }

  switch (action.type) {
    case "POINT_SCORED": {
      const { player, stats } = action;
      const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;
      if (isTiebreak(state)) {
        if (isTiebreakSetPoint(state, player, opponent)) {
          // Handle tiebreak win
          const finalSetScore = { ...state.games, [player]: state.games[player] + 1 };
          const newSets = [...state.sets, finalSetScore];
          const totalGamesPlayed = newSets.reduce((total, set) => total + set[Player.Player1] + set[Player.Player2], 0);
          const newState: MatchState = {
            ...state,
            events: [],
            sets: [...state.sets, finalSetScore],
            tiebreak: { [Player.Player1]: 0, [Player.Player2]: 0 },
            games: { [Player.Player1]: 0, [Player.Player2]: 0 },
            rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
            servingPlayer: totalGamesPlayed % 2 === 0 ? Player.Player1 : Player.Player2,
            gameState: {
              [Player.Player1]: Score.Love,
              [Player.Player2]: Score.Love,
            },
          };
          const isWinner = checkIsWinner(newState, player, opponent);
          const winEvent: WinGameEvent = { type: AnnouncementEventType.WinGame, winType: isWinner ? "match" : "set", player };
          return switchEndsIfNeeded(addRallyEvents(addPointState({ ...newState, matchWinner: isWinner ? player : undefined, events: [winEvent] })));
        }
        // handle tie break point score
        const pointsPlayed = state.tiebreak[Player.Player1] + state.tiebreak[Player.Player2] + 1;
        const shouldChangeEnds = pointsPlayed % 6 === 0;
        const shouldChangeServer = (pointsPlayed - 1) % 2 === 0;
        return addRallyEvents(
          addPointState({
            ...state,
            tiebreak: {
              ...state.tiebreak,
              [player]: state.tiebreak[player] + 1,
            },
            rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
            servingPlayer: shouldChangeServer ? switchServer(state.servingPlayer) : state.servingPlayer,
            playerPositions: shouldChangeEnds ? switchEnd(state.playerPositions) : state.playerPositions,
            events: [...(shouldChangeEnds ? [{ type: AnnouncementEventType.SwitchEnds } as AnnouncementEvent] : [])],
          })
        );
      }

      // regular game logic
      // Handle back to deuce
      if (state.gameState[opponent] === Score.Advantage) {
        return addRallyEvents(
          addPointState({
            ...state,
            rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
            gameState: {
              ...state.gameState,
              [opponent]: Score.Forty,
            },
            events: [],
          })
        );
      }

      // Handle gaining advantage
      if (isDeuce(state)) {
        return addRallyEvents(
          addPointState({
            ...state,
            rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
            gameState: {
              ...state.gameState,
              [player]: Score.Advantage,
            },
            events: [],
          })
        );
      }

      const isDeuceMode = [state.gameState[opponent], state.gameState[player]].every((score) => [Score.Forty, Score.Advantage].includes(score));
      const newScore = getNextScore(state.gameState[player], isDeuceMode);

      if (newScore === Score.Game) {
        const newGames = {
          ...state.games,
          [player]: state.games[player] + 1,
        };

        // Check for match / set win condition
        if (newGames[player] >= state.matchConfig.setLength && newGames[player] - newGames[opponent] >= 2) {
          const newSets = [...state.sets, newGames];

          const newState = {
            ...state,
            sets: newSets,
            games: { [Player.Player1]: 0, [Player.Player2]: 0 },
            rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
            servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
            gameState: {
              [Player.Player1]: Score.Love,
              [Player.Player2]: Score.Love,
            },
            events: [],
          };
          const isWinner = checkIsWinner(newState, player, opponent);
          const winEvent: WinGameEvent = { type: AnnouncementEventType.WinGame, winType: isWinner ? "match" : "set", player };
          return switchEndsIfNeeded(addRallyEvents(addPointState({ ...newState, matchWinner: isWinner ? player : undefined, events: [winEvent] })));
        }
        // win games within set
        const newState = {
          ...state,
          games: newGames,
          gameState: {
            [Player.Player1]: Score.Love,
            [Player.Player2]: Score.Love,
          },
          rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
          servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
          events: [{ type: AnnouncementEventType.WinGame, winType: "game", player: player } as WinGameEvent],
        };
        return switchEndsIfNeeded(addRallyEvents(addPointState({ ...newState })));
      }
      // scores
      return addRallyEvents(
        addPointState({
          ...state,
          rallies: [...state.rallies, { winner: player, pointType: state.pointType, stats }],
          gameState: {
            ...state.gameState,
            [player]: newScore,
          },
          events: [],
        })
      );
    }
    case "SERVE": {
      return { ...state, events: [] };
    }

    default:
      return state;
  }
}

const scoreOrder: Score[] = [Score.Love, Score.Fifteen, Score.Thirty, Score.Forty, Score.Game];
const scoreOrderInDeuce: Score[] = [Score.Forty, Score.Advantage, Score.Game];

export function getNextScore(currentScore: Score, isDeuceMode: boolean): Score {
  const currentIndex = (isDeuceMode ? scoreOrderInDeuce : scoreOrder).indexOf(currentScore);
  return (isDeuceMode ? scoreOrderInDeuce : scoreOrder)[currentIndex + 1];
}

function switchEnd(currentEnd: PlayerPositions): PlayerPositions {
  return currentEnd === PlayerPositions.Initial ? PlayerPositions.Reversed : PlayerPositions.Initial;
}

function switchEndsIfNeeded(state: MatchState): MatchState {
  const totalGamesPlayed = state.sets.reduce(
    (acc, { [Player.Player1]: player1, [Player.Player2]: player2 }) => acc + player1 + player2,
    state.games[Player.Player1] + state.games[Player.Player2]
  );
  const shouldSwitchEnd = (totalGamesPlayed - 1) % 2 == 0;
  if (shouldSwitchEnd) {
    return { ...state, playerPositions: switchEnd(state.playerPositions), events: [...state.events, { type: AnnouncementEventType.SwitchEnds }] };
  }
  return state;
}

function switchServer(currentServer: Player): Player {
  return currentServer === Player.Player1 ? Player.Player2 : Player.Player1;
}

function checkIsWinner(state: MatchState, player: Player, opponent: Player): boolean {
  const playerSets = state.sets.reduce((acc, set) => {
    if (set[player] > set[opponent]) {
      return acc + 1;
    } else {
      return acc;
    }
  }, 0);
  return playerSets >= Math.ceil(state.matchConfig.numberOfSets / 2);
}

function addRallyEvents(state: MatchState): MatchState {
  const {
    stats: { rallyLength: latestLength, serveSpeed },
  } = state.rallies[state.rallies.length - 1];

  const events: AnnouncementEvent[] = [];

  const deuceCount = getDeuceCount(state);
  if (deuceCount >= 3) {
    events.push({ type: AnnouncementEventType.DeuceCount, count: deuceCount });
  }

  // win streak
  const winStreak = getWinStreak(state.rallies);
  if (winStreak > 0 && winStreak % 5 === 0) {
    events.push({ type: AnnouncementEventType.WinStreak, streak: winStreak });
  }

  if (latestLength === 1) {
    events.push({ type: AnnouncementEventType.Ace, speed: serveSpeed.toFixed(3) });
  }

  const previousRallies = state.rallies.slice(0, -1);
  const prevHighest = previousRallies.reduce((highest, { stats }) => Math.max(highest, stats.rallyLength), 0);
  if (latestLength >= LONG_RALLY_ANNOUNCEMENT_THRESHOLD && latestLength > prevHighest) {
    events.push({ type: AnnouncementEventType.LongRally, length: latestLength });
  }

  return { ...state, events: [...state.events, ...events] };
}

export function getDeuceCount(state: MatchState): number {
  if (state.pointType === PointType.Deuce) {
    let deuceCount = 1;
    for (let i = 1; i < state.rallies.length; i++) {
      if (state.rallies[state.rallies.length - i * 2]?.pointType === PointType.Deuce) {
        deuceCount++;
      } else {
        return deuceCount;
      }
    }
    return deuceCount;
  }
  return 0;
}

export function getWinStreak(rallies: MatchState["rallies"]) {
  if (rallies.length < 1) return 0;
  const { winner } = rallies[rallies.length - 1];
  let streak = 0;
  for (let i = rallies.length - 1; i >= 0; i--) {
    if (rallies[i].winner !== winner) {
      break;
    }
    streak++;
  }
  return streak;
}

export function addPointState(state: MatchState): MatchState {
  const { games, gameState, servingPlayer, matchConfig, tiebreak } = state;
  for (const player of [Player.Player1, Player.Player2]) {
    const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;
    const setsWonByPlayer = state.sets.filter((set) => set[player] > set[opponent]).length;

    if (isTiebreak(state)) {
      // Determine if it is a match point during tiebreak
      if (setsWonByPlayer === Math.floor(matchConfig.numberOfSets / 2) && tiebreak[player] >= 6 && tiebreak[player] - tiebreak[opponent] >= 1) {
        return {
          ...state,
          pointType: PointType.MatchPoint,
        };
      }
      // Determine if it is a set point during tiebreak
      if (isTiebreakSetPoint(state, player, opponent)) {
        return {
          ...state,
          pointType: PointType.SetPoint,
        };
      }
    }

    // Regular game logic
    if (isDeuce(state)) {
      return {
        ...state,
        pointType: PointType.Deuce,
      };
    }

    if (isGamePoint(gameState[player], gameState[opponent])) {
      const isSetPoint = games[player] >= matchConfig.setLength - 1 && games[player] - games[opponent] > 0;
      if (isSetPoint) {
        const isMatchPoint = setsWonByPlayer === Math.floor(matchConfig.numberOfSets / 2);
        return {
          ...state,
          pointType: isMatchPoint ? PointType.MatchPoint : PointType.SetPoint,
        };
      }
      return {
        ...state,
        pointType: servingPlayer === player ? PointType.GamePoint : PointType.BreakPoint,
      };
    }
  }

  return {
    ...state,
    pointType: isTiebreak(state) ? PointType.Tiebreak : PointType.Normal,
  };
}

function isGamePoint(scoreOne: Score, scoreTwo: Score): boolean {
  return (
    (scoreOne === Score.Forty && ![Score.Forty, Score.Advantage].includes(scoreTwo)) || (scoreOne === Score.Advantage && scoreTwo === Score.Forty)
  );
}

function isTiebreak(state: MatchState): boolean {
  return (
    state.games[Player.Player1] === state.matchConfig.setLength &&
    state.games[Player.Player2] === state.matchConfig.setLength &&
    state.sets.length + 1 < state.matchConfig.numberOfSets
  );
}

function isTiebreakSetPoint(state: MatchState, player: Player, opponent: Player) {
  return state.tiebreak[player] >= 6 && state.tiebreak[player] - state.tiebreak[opponent] >= 1;
}

function isDeuce(state: MatchState): boolean {
  return state.gameState[Player.Player1] === Score.Forty && state.gameState[Player.Player2] === Score.Forty;
}

export function getLeftRightPlayer(playerPositions: PlayerPositions) {
  if (playerPositions === PlayerPositions.Reversed) {
    return { leftPlayer: Player.Player2, rightPlayer: Player.Player1 };
  }
  return { leftPlayer: Player.Player1, rightPlayer: Player.Player2 };
}

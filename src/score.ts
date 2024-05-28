import { LONG_RALLY_ANNOUNCEMENT_THRESHOLD } from "./config";
import { AnnouncementEvent, AnnouncementEventType, MatchState, Player, PlayerPositions, PointType, Score, WinGameEvent } from "./types";

export const initialState: MatchState = {
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
  matchConfig: {
    numberOfSets: 3,
    setLength: 1,
  },
  events: [],
  pointType: PointType.Normal,
};

export type Action =
  | { type: "POINT_SCORED"; player: Player; stats: { rallyLength: number; serveSpeed: number; server: Player } }
  | { type: "CLEAR_EVENTS" };

const scoreOrder: Score[] = [Score.Love, Score.Fifteen, Score.Thirty, Score.Forty, Score.Game];
const scoreOrderInDeuce: Score[] = [Score.Forty, Score.Advantage, Score.Game];

export function getNextScore(currentScore: Score, isDeuce: boolean): Score {
  const currentIndex = (isDeuce ? scoreOrderInDeuce : scoreOrder).indexOf(currentScore);
  return (isDeuce ? scoreOrderInDeuce : scoreOrder)[currentIndex + 1];
}

function switchEnd(currentEnd: PlayerPositions): PlayerPositions {
  return currentEnd === PlayerPositions.Initial ? PlayerPositions.Reversed : PlayerPositions.Initial;
}

function switchEndsIfNeeded(state: MatchState): MatchState {
  const totalGamesPlayed = state.sets.reduce((acc, { Player1, Player2 }) => acc + Player1 + Player2, state.games.Player1 + state.games.Player2);
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

export function reducer(state: MatchState, action: Action): MatchState {
  if (state.matchWinner) {
    return state; // No changes if there's already a match winner
  }

  switch (action.type) {
    case "POINT_SCORED": {
      const { player, stats } = action;
      const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;

      if (
        state.games[player] === state.matchConfig.setLength &&
        state.games[opponent] === state.matchConfig.setLength &&
        state.sets.length + 1 < state.matchConfig.numberOfSets
      ) {
        if (state.tiebreak[player] >= 6) {
          // Handle tiebreak scoring
          if (state.tiebreak[player] - state.tiebreak[opponent] >= 1) {
            const finalSetScore = { ...state.games, [player]: state.games[player] + 1 };
            const newSets = [...state.sets, finalSetScore];
            const totalGamesPlayed = newSets.reduce((total, set) => total + set[Player.Player1] + set[Player.Player2], 0);
            const newState: MatchState = {
              ...state,
              events: [],
              sets: [...state.sets, finalSetScore],
              tiebreak: { Player1: 0, Player2: 0 },
              games: { Player1: 0, Player2: 0 },
              rallies: [...state.rallies, { winner: player, stats }],
              servingPlayer: totalGamesPlayed % 2 === 0 ? Player.Player1 : Player.Player2,
              gameState: {
                Player1: Score.Love,
                Player2: Score.Love,
              },
            };
            const isWinner = checkIsWinner(newState, player, opponent);
            const winEvent: WinGameEvent = { type: AnnouncementEventType.WinGame, winType: isWinner ? "match" : "set", player };
            return switchEndsIfNeeded(addPointState(addRallyEvents({ ...newState, matchWinner: isWinner ? player : undefined, events: [winEvent] })));
          }
        }
        const pointsPlayed = state.tiebreak.Player1 + state.tiebreak.Player2 + 1;
        const shouldChangeEnds = pointsPlayed % 6 === 0;
        const shouldChangeServer = (pointsPlayed - 1) % 2 === 0;
        return addPointState(
          addRallyEvents({
            ...state,
            tiebreak: {
              ...state.tiebreak,
              [player]: state.tiebreak[player] + 1,
            },
            rallies: [...state.rallies, { winner: player, stats }],
            servingPlayer: shouldChangeServer ? switchServer(state.servingPlayer) : state.servingPlayer,
            playerPositions: shouldChangeEnds ? switchEnd(state.playerPositions) : state.playerPositions,
            events: [...(shouldChangeEnds ? [{ type: AnnouncementEventType.SwitchEnds } as AnnouncementEvent] : [])],
          })
        );
      }

      // Handle back to deuce
      if (state.gameState[opponent] === Score.Advantage) {
        return addPointState(
          addRallyEvents({
            ...state,
            rallies: [...state.rallies, { winner: player, stats }],
            gameState: {
              ...state.gameState,
              [opponent]: Score.Forty,
            },
            events: [],
          })
        );
      }

      // Handle gaining advantage
      if (state.gameState[opponent] === Score.Forty && state.gameState[player] === Score.Forty) {
        return addPointState(
          addRallyEvents({
            ...state,
            rallies: [...state.rallies, { winner: player, stats }],
            gameState: {
              ...state.gameState,
              [player]: Score.Advantage,
            },
            events: [],
          })
        );
      }

      const isDeuce = [state.gameState[opponent], state.gameState[player]].every((score) => [Score.Forty, Score.Advantage].includes(score));
      const newScore = getNextScore(state.gameState[player], isDeuce);

      if (newScore === Score.Game) {
        const newGames = {
          ...state.games,
          [player]: state.games[player] + 1,
        };

        // Check for set win condition
        if (newGames[player] >= state.matchConfig.setLength && newGames[player] - newGames[opponent] >= 2) {
          const newSets = [...state.sets, newGames];

          const newState = {
            ...state,
            sets: newSets,
            games: { Player1: 0, Player2: 0 },
            rallies: [...state.rallies, { winner: player, stats }],
            servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
            gameState: {
              Player1: Score.Love,
              Player2: Score.Love,
            },
            events: [],
          };
          const isWinner = checkIsWinner(newState, player, opponent);
          const winEvent: WinGameEvent = { type: AnnouncementEventType.WinGame, winType: isWinner ? "match" : "set", player };
          return switchEndsIfNeeded(addPointState(addRallyEvents({ ...newState, matchWinner: player, events: [winEvent] })));
        }
        // wins games within set
        const newState = {
          ...state,
          games: newGames,
          gameState: {
            Player1: Score.Love,
            Player2: Score.Love,
          },
          rallies: [...state.rallies, { winner: player, stats }],
          servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
          events: [{ type: AnnouncementEventType.WinGame, winType: "game", player: player } as WinGameEvent],
        };
        return switchEndsIfNeeded(addPointState(addRallyEvents({ ...newState })));
      }
      // scores
      return addPointState(
        addRallyEvents({
          ...state,
          rallies: [...state.rallies, { winner: player, stats }],
          gameState: {
            ...state.gameState,
            [player]: newScore,
          },
          events: [],
        })
      );
    }
    case "CLEAR_EVENTS": {
      return { ...state, events: [] };
    }

    default:
      return state;
  }
}

function addRallyEvents(state: MatchState) {
  const {
    stats: { rallyLength: latestLength, serveSpeed },
  } = state.rallies[state.rallies.length - 1];

  // win streak
  const winStreak = getWinStreak(state.rallies);

  if (winStreak > 0 && winStreak % 5 === 0) {
    return { ...state, events: [...state.events, { type: AnnouncementEventType.WinStreak, streak: winStreak } as AnnouncementEvent] };
  }

  if (latestLength === 1) {
    return { ...state, events: [...state.events, { type: AnnouncementEventType.Ace, speed: serveSpeed.toFixed(3) } as AnnouncementEvent] };
  }

  const previousRallies = state.rallies.slice(0, -1);
  const prevHighest = previousRallies.reduce((highest, { stats }) => Math.max(highest, stats.rallyLength), 0);
  if (latestLength >= LONG_RALLY_ANNOUNCEMENT_THRESHOLD && latestLength > prevHighest) {
    return { ...state, events: [...state.events, { type: AnnouncementEventType.LongRally, length: latestLength } as AnnouncementEvent] };
  }

  return state;
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

    // Check if in tiebreak
    const inTiebreak = games[player] === state.matchConfig.setLength && games[opponent] === state.matchConfig.setLength;

    if (inTiebreak) {
      // Determine if it is a match point during tiebreak
      if (setsWonByPlayer === Math.floor(matchConfig.numberOfSets / 2) && tiebreak[player] >= 6 && tiebreak[player] - tiebreak[opponent] >= 1) {
        return {
          ...state,
          pointType: PointType.MatchPoint,
        };
      }

      // Determine if it is a set point during tiebreak
      if (tiebreak[player] >= 6 && tiebreak[player] - tiebreak[opponent] >= 1) {
        return {
          ...state,
          pointType: PointType.SetPoint,
        };
      }
    }

    // Regular game logic
    // Determine if it is Deuce
    if (gameState[player] === Score.Forty && gameState[opponent] === Score.Forty) {
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
    pointType: PointType.Normal,
  };
}

function isGamePoint(scoreOne: Score, scoreTwo: Score): boolean {
  return (
    (scoreOne === Score.Forty && ![Score.Forty, Score.Advantage].includes(scoreTwo)) || (scoreOne === Score.Advantage && scoreTwo === Score.Forty)
  );
}

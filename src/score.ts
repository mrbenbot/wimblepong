import { LONG_RALLY_ANNOUNCEMENT_THRESHOLD } from "./config";
import { AnnouncementEvent, AnnouncementEventType, MatchState, Player, PlayerPositions, PointType, Score } from "./types";

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
    setsToWin: 3,
  },
  events: [],
  pointType: PointType.Normal,
};

export type Action = { type: "POINT_SCORED"; player: Player; stats: { rallyLength: number; serveSpeed: number; server: Player } };

const scoreOrder: Score[] = [Score.Love, Score.Fifteen, Score.Thirty, Score.Forty, Score.Game];
const scoreOrderInDeuce: Score[] = [Score.Forty, Score.Advantage, Score.Game];

export function getNextScore(currentScore: Score, isDeuce: boolean): Score {
  const currentIndex = (isDeuce ? scoreOrderInDeuce : scoreOrder).indexOf(currentScore);
  return (isDeuce ? scoreOrderInDeuce : scoreOrder)[currentIndex + 1];
}

function switchEnd(currentEnd: PlayerPositions): PlayerPositions {
  return currentEnd === PlayerPositions.Initial ? PlayerPositions.Reversed : PlayerPositions.Initial;
}

function getNextEnd(state: MatchState): PlayerPositions {
  const totalGamesPlayed = state.sets.reduce((acc, { Player1, Player2 }) => acc + Player1 + Player2, state.games.Player1 + state.games.Player2);
  const shouldSwitchEnd = (totalGamesPlayed - 1) % 2 == 0;
  if (shouldSwitchEnd) {
    return switchEnd(state.playerPositions);
  }
  return state.playerPositions;
}
function switchServer(currentServer: Player): Player {
  return currentServer === Player.Player1 ? Player.Player2 : Player.Player1;
}

function checkMatchWinner(state: MatchState): Player | undefined {
  const [player1Sets, player2Sets] = state.sets.reduce(
    ([a, b], set) => {
      if (set.Player1 > set.Player2) {
        return [a + 1, b];
      } else {
        return [a, b + 1];
      }
    },
    [0, 0]
  );
  if (player1Sets >= state.matchConfig.setsToWin) {
    return Player.Player1;
  }
  if (player2Sets >= state.matchConfig.setsToWin) {
    return Player.Player2;
  }
  return undefined;
}

export function reducer(state: MatchState, action: Action): MatchState {
  if (state.matchWinner) {
    return state; // No changes if there's already a match winner
  }

  switch (action.type) {
    case "POINT_SCORED": {
      const { player, stats } = action;
      const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;

      if (state.games.Player1 === 6 && state.games.Player2 === 6 && state.sets.length + 1 !== state.matchConfig.setsToWin) {
        if (state.tiebreak.Player1 >= 7 || state.tiebreak.Player2 >= 7) {
          // Handle tiebreak scoring
          if (Math.abs(state.tiebreak.Player1 - state.tiebreak.Player2) >= 2) {
            const tiebreakWinner = state.tiebreak.Player1 > state.tiebreak.Player2 ? Player.Player1 : Player.Player2;
            const finalSetScore = { ...state.games, [tiebreakWinner]: state.games[tiebreakWinner] + 1 };
            const newState: MatchState = {
              ...state,
              sets: [...state.sets, finalSetScore],
              tiebreak: { Player1: 0, Player2: 0 },
              games: { Player1: 0, Player2: 0 },
              rallies: [...state.rallies, { winner: tiebreakWinner, stats }],
              servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
              playerPositions: getNextEnd(state),
              gameState: {
                Player1: Score.Love,
                Player2: Score.Love,
              },
            };
            return addPointState(addRallyEvents({ ...newState, matchWinner: checkMatchWinner(newState) }));
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
        if (newGames[player] >= 6 && newGames[player] - newGames[opponent] >= 2) {
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
          };
          return addPointState(addRallyEvents({ ...newState, playerPositions: getNextEnd(newState), matchWinner: checkMatchWinner(newState) }));
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
        };
        return addPointState(addRallyEvents({ ...newState, playerPositions: getNextEnd(newState) }));
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
        })
      );
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
  const receivingPlayer = servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1;

  for (const player of [Player.Player1, Player.Player2]) {
    const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;
    // Check if in tiebreak
    const inTiebreak = games[player] === 6 && games[opponent] === 6;

    if (inTiebreak) {
      // Tiebreak logic

      // Determine if it is a match point during tiebreak
      const setWonByPlayer = state.sets.filter((set) => set[player] > set[opponent]).length;
      if (setWonByPlayer === Math.floor(matchConfig.setsToWin / 2) && tiebreak[player] >= 6 && tiebreak[player] - tiebreak[opponent] >= 1) {
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

      return {
        ...state,
        pointType: PointType.Normal,
      };
    }

    // Regular game logic
    // Determine if it is Deuce
    if (gameState[player] === Score.Forty && gameState[opponent] === Score.Forty) {
      return {
        ...state,
        pointType: PointType.Deuce,
      };
    }

    // Determine if it is a set point
    if (games[player] === 5 && gameState[player] === Score.Forty && gameState[opponent] !== Score.Forty && gameState[opponent] !== Score.Advantage) {
      // Determine if it is also a match point
      const setsWonByServer = state.sets.filter((set) => set[player] > set[opponent]).length;
      if (setsWonByServer === Math.floor(matchConfig.setsToWin / 2)) {
        return {
          ...state,
          pointType: PointType.MatchPoint,
        };
      }
      return {
        ...state,
        pointType: PointType.SetPoint,
      };
    }
  }
  // Determine if it is a break point
  if (
    (gameState[receivingPlayer] === Score.Forty && gameState[servingPlayer] !== Score.Forty && gameState[servingPlayer] !== Score.Advantage) ||
    (gameState[receivingPlayer] === Score.Advantage && gameState[servingPlayer] === Score.Forty)
  ) {
    return {
      ...state,
      pointType: PointType.BreakPoint,
    };
  }

  // Determine if it is a game point
  if (
    (gameState[servingPlayer] === Score.Forty && gameState[receivingPlayer] !== Score.Forty && gameState[receivingPlayer] !== Score.Advantage) ||
    (gameState[servingPlayer] === Score.Advantage && gameState[receivingPlayer] === Score.Forty)
  ) {
    return {
      ...state,
      pointType: PointType.GamePoint,
    };
  }
  return {
    ...state,
    pointType: PointType.Normal,
  };
}

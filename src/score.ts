export enum Score {
  Love = "0",
  Fifteen = "15",
  Thirty = "30",
  Forty = "40",
  Advantage = "ADVANTAGE",
  Game = "GAME",
}

export enum SetResult {
  Win = "WIN",
  Loss = "LOSS",
}

export enum PlayerPositions {
  Initial = "INITIAL",
  Reversed = "REVERSED",
}

export enum Player {
  Player1 = "Player1",
  Player2 = "Player2",
}

export interface GameState {
  Player1: Score;
  Player2: Score;
  AdvantagePlayer?: Player;
}

export interface MatchState {
  sets: {
    [Player.Player1]: number;
    [Player.Player2]: number;
  }[];
  games: {
    [Player.Player1]: number;
    [Player.Player2]: number;
  };
  tiebreak: {
    [Player.Player1]: number;
    [Player.Player2]: number;
  };
  matchWinner?: Player;
  servingPlayer: Player;
  playerPositions: PlayerPositions;
  gameState: GameState;
  matchConfig: {
    setsToWin: number;
  };
}

export const initialState: MatchState = {
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

export type Action = { type: "POINT_SCORED"; player: Player };

const scoreOrder: Score[] = [Score.Love, Score.Fifteen, Score.Thirty, Score.Forty, Score.Game];

export function getNextScore(currentScore: Score): Score {
  const currentIndex = scoreOrder.indexOf(currentScore);
  return scoreOrder[currentIndex + 1];
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
      const { player } = action;
      const opponent = player === Player.Player1 ? Player.Player2 : Player.Player1;

      if (state.games.Player1 === 6 && state.games.Player2 === 6 && state.sets.length + 1 !== state.matchConfig.setsToWin) {
        if (state.tiebreak.Player1 >= 7 || state.tiebreak.Player2 >= 7) {
          // Handle tiebreak scoring
          if (Math.abs(state.tiebreak.Player1 - state.tiebreak.Player2) >= 2) {
            const tiebreakWinner = state.tiebreak.Player1 > state.tiebreak.Player2 ? Player.Player1 : Player.Player2;
            const finalSetScore = { ...state.games, [tiebreakWinner]: state.games[tiebreakWinner] + 1 };
            const newState = {
              ...state,
              sets: [...state.sets, finalSetScore],
              tiebreak: { Player1: 0, Player2: 0 },
              games: { Player1: 0, Player2: 0 },
              servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
              servingEnd: getNextEnd(state),
              gameState: {
                Player1: Score.Love,
                Player2: Score.Love,
              },
            };
            return { ...newState, matchWinner: checkMatchWinner(newState) };
          }
        }
        const pointsPlayed = state.tiebreak.Player1 + state.tiebreak.Player2 + 1;
        const shouldChangeEnds = pointsPlayed % 6 === 0;
        const shouldChangeServer = (pointsPlayed - 1) % 2 === 0;
        return {
          ...state,
          tiebreak: {
            ...state.tiebreak,
            [player]: state.tiebreak[player] + 1,
          },
          servingPlayer: shouldChangeServer ? switchServer(state.servingPlayer) : state.servingPlayer,
          playerPositions: shouldChangeEnds ? switchEnd(state.playerPositions) : state.playerPositions,
        };
      }

      // Handle deuce
      if (state.gameState[player] === Score.Forty && state.gameState[opponent] === Score.Forty) {
        if (state.gameState.AdvantagePlayer === opponent) {
          return {
            ...state,
            gameState: {
              ...state.gameState,
              AdvantagePlayer: undefined,
            },
          };
        }
        if (state.gameState.AdvantagePlayer === undefined) {
          return {
            ...state,
            gameState: {
              ...state.gameState,
              AdvantagePlayer: player,
            },
          };
        }
      }

      const newScore = getNextScore(state.gameState[player]);

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
            servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
            gameState: {
              Player1: Score.Love,
              Player2: Score.Love,
            },
          };
          return { ...newState, playerPositions: getNextEnd(newState), matchWinner: checkMatchWinner(newState) };
        }
        // wins games within set
        const newState = {
          ...state,
          games: newGames,
          gameState: {
            Player1: Score.Love,
            Player2: Score.Love,
          },
          servingPlayer: state.servingPlayer === Player.Player1 ? Player.Player2 : Player.Player1,
        };
        return { ...newState, playerPositions: getNextEnd(newState) };
      }
      // scores
      return {
        ...state,
        gameState: {
          ...state.gameState,
          [player]: newScore,
        },
      };
    }

    default:
      return state;
  }
}

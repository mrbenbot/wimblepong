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

export enum AnnouncementEventType {
  LongRally = "LONG_RALLY",
  Ace = "ACE",
  WinStreak = "WIN_STREAK",
}

export enum PointType {
  Normal = "NORMAL",
  GamePoint = "GAME_POINT",
  BreakPoint = "BREAK_POINT",
  SetPoint = "SET_POINT",
  MatchPoint = "MATCH_POINT",
}

export interface LongRallyEvent {
  type: AnnouncementEventType.LongRally;
  length: number;
}

export interface AceEvent {
  type: AnnouncementEventType.Ace;
  speed: string;
}

export interface WinStreakEvent {
  type: AnnouncementEventType.WinStreak;
  streak: number;
}

export type AnnouncementEvent = LongRallyEvent | AceEvent | WinStreakEvent;

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
  rallies: { winner: Player; stats: { rallyLength: number; serveSpeed: number; server: Player } }[];
  matchWinner?: Player;
  servingPlayer: Player;
  playerPositions: PlayerPositions;
  gameState: GameState;
  matchConfig: {
    setsToWin: number;
  };
  events: AnnouncementEvent[];
}

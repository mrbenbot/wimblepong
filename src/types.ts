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

export enum PointType {
  Normal = "NORMAL",
  Deuce = "DEUCE",
  GamePoint = "GAME_POINT",
  BreakPoint = "BREAK_POINT",
  SetPoint = "SET_POINT",
  MatchPoint = "MATCH_POINT",
  Tiebreak = "TIEBREAK",
}

export enum AnnouncementEventType {
  LongRally = "LONG_RALLY",
  Ace = "ACE",
  WinStreak = "WIN_STREAK",
  SwitchEnds = "SWITCH_ENDS",
  WinGame = "WIN_GAME",
  DeuceCount = "DEUCE_COUNT",
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

export interface SwitchEndsEvent {
  type: AnnouncementEventType.SwitchEnds;
}

export interface DeuceCountEvent {
  type: AnnouncementEventType.DeuceCount;
  count: number;
}

export interface WinGameEvent {
  type: AnnouncementEventType.WinGame;
  winType: "game" | "set" | "match";
  player: Player;
}

export type AnnouncementEvent = LongRallyEvent | AceEvent | WinStreakEvent | SwitchEndsEvent | WinGameEvent | DeuceCountEvent;

export interface GameState {
  Player1: Score;
  Player2: Score;
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
  rallies: { winner: Player; pointType: PointType; stats: { rallyLength: number; serveSpeed: number; server: Player } }[];
  matchWinner?: Player;
  servingPlayer: Player;
  playerPositions: PlayerPositions;
  gameState: GameState;
  matchConfig: {
    numberOfSets: number;
    setLength: number;
  };
  events: AnnouncementEvent[];
  pointType: PointType;
}

export interface InputData {
  lastData: Uint8Array | null;
  lastUpdated: number | null;
}

export interface DataRef {
  [Player.Player1]: InputData;
  [Player.Player2]: InputData;
}

export interface MutableGameState {
  paddle1: { x: number; y: number; dy: number; width: number; height: number };
  paddle2: { x: number; y: number; dy: number; width: number; height: number };
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    speed: number;
    serveMode: boolean;
    scoreMode: boolean;
    scoreModeTimeout: number;
  };
  stats: {
    rallyLength: number;
    serveSpeed: number;
    server: Player;
  };
}

export type GetPlayerActionsFunction = (
  player: Player,
  state: MutableGameState,
  canvas: HTMLCanvasElement,
  positionsReversed: boolean
) => {
  buttonPressed: boolean;
  paddleDirection: number;
};

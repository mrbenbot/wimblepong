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

export const enum Player {
  Player1,
  Player2,
}

export enum PointType {
  Normal = "NORMAL",
  Deuce = "DEUCE",
  GamePoint = "GAME_POINT",
  BreakPoint = "BREAK_POINT",
  BreakSetPoint = "BREAK_SET_POINT",
  SetPoint = "SET_POINT",
  MatchPoint = "MATCH_POINT",
  BreakMatchPoint = "BREAK_MATCH_POINT",
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
  playerName: string;
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
  playerName: string;
}

export type AnnouncementEvent = LongRallyEvent | AceEvent | WinStreakEvent | SwitchEndsEvent | WinGameEvent | DeuceCountEvent;

export interface GameState {
  [Player.Player1]: Score;
  [Player.Player2]: Score;
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
    names: { [Player.Player1]: string; [Player.Player2]: string };
    inputTypes: { [Player.Player1]: string; [Player.Player2]: string };
    colors: { [Player.Player1]: string; [Player.Player2]: string };
    soundOn: boolean;
    tieBreakLastSet: boolean;
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
  server: Player;
  positionsReversed: boolean;
  [Player.Player1]: { x: number; y: number; dy: number; width: number; height: number; colour: { r: number; g: number; b: number } };
  [Player.Player2]: { x: number; y: number; dy: number; width: number; height: number; colour: { r: number; g: number; b: number } };
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
  now: number
) => {
  buttonPressed: boolean;
  paddleDirection: number;
};

import { Melody, NoteType, longRally, noteFrequencies, switchEnds, winGame, winMatch, winSet, winStreak } from "../hooks/useSynthesizer";
import { AnnouncementEvent, AnnouncementEventType, MatchState } from "../types";
import { Action, getLeftRightPlayer } from "./score";

type MatchStateReducer = (state: MatchState, action: Action) => MatchState;

const soundMiddleware = (
  playNote: (
    note:
      | NoteType
      | {
          note: string;
          duration: number;
        }[]
  ) => void
): ((reducer: MatchStateReducer) => MatchStateReducer) => {
  return (reducer) => {
    return (state, action) => {
      const newState = reducer(state, action);

      if (newState.matchConfig.soundOn && !state.matchWinner) {
        if (newState.events.length > 0) {
          playNote(buildSoundsFromEvents(newState.events));
        } else {
          switch (action.type) {
            case "POINT_SCORED": {
              const { [action.side]: player } = getLeftRightPlayer(state.playerPositions);
              playNote(state.servingPlayer === player ? NoteType.WinPointServer : NoteType.WinPointReceiver);
              break;
            }
            case "HIT_PADDLE":
              playNote(NoteType.Paddle);
              break;
            case "WALL_CONTACT":
              playNote(NoteType.WallContact);
              break;
            case "SERVE":
              playNote(NoteType.Paddle);
              break;
            default:
              break;
          }
        }
      }
      return newState;
    };
  };
};

const notes = Object.keys(noteFrequencies);
const eventSounds: Partial<Record<AnnouncementEventType, (event: AnnouncementEvent, hasWonGame: boolean) => Melody>> = {
  ACE: (event, hasWonGame) => {
    if (hasWonGame) return [];
    if (event.type === "ACE") {
      const { speed } = event;
      const index = Math.min(Math.max(Math.floor(Number(speed)), 0), notes.length - 1);
      return [{ note: notes[index], duration: 0.5, rest: 0.3 }];
    }
    return [];
  },
  LONG_RALLY: (_, hasWonGame) => (hasWonGame ? [] : longRally),
  SWITCH_ENDS: () => switchEnds,
  WIN_STREAK: (_, hasWonGame) => (hasWonGame ? [] : winStreak),
  WIN_GAME: (event) => (event.type === "WIN_GAME" ? (event.winType == "game" ? winGame : event.winType == "set" ? winSet : winMatch) : []),
};

function buildSoundsFromEvents(events: MatchState["events"]) {
  const hasWonGame = events.filter((event) => event.type === "WIN_GAME").length > 0;
  const melody = events.reduce((sounds, event) => {
    return [...sounds, ...(eventSounds?.[event.type]?.(event, hasWonGame) ?? []), { note: "silence", duration: 0, rest: 0.3 }];
  }, [] as Melody);
  return melody;
}

export default soundMiddleware;

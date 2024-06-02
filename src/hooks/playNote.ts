import { useRef, useEffect, useCallback } from "react";

const noteFrequencies: { [key: string]: number } = {
  A3: 220.0,
  "A#3": 233.08,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4": 277.18,
  Db4: 277.18,
  D4: 293.66,
  "D#4": 311.13,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  Gb4: 369.99,
  G4: 392.0,
  "G#4": 415.3,
  Ab4: 415.3,
  A4: 440.0,
  "A#4": 466.16,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5": 554.37,
  Db5: 554.37,
  D5: 587.33,
  "D#5": 622.25,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  "F#5": 739.99,
  Gb5: 739.99,
  G5: 783.99,
  "G#5": 830.61,
  Ab5: 830.61,
};

const themeA = ["F5", "D5", "Bb4", "C5", "Db5", "Bb4", "Gb4", "Ab4", "A4", "F#4", "D4", "E4", "F4"];
const themeB = ["Eb4", "D4", "C4", "D4", "Eb4", "F4", "G4", "A4", "Bb4", "C5", "Db5", "Eb5"];
const themeC = ["F5", "D5", "Bb4", "C5", "Db5", "Bb4", "Gb4", "Ab4", "A4", "F#4", "A4", "A4", "A4"];
const theme = themeA.concat(themeA).concat(themeB).concat(themeC);

export enum NoteType {
  Paddle = "PADDLE",
  WinPoint = "WIN_POINT",
  LoosePoint = "LOOSE_POINT",
  WallContact = "WALL_CONTACT",
}

const useSynthesizer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const themeNoteCounterRef = useRef(0);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || ("webkitAudioContext" in window && window.webkitAudioContext))();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const _playNote = useCallback(async (frequency: number, duration = 0.05) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      console.error("AudioContext is not initialized.");
      return;
    }

    // Resume AudioContext if it's suspended
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    console.log(`Playing frequency: ${frequency} Hz`);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }, []);

  const playNextThemeNote = useCallback(() => {
    const note = theme[themeNoteCounterRef.current % theme.length];
    const frequency = noteFrequencies[note];
    themeNoteCounterRef.current++;
    _playNote(frequency, 0.05);
  }, [_playNote]);

  const playMelody = useCallback(
    async (noteDurations: { note: string; duration: number }[]) => {
      for (const { note, duration } of noteDurations) {
        _playNote(noteFrequencies[note], duration);
        await new Promise((res) => setTimeout(res, duration * 1000));
      }
    },
    [_playNote]
  );

  const playWallNoise = useCallback(() => {
    themeNoteCounterRef.current++;
    _playNote(100, 0.01);
  }, [_playNote]);

  const playNote = useCallback(
    (type: NoteType) => {
      switch (type) {
        case NoteType.Paddle:
          return playNextThemeNote();
        case NoteType.WallContact:
          return playWallNoise();
        case NoteType.WinPoint:
          return playMelody([
            { note: "C4", duration: 0.05 },
            { note: "E4", duration: 0.05 },
            { note: "G4", duration: 0.05 },
            { note: "C5", duration: 0.2 },
          ]);
        case NoteType.LoosePoint:
          return _playNote(50, 0.4);
        default:
          return;
      }
    },
    [playNextThemeNote, _playNote, playMelody, playWallNoise]
  );

  return playNote;
};

export default useSynthesizer;

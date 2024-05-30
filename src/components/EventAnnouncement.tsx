import { useState, useEffect } from "react";
import "./EventAnnouncement.css";
import { AceEvent, AnnouncementEvent, AnnouncementEventType, DeuceCountEvent, LongRallyEvent, WinGameEvent, WinStreakEvent } from "../types";

// LongRallyEvent Component
const LongRallyEventComponent: React.FC<LongRallyEvent> = ({ length }) => (
  <div className="announcement long-rally">
    <h2>Long Rally!</h2>
    <p>Rally Length: {length} shots</p>
  </div>
);

// AceEvent Component
const AceEventComponent: React.FC<AceEvent> = ({ speed }) => (
  <div className="announcement ace">
    <h2>Ace!</h2>
    <p>Serve Speed: {speed}</p>
  </div>
);

// WinStreakEvent Component
const WinStreakEventComponent: React.FC<WinStreakEvent> = ({ streak }) => (
  <div className="announcement win-streak">
    <h2>Winning Streak!</h2>
    <p>{streak} points in a row</p>
  </div>
);

// WinStreakEvent Component
const DeuceCountEventComponent: React.FC<DeuceCountEvent> = ({ count }) => (
  <div className="announcement deuce-count">
    <h2>
      {count}
      {["st", "nd", "rd"][count - 1] ?? "th"} Deuce
    </h2>
  </div>
);

// SwitchEndsEvent Component
const SwitchEndsEventComponent = () => (
  <div className="announcement switch-ends">
    <h2>Switch Ends!</h2>
    <p>Players switch sides of the court</p>
  </div>
);

const winTypeText = {
  game: "Game",
  set: "Game and Set",
  match: "Game, Set and Match",
};

// WinGameEvent Component
const WinGameEventComponent: React.FC<WinGameEvent> = ({ winType, player }) => (
  <div className="announcement win-game">
    <h2>{winTypeText[winType]}</h2>
    <p>to {player}</p>
  </div>
);

const getEvent = (event: AnnouncementEvent) => {
  switch (event.type) {
    case AnnouncementEventType.LongRally:
      return <LongRallyEventComponent {...event} />;
    case AnnouncementEventType.Ace:
      return <AceEventComponent {...event} />;
    case AnnouncementEventType.WinStreak:
      return <WinStreakEventComponent {...event} />;
    case AnnouncementEventType.SwitchEnds:
      return <SwitchEndsEventComponent />;
    case AnnouncementEventType.WinGame:
      return <WinGameEventComponent {...event} />;
    case AnnouncementEventType.DeuceCount:
      return <DeuceCountEventComponent {...event} />;
    default:
      return null;
  }
};

const EventAnnouncement = ({ event, duration = 10000 }: { event: AnnouncementEvent; duration?: number }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [event, duration]);

  return <div className={`announcement-container ${visible ? "fade-in" : "fade-out"} ${event.type}-container`}>{getEvent(event)}</div>;
};

export default EventAnnouncement;

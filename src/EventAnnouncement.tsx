import { useState, useEffect } from "react";
import "./EventAnnouncement.css";
import { AnnouncementEvent } from "./types";

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

  return <div className={`announcement ${visible ? "fade-in" : "fade-out"} ${event.type}`}>{JSON.stringify(event)}</div>;
};

export default EventAnnouncement;

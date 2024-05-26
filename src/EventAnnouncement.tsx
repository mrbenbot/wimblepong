import { useState, useEffect } from "react";
import "./EventAnnouncement.css";

const EventAnnouncement = ({ message, duration = 2000 }: { message: string; duration?: number }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  return <div className={`announcement ${visible ? "fade-in" : "fade-out"}`}>{message}</div>;
};

export default EventAnnouncement;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";

const Navigation: React.FC = () => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    return location.pathname === path ? "highlighted" : "";
  };

  return (
    <nav style={{ textAlign: "center" }}>
      <Link to="/" className={getLinkClass("/")}>
        Home
      </Link>
      {" | "}
      <Link to="/backstory" className={getLinkClass("/backstory")}>
        Backstory
      </Link>
      {" | "}
      <Link to="/instructions" className={getLinkClass("/instructions")}>
        Instructions
      </Link>
      {" | "}
      <Link to="/upload" className={getLinkClass("/upload")}>
        ML Models
      </Link>
      {" | "}
      <Link to="/play" className={getLinkClass("/play")}>
        Play
      </Link>
    </nav>
  );
};

export default Navigation;

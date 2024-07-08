import { createBrowserRouter, Navigate } from "react-router-dom";
import MenuComponent from "./components/Menu";
import LandingPage from "./components/LandingPage";
import MouseControlApp from "./components/inputs/MouseControlApp";
import GamepadApp from "./components/inputs/GamepadApp";
import GameOver from "./components/GameOver";
import ModelUploader from "./components/ModelUploader";
import ComputerApp from "./components/inputs/ComputerApp";
import BackStory from "./components/BackStory";
import Instructions from "./components/Instructions";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/backstory",
    element: <BackStory />,
  },
  {
    path: "/instructions",
    element: <Instructions />,
  },
  {
    path: "/play",
    element: <MenuComponent />,
  },
  { path: "/mouse", element: <MouseControlApp />, errorElement: <Navigate to="/play" replace={true} /> },
  { path: "/gamepad", element: <GamepadApp />, errorElement: <Navigate to="/play" replace={true} /> },
  { path: "/computer", element: <ComputerApp />, errorElement: <Navigate to="/play" replace={true} /> },
  { path: "/gameover", element: <GameOver /> },
  { path: "/upload", element: <ModelUploader /> },
]);

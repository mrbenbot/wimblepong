import { createBrowserRouter } from "react-router-dom";
import MenuComponent from "./components/Menu";
import LandingPage from "./components/LandingPage";
import MouseControlApp from "./components/inputs/MouseControlApp";
import GamepadApp from "./components/inputs/GamepadApp";
import GameOver from "./components/GameOver";
import ModelUploader from "./components/ModelUploader";
import ModelSelector from "./components/ModelSelector";
import ComputerApp from "./components/inputs/ComputerApp";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/menu",
    element: <MenuComponent />,
  },
  { path: "/mouse", element: <MouseControlApp /> },
  { path: "/gamepad", element: <GamepadApp /> },
  { path: "/computer", element: <ComputerApp /> },
  { path: "/gameover", element: <GameOver /> },
  { path: "/upload", element: <ModelUploader /> },
  { path: "/select", element: <ModelSelector /> },
]);

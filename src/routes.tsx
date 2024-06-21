import { createBrowserRouter } from "react-router-dom";
import MenuComponent from "./components/Menu";
import LandingPage from "./components/LandingPage";
import MouseControlApp from "./components/inputs/MouseControlApp";
import DJHeroApp from "./components/inputs/DJHeroApp";
import GamepadApp from "./components/inputs/GamepadApp";
import GameOver from "./components/GameOver";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/menu",
    element: <MenuComponent />,
  },
  { path: "/mouse/:opponentType", element: <MouseControlApp /> },
  { path: "/dj/:opponentType", element: <DJHeroApp /> },
  { path: "/gamepad/:opponentType", element: <GamepadApp /> },
  { path: "/gameover", element: <GameOver /> },
]);

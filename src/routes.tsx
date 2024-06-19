import { createBrowserRouter } from "react-router-dom";
import MenuComponent from "./components/Menu";
import LandingPage from "./components/LandingPage";
import MouseControlApp from "./components/MouseControlApp";
import DJHeroApp from "./components/DJHeroApp";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/menu",
    element: <MenuComponent />,
  },
  { path: "/", element: <MenuComponent /> },
  { path: "/mouse/:opponentType", element: <MouseControlApp /> },
  { path: "/dj/:opponentType", element: <DJHeroApp /> },
  //   { path: "/gamepad", element: <GamepadApp /> },
]);

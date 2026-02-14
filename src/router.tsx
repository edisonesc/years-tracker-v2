import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Setup from "./pages/Setup";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={"/home"} replace />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/setup",
    element: <Setup />,
  },
]);

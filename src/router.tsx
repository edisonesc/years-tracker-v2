import { createBrowserRouter, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Setup from "./pages/Setup";

const basename = import.meta.env.VITE_BASE_PATH || "/";

export const router = createBrowserRouter(
  [
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
  ],
  {
    basename: basename,
  },
);

import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import LobbyPage from "./pages/lobbypage";
import GamePage from "./pages/gamepage";
import CreateMatchPage from "./pages/creatematchpage";
import { LoginPage } from "./components/UI/Login";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase/firebaseConfig";
import Spinner from "./components/UI/Spinner";

// Loader for the root route ("/")
export async function lobbyAuthLoader() {
  const auth = getAuth(app);
  // Wrap onAuthStateChanged in a Promise for loader
  const user = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribe();
      resolve(firebaseUser);
    });
  });
  if (!user) {
    throw redirect("/login");
  }
  return null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LobbyPage />,
    loader: lobbyAuthLoader,
    loadingElement: <Spinner />,
  },
  {
    path: "/game/:matchId",
    element: <GamePage />,
  },
  {
    path: "/create",
    element: <CreateMatchPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  }
]);

export default router;

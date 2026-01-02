import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import LobbyPage from "./pages/lobbypage";
import GamePage from "./pages/gamepage";
import CreateMatchPage from "./pages/creatematchpage";
import { LoginPage } from "./pages/loginpage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase/firebaseConfig";
import Spinner from "./components/UI/Spinner";
import HomePage from "./pages/homepage";
import RegistrationPage from "./pages/registrationpage";

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
  if (user) {
    throw redirect("/lobby");
  }
  return null;
}

const router = createBrowserRouter([
  //Questa è la lobby semplificata
  {
    path: "/",
    element: <HomePage />,
    loader: lobbyAuthLoader,
    loadingElement: <Spinner />,
  },

  {
    path: "/lobby",
    element: <LobbyPage />,
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
  },
  {
    path: "/register",
    element: <RegistrationPage />,
  }
]);

export default router;

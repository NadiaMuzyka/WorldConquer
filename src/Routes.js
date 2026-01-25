import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import LobbyPage from "./pages/lobbypage";
import GamePage from "./pages/gamepage";
import WaitingPage from "./pages/waitingpage";
import CreateMatchPage from "./pages/creatematchpage";
import { LoginPage } from "./pages/loginpage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase/firebaseConfig";
import Spinner from "./components/UI/Spinner";
import HomePage from "./pages/homepage";
import RegistrationPage from "./pages/registrationpage";
import CompleteProfilePage from "./pages/completeprofilepage";
import ErrorPage from "./pages/errorpage";
import ProfilePage from "./pages/profilepage";
import StatsPage from "./pages/statspage";


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
    errorElement: <ErrorPage />,
  },
  {
    path: "/stats",
    element: <StatsPage />,
    errorElement: <ErrorPage />,
  },

  {
    path: "/lobby",
    element: <LobbyPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/game/:matchId",
    element: <GamePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/waiting/:matchId",
    element: <WaitingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/create",
    element: <CreateMatchPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: <RegistrationPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/complete-profile",
    element: <CompleteProfilePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <ErrorPage />,
  }
]);

export default router;

import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import LobbyPage from "./pages/lobbypage";
import GamePage from "./pages/gamepage";
import CreateMatchPage from "./pages/creatematchpage";
import { LoginPage } from "./components/UI/Login";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase/firebaseConfig";
import Spinner from "./components/UI/Spinner";
import {LoggatoPage} from "./components/UI/Loggato";

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
  //Questa è la lobby semplificata
  {
    path: "/",
    element: <LobbyPage />, //TODO: Da cambiare in home page utente non autenticato!
  },
  //Questa per ora deve essere inaccessibile (sarebbe la pagina alla quale si arriva dopo il login)
  //Ma per questioni di test ora vengo temporaneamente reindirizzato a loggato
  {
    path: "/lobby",
    element: <LoggatoPage />,  //TODO: Cambiare in <LobbyPage /> quando si vuole testare la lobby
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

import { createBrowserRouter } from "react-router-dom";
import LobbyPage from "./pages/lobbypage";
import GamePage from "./pages/gamepage";
import CreateMatchPage from "./pages/creatematchpage";
import { LoginPage } from "./components/UI/Login";

// Puoi aggiungere qui altre pagine se necessario
// Esempio: import GamePage from "./GamePage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <LobbyPage />, //TODO: Da cambiare in home page utente non autenticato!
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
  }
]);

export default router;

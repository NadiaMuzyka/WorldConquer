import { createBrowserRouter } from "react-router-dom";
import LobbyPage from "./pages/lobbypage";
import GamePage from "./pages/gamepage";
import CreateMatchPage from "./pages/creatematchpage";

// Puoi aggiungere qui altre pagine se necessario
// Esempio: import GamePage from "./GamePage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <LobbyPage />,
  },
  {
    path: "/game/:matchId",
    element: <GamePage />,
  },
  {
    path: "/create",
    element: <CreateMatchPage />,
  }
]);

export default router;

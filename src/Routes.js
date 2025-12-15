import { createBrowserRouter } from "react-router-dom";
import { LobbyPage, GamePage } from "./App";

// Puoi aggiungere qui altre pagine se necessario
// Esempio: import GamePage from "./GamePage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <LobbyPage />,
  },
  {
    path: "/game/:matchID",
    element: <GamePage />,
  },
]);

export default router;

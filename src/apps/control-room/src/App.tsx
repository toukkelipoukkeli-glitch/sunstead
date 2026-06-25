import { ControlRoom } from "./pages/ControlRoom"
import { SalesHomePage } from "./pages/SalesHomePage"
import { SetupPage } from "./pages/SetupPage"

export const App = () => {
  const path = window.location.pathname

  if (path === "/control") return <ControlRoom />
  if (path === "/home") return <SalesHomePage />

  return <SetupPage />
}

import { ControlRoom } from "./pages/ControlRoom"
import { SalesHomePage } from "./pages/SalesHomePage"

export const App = () => {
  const path = window.location.pathname

  if (path === "/control") return <ControlRoom />

  return <SalesHomePage />
}

import { useParams } from "react-router"
import App from "./App.tsx"

// Reads :swimmerId from the address and hands it to the capture page.
function SwimmerRoute() {
  // Always set, since the route needs it; the default is for TypeScript.
  const { swimmerId = "" } = useParams()
  // key: a different swimmer gets a fresh App, not the last one's reps.
  return <App key={swimmerId} swimmerId={swimmerId} />
}

export default SwimmerRoute

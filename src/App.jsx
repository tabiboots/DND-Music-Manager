
import AuthScreen from "./components/ui/AuthScreen.jsx";
import {useSpotifyAuth} from "./components/spotify/useSpotifyAuth.js";


export default function App() {

  const { tokens, error, handleReset } = useSpotifyAuth()
  return(
        <AuthScreen />
  )
}

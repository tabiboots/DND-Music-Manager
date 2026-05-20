
import AuthScreen from "./components/ui/AuthScreen.jsx";
import MainLayout from "./components/ui/MainLayout.jsx";
import {useSpotifyAuth} from "./components/spotify/useSpotifyAuth.js";
import { redirectToAuthCodeFlow } from "./components/spotify/auth.js";


export default function App() {
  const { tokens, error, handleReset } = useSpotifyAuth()

  if (tokens) {
    return <MainLayout />
  }

  return (
      <AuthScreen onLogin={redirectToAuthCodeFlow} />
  )
}

import { useEffect } from "react";
import AuthScreen from "./components/ui/AuthScreen.jsx";
import MainLayout from "./components/ui/MainLayout.jsx";
import {useSpotifyAuth} from "./components/spotify/useSpotifyAuth.js";
import { redirectToAuthCodeFlow } from "./components/spotify/auth.js";
import { useStore } from "./state/store.js";


async function handleLogin() {
  try {
    await redirectToAuthCodeFlow()
  } catch (e) {
    console.error('Login failed:', e)
  }
}

export default function App() {
  const { tokens, error, handleReset } = useSpotifyAuth()
  const loadUserData = useStore(s => s.loadUserData)
  const userDataLoading = useStore(s => s.userDataLoading)

  useEffect(() => {
    if (tokens) loadUserData(tokens.access_token)
  }, [tokens])

  if (tokens && userDataLoading) {
    return <div className="h-screen bg-dusk-900 flex items-center justify-center text-dusk-dim text-sm">Loading...</div>
  }

  if (tokens) {
    return <MainLayout />
  }

  return (
      <AuthScreen onLogin={handleLogin} />
  )
}
import { useEffect, useState } from 'react'
import {
  redirectToAuthCodeFlow,
  exchangeCodeForToken,
  STATE_KEY,
  VERIFIER_KEY,
} from './spotify/auth.js'
import {
  saveTokens,
  loadTokens,
  clearTokens,
  isAccessTokenValid,
} from './spotify/tokens.js'

export default function App() {
  const [tokens, setTokens] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const returnedState = params.get('state')
    const spotifyError = params.get('error')

    if (code || spotifyError) {
      window.history.replaceState({}, '', '/')

      if (spotifyError) {
        setError(`Spotify returned: ${spotifyError}`)
        return
      }

      const storedState = sessionStorage.getItem(STATE_KEY)
      if (returnedState !== storedState) {
        setError('State mismatch — aborting (possible CSRF)')
        return
      }

      exchangeCodeForToken(code)
        .then((t) => {
          const stored = saveTokens(t)
          setTokens(stored)
          sessionStorage.removeItem(VERIFIER_KEY)
          sessionStorage.removeItem(STATE_KEY)
        })
        .catch((e) => setError(e.message))
      return
    }

    const existing = loadTokens()
    if (existing && isAccessTokenValid(existing)) {
      setTokens(existing)
    } else if (existing) {
      clearTokens()
    }
  }, [])

  const handleReset = () => {
    clearTokens()
    sessionStorage.removeItem(VERIFIER_KEY)
    sessionStorage.removeItem(STATE_KEY)
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-900 text-zinc-100">
      {!tokens && !error && (
        <button
          onClick={redirectToAuthCodeFlow}
          className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold"
        >
          Login with Spotify
        </button>
      )}
      {tokens && (
        <div className="max-w-xl text-sm">
          <p className="text-green-400 mb-2">Logged in!</p>
          <pre className="bg-zinc-800 p-3 rounded overflow-auto">
            {JSON.stringify(tokens, null, 2)}
          </pre>
        </div>
      )}
      {error && <p className="text-red-400">{error}</p>}

      <button
        onClick={handleReset}
        className="fixed bottom-4 right-4 px-3 py-1 text-xs rounded bg-red-600/80 hover:bg-red-500 text-white"
      >
        Reset auth (dev)
      </button>
    </div>
  )
}

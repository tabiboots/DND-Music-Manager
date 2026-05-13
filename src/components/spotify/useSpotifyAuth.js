import { useState, useEffect } from 'react'
import {
    exchangeCodeForToken,
    STATE_KEY,
    VERIFIER_KEY,
} from './auth.js'
import {
    saveTokens,
    loadTokens,
    clearTokens,
    isAccessTokenValid,
} from './tokens.js'

export function useSpotifyAuth() {
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

    return { tokens, error, handleReset }
}

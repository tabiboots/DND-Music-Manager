import { CLIENT_ID, REDIRECT_URI, AUTH_ENDPOINT, TOKEN_ENDPOINT, SCOPES } from './config.js'
import { generateVerifier, generateChallenge } from './pkce.js'

export const VERIFIER_KEY = 'spotify_pkce_verifier'
export const STATE_KEY = 'spotify_oauth_state'

export async function redirectToAuthCodeFlow() {
  const verifier = generateVerifier()
  const challenge = await generateChallenge(verifier)
  const state = generateVerifier(32)

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) throw new Error('Missing PKCE verifier — start login again')

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  })

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed (${res.status}): ${err.error || ''} ${err.error_description || ''}`.trim())
  }

  return res.json()
}

let refreshInflight = null

export function refreshAccessToken(refreshToken) {
  if (refreshInflight) return refreshInflight

  refreshInflight = (async () => {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      })
      const res = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Refresh failed (${res.status}): ${err.error || ''} ${err.error_description || ''}`.trim())
      }
      const data = await res.json()
      if (!data.refresh_token) data.refresh_token = refreshToken
      return data
    } finally {
      refreshInflight = null
    }
  })()

  return refreshInflight
}

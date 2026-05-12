const TOKEN_KEY = 'spotify_tokens'

export function saveTokens(tokenResponse) {
  const stored = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    scope: tokenResponse.scope,
    token_type: tokenResponse.token_type,
    expires_at: Date.now() + tokenResponse.expires_in * 1000,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
  return stored
}

export function loadTokens() {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAccessTokenValid(tokens, leewayMs = 30_000) {
  if (!tokens?.access_token) return false
  return tokens.expires_at - leewayMs > Date.now()
}

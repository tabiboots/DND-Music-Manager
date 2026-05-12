import { refreshAccessToken } from './auth.js'
import {
  loadTokens,
  saveTokens,
  clearTokens,
  isAccessTokenValid,
} from './tokens.js'

export async function getValidTokens() {
  const existing = loadTokens()
  if (!existing) return null
  if (isAccessTokenValid(existing)) return existing
  if (!existing.refresh_token) {
    clearTokens()
    return null
  }

  try {
    const refreshed = await refreshAccessToken(existing.refresh_token)
    return saveTokens(refreshed)
  } catch {
    clearTokens()
    return null
  }
}

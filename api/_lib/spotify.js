import { createHash } from 'crypto'
import { supabase } from './supabase.js'

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getSpotifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return { userId: null, status: 401 }

  const token = authHeader.slice(7)
  const tokenHash = hashToken(token)

  const { data: cached, error: cacheReadError } = await supabase
    .from('user_sessions')
    .select('spotify_user_id')
    .eq('access_token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (cacheReadError) console.error('[getSpotifyUser] cache read failed:', cacheReadError.message)
  if (cached) return { userId: cached.spotify_user_id, status: 200 }

  console.log('[getSpotifyUser] cache miss — calling /v1/me')
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: authHeader },
  })

  if (!res.ok) {
    const retryAfter = res.status === 429
      ? parseInt(res.headers.get('Retry-After') ?? '5', 10)
      : null
    if (retryAfter != null) {
      console.error(`[getSpotifyUser] /v1/me rate limited — Retry-After: ${retryAfter}s`)
    } else {
      console.error('[getSpotifyUser] /v1/me returned', res.status)
    }
    return { userId: null, status: res.status, retryAfter }
  }
  const data = await res.json()
  const userId = data.id ?? null

  const expiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString()
  const { error: cacheWriteError } = await supabase
    .from('user_sessions')
    .upsert({ access_token_hash: tokenHash, spotify_user_id: userId, expires_at: expiresAt })

  if (cacheWriteError) console.error('[getSpotifyUser] cache write failed:', cacheWriteError.message)

  return { userId, status: 200 }
}

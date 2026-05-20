import { createHash } from 'crypto'
import { supabase } from './supabase.js'

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getSpotifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return { userId: null, status: 401 }

  const token = authHeader.slice(7)
  const tokenHash = hashToken(token)

  const { data: cached } = await supabase
    .from('user_sessions')
    .select('spotify_user_id')
    .eq('access_token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (cached) return { userId: cached.spotify_user_id, status: 200 }

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: authHeader },
  })

  if (!res.ok) return { userId: null, status: res.status }
  const data = await res.json()
  const userId = data.id ?? null

  const expiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString()
  await supabase
    .from('user_sessions')
    .upsert({ access_token_hash: tokenHash, spotify_user_id: userId, expires_at: expiresAt })

  return { userId, status: 200 }
}

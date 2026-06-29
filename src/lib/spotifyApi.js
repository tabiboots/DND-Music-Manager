// ── HTTP ──────────────────────────────────────────────────────────────────

async function spotifyFetch(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) {
    const errorBody = await res.text()
    console.error(`Spotify API Error ${res.status}:`, errorBody)
    throw new Error(`Spotify error ${res.status}: ${url}`)
  }
  return res.json()
}

// ── Normalizers ───────────────────────────────────────────────────────────

function formatDuration(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function hueFromId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

export function normalizeTrack(item) {
  const t = item.track ?? item
  if (!t?.id) return null
  return {
    id:       t.id,
    uri:      t.uri,
    title:    t.name,
    artist:   t.artists?.[0]?.name ?? 'Unknown',
    dur:      formatDuration(t.duration_ms ?? 0),
    hue:      hueFromId(t.id),
    albumArt: t.album?.images?.[0]?.url ?? null,
  }
}

// ── Fetchers ──────────────────────────────────────────────────────────────

export async function fetchUserProfile(accessToken) {
  return spotifyFetch('https://api.spotify.com/v1/me', accessToken)
}

export async function fetchLikedSongs(accessToken, offset = 0) {
  const data = await spotifyFetch(
    `https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`,
    accessToken
  )
  return {
    items: data.items.filter(item => item.track?.id),
    next:  data.next,
    total: data.total,
  }
}

export async function searchTracks(accessToken, query, limit = 10) {
  if (!query.trim()) return { items: [] }
  const params = new URLSearchParams({
    q: query.trim(),
    type: 'track',
    limit: Math.min(limit, 10).toString(), // Spotify max is 10
  })
  const data = await spotifyFetch(
    `https://api.spotify.com/v1/search?${params}`,
    accessToken
  )
  return {
    items: data.tracks?.items?.filter(t => t?.id) ?? [],
  }
}

export async function fetchRecentlyPlayed(accessToken, limit = 20) {
  const data = await spotifyFetch(
    `https://api.spotify.com/v1/me/player/recently-played?limit=${Math.min(limit, 50)}`,
    accessToken
  )
  // Response items are PlayHistoryObjects with a track property
  // Deduplicate by track ID (keep first occurrence only)
  const seen = new Set()
  const items = (data.items || [])
    .map(item => item.track)
    .filter(track => {
      if (!track || !track.id || seen.has(track.id)) return false
      seen.add(track.id)
      return true
    })

  return { items }
}

export async function getRecommendations(accessToken, seedTracks, limit = 20) {
  if (!seedTracks || seedTracks.length === 0) return { items: [] }
  const seeds = seedTracks.slice(0, 5).join(',')
  const data = await spotifyFetch(
    `https://api.spotify.com/v1/recommendations?seed_tracks=${seeds}&limit=${limit}`,
    accessToken
  )
  return {
    items: data.tracks?.filter(t => t?.id) ?? [],
  }
}

export async function fetchTracksByIds(accessToken, trackIds) {
  if (!trackIds || trackIds.length === 0) return { items: [] }
  // Spotify allows max 50 IDs per request
  const chunks = []
  for (let i = 0; i < trackIds.length; i += 50) {
    chunks.push(trackIds.slice(i, i + 50))
  }

  const results = []
  for (const chunk of chunks) {
    const ids = chunk.join(',')
    try {
      const data = await spotifyFetch(
        `https://api.spotify.com/v1/tracks?ids=${ids}`,
        accessToken
      )
      results.push(...(data.tracks?.filter(t => t?.id) ?? []))
    } catch (e) {
      if (chunk.length === 1) {
        console.warn(`Skipping track ${chunk[0]}: ${e.message}`)
        continue
      }
      // Batch failed — retry each track individually to isolate bad IDs
      for (const id of chunk) {
        try {
          const data = await spotifyFetch(
            `https://api.spotify.com/v1/tracks?ids=${id}`,
            accessToken
          )
          results.push(...(data.tracks?.filter(t => t?.id) ?? []))
        } catch {
          console.warn(`Skipping track ${id}: not fetchable (may be an episode or restricted)`)
        }
      }
    }
  }

  return { items: results }
}

// ── HTTP ──────────────────────────────────────────────────────────────────

async function spotifyFetch(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) throw new Error(`Spotify error ${res.status}: ${url}`)
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

export function normalizePlaylist(p) {
  return {
    id:      p.id,
    label:   p.name,
    trackIds: [],
    loaded:  false,
    total:   p.tracks?.total ?? 0,
    pinned:  false,
  }
}

// ── Fetchers ──────────────────────────────────────────────────────────────

export async function fetchUserProfile(accessToken) {
  return spotifyFetch('https://api.spotify.com/v1/me', accessToken)
}

export async function fetchPlaylists(accessToken, userId) {
  const results = []
  let url = 'https://api.spotify.com/v1/me/playlists?limit=50'
  while (url) {
    const data = await spotifyFetch(url, accessToken)
    results.push(...data.items.filter(p => p && p.owner?.id === userId))
    url = data.next
  }
  return results
}

export async function fetchPlaylistTracks(accessToken, playlistId) {
  const results = []
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`
  while (url) {
    const data = await spotifyFetch(url, accessToken)
    results.push(...data.items.filter(item => item.track?.id))
    url = data.next
  }
  return results
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

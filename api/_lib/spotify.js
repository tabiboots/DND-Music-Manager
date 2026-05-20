export async function getSpotifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: authHeader },
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.id ?? null
}

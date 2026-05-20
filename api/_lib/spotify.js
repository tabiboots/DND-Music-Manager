export async function getSpotifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return { userId: null, status: 401 }

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: authHeader },
  })

  if (!res.ok) return { userId: null, status: res.status }
  const data = await res.json()
  return { userId: data.id ?? null, status: 200 }
}

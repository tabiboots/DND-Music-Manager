export async function getSpotifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return { userId: null, status: 401 }

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: authHeader },
  })

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '2', 10)
    await new Promise(r => setTimeout(r, Math.min(retryAfter, 5) * 1000))
    const retry = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: authHeader },
    })
    if (retry.status === 401) return { userId: null, status: 401 }
    if (!retry.ok) return { userId: null, status: retry.status }
    const data = await retry.json()
    return { userId: data.id ?? null, status: 200 }
  }

  if (res.status === 401) return { userId: null, status: 401 }
  if (!res.ok) return { userId: null, status: res.status }
  const data = await res.json()
  return { userId: data.id ?? null, status: 200 }
}

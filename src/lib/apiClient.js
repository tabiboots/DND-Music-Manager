async function apiFetch(path, accessToken, options = {}, retried = false) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })
  if (res.status === 429 && !retried) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10)
    console.warn(`[apiClient] 429 on ${path} — retrying in ${retryAfter}s`)
    await new Promise(r => setTimeout(r, retryAfter * 1000))
    return apiFetch(path, accessToken, options, true)
  }
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  if (res.status === 204) return null
  return res.json()
}

export async function fetchUserData(accessToken) {
  return apiFetch('/api/user-data', accessToken)
}

export async function saveTrackTags(accessToken, trackId, tagIds) {
  return apiFetch('/api/track-tags', accessToken, {
    method: 'POST',
    body: JSON.stringify({ track_id: trackId, tag_ids: tagIds }),
  })
}

export async function saveTag(accessToken, tag) {
  return apiFetch('/api/tags', accessToken, {
    method: 'POST',
    body: JSON.stringify(tag),
  })
}

export async function deleteTag(accessToken, tagId) {
  return apiFetch(`/api/tags?id=${tagId}`, accessToken, { method: 'DELETE' })
}

export async function savePreset(accessToken, preset) {
  return apiFetch('/api/presets', accessToken, {
    method: 'POST',
    body: JSON.stringify(preset),
  })
}

export async function deletePreset(accessToken, presetId) {
  return apiFetch(`/api/presets?id=${presetId}`, accessToken, { method: 'DELETE' })
}

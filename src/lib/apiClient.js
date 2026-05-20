async function apiFetch(path, accessToken, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  if (res.status === 204) return null
  return res.json()
}

export async function fetchUserData(accessToken) {
  const [tags, trackTags, presets] = await Promise.all([
    apiFetch('/api/tags', accessToken),
    apiFetch('/api/track-tags', accessToken),
    apiFetch('/api/presets', accessToken),
  ])
  return { tags, trackTags, presets }
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

import { getSpotifyUser } from './_lib/spotify.js'
import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { userId, status, retryAfter } = await getSpotifyUser(req.headers.authorization)
  if (!userId) {
    if (retryAfter != null) res.setHeader('Retry-After', retryAfter)
    return res.status(status).json({ error: status === 429 ? 'Rate limited' : 'Unauthorized' })
  }

  const [tagsResult, trackTagsResult, presetsResult] = await Promise.all([
    supabase.from('tags').select('id, label, hue, family').eq('spotify_user_id', userId),
    supabase.from('track_tags').select('track_id, tag_ids').eq('spotify_user_id', userId),
    supabase
      .from('presets')
      .select('*')
      .eq('spotify_user_id', userId)
      .order('last_used_at', { ascending: false, nullsFirst: false }),
  ])

  if (tagsResult.error) return res.status(500).json({ error: tagsResult.error.message })
  if (trackTagsResult.error) return res.status(500).json({ error: trackTagsResult.error.message })
  if (presetsResult.error) return res.status(500).json({ error: presetsResult.error.message })

  return res.status(200).json({
    userId,
    tags: tagsResult.data,
    trackTags: trackTagsResult.data,
    presets: presetsResult.data,
  })
}

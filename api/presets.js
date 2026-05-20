import { getSpotifyUser } from './_lib/spotify.js'
import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  const { userId, status } = await getSpotifyUser(req.headers.authorization)
  if (!userId) return res.status(status).json({ error: status === 429 ? 'Rate limited' : 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('spotify_user_id', userId)
      .order('last_used_at', { ascending: false, nullsFirst: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { id, label, tag_ids, match_mode } = req.body
    const { data, error } = await supabase
      .from('presets')
      .upsert({ spotify_user_id: userId, id, label, tag_ids, match_mode })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('spotify_user_id', userId)
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  res.status(405).end()
}

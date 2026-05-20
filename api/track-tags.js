import { getSpotifyUser } from './_lib/spotify.js'
import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  const userId = await getSpotifyUser(req.headers.authorization)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('track_tags')
      .select('track_id, tag_ids')
      .eq('spotify_user_id', userId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { track_id, tag_ids } = req.body
    const { data, error } = await supabase
      .from('track_tags')
      .upsert({
        spotify_user_id: userId,
        track_id,
        tag_ids,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).end()
}

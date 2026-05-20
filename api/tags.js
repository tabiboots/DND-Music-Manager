import { getSpotifyUser } from './_lib/spotify.js'
import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  const userId = await getSpotifyUser(req.headers.authorization)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('spotify_user_id', userId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { id, label, hue, family } = req.body
    const { data, error } = await supabase
      .from('tags')
      .upsert({ spotify_user_id: userId, id, label, hue, family })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('spotify_user_id', userId)
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  res.status(405).end()
}

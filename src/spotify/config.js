export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID

export const REDIRECT_URI = `${window.location.origin}/callback`

export const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
export const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
export const API_BASE = 'https://api.spotify.com/v1'

export const SCOPES = [
  'user-read-email',
  'user-read-private',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-modify-playback-state',
  'user-read-playback-state',
]

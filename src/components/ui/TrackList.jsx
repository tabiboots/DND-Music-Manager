import { useStore, visibleTracks } from '../../state/store.js'
import { useShallow } from 'zustand/react/shallow'
import TagChip from './TagChip.jsx'

export default function TrackList() {
  const tracks = useStore(useShallow(visibleTracks))
  const playlist = useStore(s => s.playlists.find(p => p.id === s.activePlaylistId))
  const activePlaylistId = useStore(s => s.activePlaylistId)
  const allTags = useStore(s => s.tags)
  const tagMap = useStore(s => s.tagMap)
  const selectedTrackId = useStore(s => s.selectedTrackId)
  const setSelectedTrack = useStore(s => s.setSelectedTrack)
  const playlistLoading = useStore(s => s.playlistLoading)
  const loadMoreLikedSongs = useStore(s => s.loadMoreLikedSongs)
  const loadRecommendations = useStore(s => s.loadRecommendations)
  const likedNextUrl = useStore(s => s.playlists.find(p => p.id === 'liked')?.nextUrl ?? null)

  if (playlistLoading) return (
    <div className="flex items-center justify-center h-48">
      <span className="h-5 w-5 rounded-full border-2 border-dusk-dim border-t-dusk-fg animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-lg font-semibold">{playlist?.label}</h2>
        {playlist?.total && (
          <span className="text-xs text-dusk-dim">{tracks.length} / {playlist.total}</span>
        )}
      </div>
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors group
            ${track.id === selectedTrackId ? 'bg-dusk-700' : 'hover:bg-dusk-800'}`}
        >
          <span className="text-dusk-dim text-xs w-4 shrink-0 text-right">{i + 1}</span>
          <div
            className="h-8 w-8 rounded shrink-0"
            style={{ background: `hsl(${track.hue}, 50%, 25%)` }}
          />
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTrack(track.id)}>
            <p className="text-sm font-medium truncate text-dusk-fg">{track.title}</p>
            <p className="text-xs text-dusk-mute truncate">{track.artist}</p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end max-w-40">
            {(tagMap[track.id] ?? []).map(id => {
              const tag = allTags.find(t => t.id === id)
              return tag ? <TagChip key={id} tag={tag} size="xs" showCount={false} /> : null
            })}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              loadRecommendations(track.id)
            }}
            className="opacity-0 group-hover:opacity-100 text-xs text-dusk-mute hover:text-dusk-fg transition-all shrink-0 px-2 py-1 rounded border border-line hover:border-line-hi"
            title="Find similar tracks"
          >
            Similar
          </button>
          <span className="text-xs text-dusk-dim shrink-0">{track.dur}</span>
        </div>
      ))}
      {activePlaylistId === 'liked' && likedNextUrl && (
        <button
          onClick={loadMoreLikedSongs}
          disabled={playlistLoading}
          className="mt-2 w-full py-2 text-sm text-dusk-mute hover:text-dusk-fg border border-line hover:border-line-hi rounded-lg transition-colors disabled:opacity-50"
        >
          {playlistLoading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}

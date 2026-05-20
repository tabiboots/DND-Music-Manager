import { useStore, visibleTracks } from '../../state/store.js'
import { useShallow } from 'zustand/react/shallow'
import TagChip from './TagChip.jsx'

export default function TrackList() {
  const tracks = useStore(useShallow(visibleTracks))
  const playlist = useStore(s => s.playlists.find(p => p.id === s.activePlaylistId))
  const allTags = useStore(s => s.tags)

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold mb-4">{playlist?.label}</h2>
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-dusk-800 transition-colors group"
        >
          <span className="text-dusk-dim text-xs w-4 shrink-0 text-right">{i + 1}</span>
          <div
            className="h-8 w-8 rounded shrink-0"
            style={{ background: `hsl(${track.hue}, 50%, 25%)` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-dusk-fg">{track.title}</p>
            <p className="text-xs text-dusk-mute truncate">{track.artist}</p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end max-w-40">
            {track.tagIds.map(id => {
              const tag = allTags.find(t => t.id === id)
              return tag ? <TagChip key={id} tag={tag} size="xs" showCount={false} /> : null
            })}
          </div>
          <span className="text-xs text-dusk-dim shrink-0">{track.dur}</span>
        </div>
      ))}
    </div>
  )
}

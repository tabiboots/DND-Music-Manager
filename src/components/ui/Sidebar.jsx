import { useStore } from '../../state/store.js'

export default function Sidebar() {
    const playlists = useStore(s => s.playlists)
    const activeId = useStore(s => s.activePlaylistId)
    const setActivePlaylist = useStore(s => s.setActivePlaylist)

    return (
        <aside className="w-56 shrink-0 flex flex-col gap-1 p-4 border-r border-line">
            <p className="text-xs font-semibold uppercase tracking-widest text-dusk-dim mb-2">Playlists</p>
            {playlists.map(p => (
                <button
                    key={p.id}
                    onClick={() => setActivePlaylist(p.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors
              ${p.id === activeId
                        ? 'bg-dusk-700 text-dusk-fg'
                        : 'text-dusk-mute hover:text-dusk-fg hover:bg-dusk-800'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </aside>
    )
}

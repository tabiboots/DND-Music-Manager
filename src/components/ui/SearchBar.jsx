import { useState, useEffect } from 'react'
import { useStore } from '../../state/store.js'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const searchForTracks = useStore(s => s.searchForTracks)
  const setActivePlaylist = useStore(s => s.setActivePlaylist)

  useEffect(() => {
    const timer = setTimeout(() => {
      searchForTracks(query)
      if (query.trim()) {
        setActivePlaylist('search')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, searchForTracks, setActivePlaylist])

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tracks, artists, albums..."
        className="w-full px-4 py-2.5 bg-dusk-800 border border-line focus:border-line-hi rounded-lg text-sm text-dusk-fg placeholder-dusk-mute outline-none transition-colors"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dusk-mute hover:text-dusk-fg transition-colors"
          aria-label="Clear search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      )}
    </div>
  )
}

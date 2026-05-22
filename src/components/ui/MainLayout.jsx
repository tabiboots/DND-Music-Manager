import { useStore } from '../../state/store.js'
import Sidebar from './Sidebar.jsx'
import TrackList from './TrackList.jsx'
import TagEditor from './TagEditor.jsx'
import Deck from './Deck.jsx'
import SearchBar from './SearchBar.jsx'

export default function MainLayout() {
  const selectedTrackId = useStore(s => s.selectedTrackId)

  return (
    <div className="h-screen flex flex-col bg-dusk-900 text-dusk-fg">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <SearchBar />
          <TrackList />
        </main>
        <aside className="w-72 shrink-0 border-l border-line">
          {selectedTrackId ? <TagEditor /> : <Deck />}
        </aside>
      </div>
      <footer className="h-16 border-t border-line flex items-center px-6">
        <p className="text-dusk-dim text-sm">Playback bar coming soon</p>
      </footer>
    </div>
  )
}

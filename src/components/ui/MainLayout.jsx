import Sidebar from './Sidebar.jsx'
import TrackList from './TrackList.jsx'

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-dusk-900 text-dusk-fg">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <TrackList />
        </main>
        <aside className="w-72 shrink-0 border-l border-line p-4">
          <p className="text-dusk-dim text-sm">Deck coming soon</p>
        </aside>
      </div>
      <footer className="h-16 border-t border-line flex items-center px-6">
        <p className="text-dusk-dim text-sm">Playback bar coming soon</p>
      </footer>
    </div>
  )
}

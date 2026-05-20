import { useState } from 'react'
import { useStore, matchCount, tagCountMap } from '../../state/store.js'
import { useShallow } from 'zustand/react/shallow'
import TagChip from './TagChip.jsx'

const FAMILIES = ['encounter', 'mood', 'scene']

// ── Build tab ──────────────────────────────────────────────────────────────

function BuildTab() {
  const tags          = useStore(s => s.tags)
  const selectedTagIds = useStore(s => s.deck.selectedTagIds)
  const matchMode     = useStore(s => s.deck.matchMode)
  const shuffle       = useStore(s => s.deck.shuffle)
  const count         = useStore(matchCount)
  const counts        = useStore(useShallow(tagCountMap))
  const toggleTag     = useStore(s => s.toggleTag)
  const setMatchMode  = useStore(s => s.setMatchMode)
  const toggleShuffle = useStore(s => s.toggleShuffle)
  const clearDeck     = useStore(s => s.clearDeck)
  const deployDeck    = useStore(s => s.deployDeck)

  const grouped = FAMILIES.map(family => ({
    family,
    tags: tags.filter(t => t.family === family),
  })).filter(g => g.tags.length > 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Match mode */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0">
        <span className="text-xs text-dusk-dim">Match</span>
        <div className="flex rounded-lg border border-line overflow-hidden text-xs">
          {['any', 'all'].map(mode => (
            <button
              key={mode}
              onClick={() => setMatchMode(mode)}
              className={`px-3 py-1 capitalize transition-colors
                ${matchMode === mode
                  ? 'bg-dusk-700 text-dusk-fg'
                  : 'text-dusk-mute hover:text-dusk-fg'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {selectedTagIds.length > 0 && (
          <button onClick={clearDeck} className="ml-auto text-xs text-dusk-dim hover:text-dusk-fg transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Tag groups */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-5 pt-2">
        {tags.length === 0 && (
          <p className="text-dusk-dim text-sm text-center pt-8">
            Click a track to create tags
          </p>
        )}
        {grouped.map(({ family, tags: familyTags }) => (
          <div key={family}>
            <p className="text-[10px] uppercase tracking-widest text-dusk-dim mb-2">{family}</p>
            <div className="flex flex-wrap gap-2">
              {familyTags.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={{ ...tag, count: counts[tag.id] ?? 0 }}
                  state={selectedTagIds.includes(tag.id) ? 'selected' : 'idle'}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-line p-4 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-dusk-dim">
            {count > 0 ? `${count} track${count === 1 ? '' : 's'} matched` : 'No tracks matched'}
          </span>
          <button
            onClick={toggleShuffle}
            className={`text-xs transition-colors ${shuffle ? 'text-amber' : 'text-dusk-dim hover:text-dusk-fg'}`}
          >
            ⇌ Shuffle
          </button>
        </div>
        <button
          onClick={deployDeck}
          disabled={count === 0}
          className="w-full py-2 rounded-lg bg-amber text-dusk-900 text-sm font-semibold
            disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Deploy
        </button>
      </div>

    </div>
  )
}

// ── Presets tab ────────────────────────────────────────────────────────────

function PresetsTab() {
  const [savingLabel, setSavingLabel] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const presets            = useStore(s => s.presets)
  const selectedTagIds     = useStore(s => s.deck.selectedTagIds)
  const loadPreset         = useStore(s => s.loadPreset)
  const saveCurrentAsPreset = useStore(s => s.saveCurrentAsPreset)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!savingLabel.trim()) return
    await saveCurrentAsPreset(savingLabel.trim())
    setSavingLabel('')
    setShowSaveForm(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Preset list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {presets.length === 0 && (
          <p className="text-dusk-dim text-sm text-center pt-8">No presets saved yet</p>
        )}
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => loadPreset(preset)}
            className="text-left w-full px-3 py-2.5 rounded-lg border border-line hover:border-line-hi hover:bg-dusk-800 transition-colors"
          >
            <p className="text-sm text-dusk-fg font-medium">{preset.label}</p>
            <p className="text-xs text-dusk-dim mt-0.5">
              {preset.tagIds.join(', ')} · {preset.matchMode}
            </p>
          </button>
        ))}
      </div>

      {/* Save current deck as preset */}
      <div className="border-t border-line p-4 shrink-0">
        {showSaveForm ? (
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Preset name…"
              value={savingLabel}
              onChange={e => setSavingLabel(e.target.value)}
              className="flex-1 bg-dusk-800 border border-line rounded-lg px-3 py-1.5 text-sm text-dusk-fg placeholder:text-dusk-dim outline-none focus:border-line-hi transition-colors"
            />
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-amber text-dusk-900 font-semibold hover:opacity-90 transition-opacity">
              Save
            </button>
            <button type="button" onClick={() => setShowSaveForm(false)} className="text-xs px-2 text-dusk-dim hover:text-dusk-fg transition-colors">
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            disabled={selectedTagIds.length === 0}
            className="w-full text-xs py-1.5 rounded-lg border border-dashed border-line-hi text-dusk-dim
              hover:text-dusk-fg hover:border-line-hi transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save deck as preset
          </button>
        )}
      </div>

    </div>
  )
}

// ── Deck ───────────────────────────────────────────────────────────────────

export default function Deck() {
  const activeTab  = useStore(s => s.deck.activeTab)
  const setDeckTab = useStore(s => s.setDeckTab)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Tabs */}
      <div className="flex border-b border-line shrink-0">
        {['build', 'presets'].map(tab => (
          <button
            key={tab}
            onClick={() => setDeckTab(tab)}
            className={`flex-1 py-3 text-xs font-medium capitalize transition-colors
              ${activeTab === tab
                ? 'text-dusk-fg border-b-2 border-amber -mb-px'
                : 'text-dusk-mute hover:text-dusk-fg'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'build' ? <BuildTab /> : <PresetsTab />}

    </div>
  )
}

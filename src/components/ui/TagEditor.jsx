import { useState } from 'react'
import { useStore } from '../../state/store.js'
import TagChip from './TagChip.jsx'

const FAMILIES = ['encounter', 'mood', 'scene']

const BLANK_FORM = { label: '', hue: 30, family: 'mood' }

function NewTagForm({ onClose }) {
  const [form, setForm] = useState(BLANK_FORM)
  const createTag = useStore(s => s.createTag)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.label.trim()) return
    await createTag(form)
    onClose()
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-4 flex flex-col gap-3 shrink-0 bg-dusk-900">

      {/* Label */}
      <input
        autoFocus
        type="text"
        placeholder="Tag name…"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        className="w-full bg-dusk-800 border border-line rounded-lg px-3 py-1.5 text-sm text-dusk-fg placeholder:text-dusk-dim outline-none focus:border-line-hi transition-colors"
      />

      {/* Hue */}
      <div className="flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ background: `hsl(${form.hue}, 65%, 55%)` }}
        />
        <input
          type="range" min="0" max="359" value={form.hue}
          onChange={e => setForm(f => ({ ...f, hue: Number(e.target.value) }))}
          className="flex-1 accent-amber h-1"
        />
      </div>

      {/* Family */}
      <div className="flex gap-1.5">
        {FAMILIES.map(f => (
          <button
            key={f} type="button"
            onClick={() => setForm(form => ({ ...form, family: f }))}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors capitalize
              ${form.family === f
                ? 'border-amber text-amber bg-amber/10'
                : 'border-line text-dusk-mute hover:text-dusk-fg hover:border-line-hi'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button type="button" onClick={onClose}
          className="flex-1 text-xs py-1.5 rounded-lg border border-line text-dusk-mute hover:text-dusk-fg transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 text-xs py-1.5 rounded-lg bg-amber text-dusk-900 font-semibold hover:opacity-90 transition-opacity">
          Create
        </button>
      </div>

    </form>
  )
}

export default function TagEditor() {
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const selectedTrackId = useStore(s => s.selectedTrackId)
  const tracks          = useStore(s => s.tracks)
  const tags            = useStore(s => s.tags)
  const tagMap          = useStore(s => s.tagMap)
  const setSelectedTrack = useStore(s => s.setSelectedTrack)
  const setTagForTrack  = useStore(s => s.setTagForTrack)

  const track = tracks.find(t => t.id === selectedTrackId)
  const assignedIds = tagMap[selectedTrackId] ?? []

  const query = filter.trim().toLowerCase()
  const visible = query
    ? tags.filter(t => t.label.toLowerCase().includes(query))
    : tags

  const grouped = FAMILIES.map(family => ({
    family,
    tags: visible.filter(t => t.family === family),
  })).filter(g => g.tags.length > 0)

  const toggle = (tagId) => {
    const next = assignedIds.includes(tagId)
      ? assignedIds.filter(id => id !== tagId)
      : [...assignedIds, tagId]
    setTagForTrack(selectedTrackId, next)
  }

  if (!track) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-dusk-dim text-sm">Select a track to edit its tags</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-line shrink-0">
        <div
          className="h-8 w-8 rounded shrink-0"
          style={{ background: `hsl(${track.hue}, 50%, 25%)` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dusk-fg truncate">{track.title}</p>
          <p className="text-xs text-dusk-mute truncate">{track.artist}</p>
        </div>
        <button
          onClick={() => setSelectedTrack(null)}
          className="text-dusk-dim hover:text-dusk-fg transition-colors shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Filter */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <input
          type="text"
          placeholder="Filter tags…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-dusk-800 border border-line rounded-lg px-3 py-1.5 text-sm text-dusk-fg placeholder:text-dusk-dim outline-none focus:border-line-hi transition-colors"
        />
      </div>

      {/* Tag groups */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-5 pt-2">
        {grouped.length === 0 && (
          <p className="text-dusk-dim text-sm text-center pt-4">No tags found</p>
        )}
        {grouped.map(({ family, tags: familyTags }) => (
          <div key={family}>
            <p className="text-[10px] uppercase tracking-widest text-dusk-dim mb-2">{family}</p>
            <div className="flex flex-wrap gap-2">
              {familyTags.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  state={assignedIds.includes(tag.id) ? 'selected' : 'idle'}
                  onClick={() => toggle(tag.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New tag */}
      {showForm
        ? <NewTagForm onClose={() => setShowForm(false)} />
        : (
          <div className="border-t border-line p-4 shrink-0">
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-xs py-1.5 rounded-lg border border-dashed border-line-hi text-dusk-dim hover:text-dusk-fg hover:border-line-hi transition-colors"
            >
              + New tag
            </button>
          </div>
        )
      }

    </div>
  )
}

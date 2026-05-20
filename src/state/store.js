import { create } from 'zustand'
import { TAGS, TRACKS, PLAYLISTS, PRESETS } from '../data/mocks.js'

export const useStore = create((set, get) => ({

    // ── Entities ──────────────────────────────────────────────────
    tags:      TAGS,
    tracks:    TRACKS,
    playlists: PLAYLISTS,
    presets:   PRESETS,

    // ── UI: active playlist ───────────────────────────────────────
    activePlaylistId: 'liked',

    // ── UI: deck ─────────────────────────────────────────────────
    deck: {
        selectedTagIds: [],
        matchMode: 'any',      // 'any' | 'all'
        shuffle: false,
        activeTab: 'build',    // 'build' | 'presets'
    },

    // ── UI: playback ──────────────────────────────────────────────
    playback: {
        currentTrackId: null,
        isPlaying: false,
        queue: [],
        queueSource: null,
    },

    // ── Actions ───────────────────────────────────────────────────

    toggleTag: (tagId) => set((s) => {
        const sel = s.deck.selectedTagIds
        return {
            deck: {
                ...s.deck,
                selectedTagIds: sel.includes(tagId)
                    ? sel.filter(id => id !== tagId)
                    : [...sel, tagId],
            }
        }
    }),

    setDeckTab: (tab) => set((s) => ({
        deck: { ...s.deck, activeTab: tab }
    })),

    setMatchMode: (mode) => set((s) => ({
        deck: { ...s.deck, matchMode: mode }
    })),

    toggleShuffle: () => set((s) => ({
        deck: { ...s.deck, shuffle: !s.deck.shuffle }
    })),

    setActivePlaylist: (id) => set({ activePlaylistId: id }),

    clearDeck: () => set((s) => ({
        deck: { ...s.deck, selectedTagIds: [] }
    })),

    deployDeck: () => set((s) => {
        const matched = matchedTrackIds(s)
        if (!matched.length) return {}
        const ordered = s.deck.shuffle ? shuffle(matched) : matched
        return {
            playback: {
                currentTrackId: ordered[0],
                isPlaying: true,
                queue: ordered,
                queueSource: { kind: 'deck', tagIds: [...s.deck.selectedTagIds], matchMode: s.deck.matchMode },
            }
        }
    }),

}))

// ── Selectors (pure functions, call with the full state) ──────────────────

export function visibleTracks(s) {
    const playlist = s.playlists.find(p => p.id === s.activePlaylistId)
    if (!playlist) return []
    return playlist.trackIds.map(id => s.tracks.find(t => t.id === id)).filter(Boolean)
}

export function matchedTrackIds(s) {
    const { selectedTagIds: sel, matchMode } = s.deck
    if (!sel.length) return []
    return s.tracks
        .filter(t => matchMode === 'all'
            ? sel.every(id => t.tagIds.includes(id))
            : sel.some(id => t.tagIds.includes(id))
        )
        .map(t => t.id)
}

export function matchCount(s) {
    return matchedTrackIds(s).length
}

// ── Helpers ───────────────────────────────────────────────────────────────

function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
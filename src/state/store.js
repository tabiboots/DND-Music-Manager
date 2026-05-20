import { create } from 'zustand'
import { TRACKS, PLAYLISTS } from '../data/mocks.js'
import { fetchUserData, saveTrackTags, saveTag, savePreset } from '../lib/apiClient.js'

export const useStore = create((set, get) => ({

    // ── Entities ──────────────────────────────────────────────────
    tags:      [],       // loaded from API
    tracks:    TRACKS,   // TODO: replace with real Spotify tracks
    playlists: PLAYLISTS, // TODO: replace with real Spotify playlists
    presets:   [],       // loaded from API
    tagMap:    {},       // loaded from API — { [trackId]: string[] }

    // ── Session ───────────────────────────────────────────────────
    accessToken: null,
    userDataLoading: true,

    // ── UI: active playlist ───────────────────────────────────────
    activePlaylistId: 'liked',

    // ── UI: selected track (tag editor) ──────────────────────────
    selectedTrackId: null,

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

    setAccessToken: (token) => set({ accessToken: token }),

    setSelectedTrack: (id) => set(s => ({
        selectedTrackId: s.selectedTrackId === id ? null : id,
    })),

    createTag: async ({ label, hue, family }) => {
        const id = label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        if (!id) return
        const tag = { id, label: label.trim(), hue, family }
        set(s => ({ tags: [...s.tags, tag] }))
        try {
            await saveTag(get().accessToken, tag)
        } catch (e) {
            set(s => ({ tags: s.tags.filter(t => t.id !== id) }))
            console.error('Failed to create tag:', e)
        }
    },

    setTagForTrack: async (trackId, tagIds) => {
        set(s => ({ tagMap: { ...s.tagMap, [trackId]: tagIds } }))
        try {
            await saveTrackTags(get().accessToken, trackId, tagIds)
        } catch (e) {
            console.error('Failed to save tags:', e)
        }
    },

    loadUserData: async (accessToken) => {
        set({ userDataLoading: true })
        try {
            const { tags, trackTags, presets } = await fetchUserData(accessToken)
            const tagMap = Object.fromEntries(
                trackTags.map(({ track_id, tag_ids }) => [track_id, tag_ids])
            )
            const normalizedPresets = presets.map(p => ({
                id:         p.id,
                label:      p.label,
                tagIds:     p.tag_ids,
                matchMode:  p.match_mode,
                lastUsedAt: p.last_used_at,
            }))
            set({ tags, tagMap, presets: normalizedPresets })
        } catch (e) {
            console.error('Failed to load user data:', e)
        } finally {
            set({ userDataLoading: false })
        }
    },

    loadPreset: (preset) => set(s => ({
        deck: { ...s.deck, selectedTagIds: [...preset.tagIds], matchMode: preset.matchMode },
    })),

    saveCurrentAsPreset: async (label) => {
        const { deck, accessToken } = get()
        const id = crypto.randomUUID()
        const normalized = { id, label, tagIds: deck.selectedTagIds, matchMode: deck.matchMode, lastUsedAt: null }
        set(s => ({ presets: [...s.presets, normalized] }))
        try {
            await savePreset(accessToken, { id, label, tag_ids: deck.selectedTagIds, match_mode: deck.matchMode })
        } catch (e) {
            set(s => ({ presets: s.presets.filter(p => p.id !== id) }))
            console.error('Failed to save preset:', e)
        }
    },

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
        .filter(t => {
            const tags = s.tagMap[t.id] ?? []
            return matchMode === 'all'
                ? sel.every(id => tags.includes(id))
                : sel.some(id => tags.includes(id))
        })
        .map(t => t.id)
}

export function matchCount(s) {
    return matchedTrackIds(s).length
}

export function tagCountMap(s) {
    const counts = {}
    Object.values(s.tagMap).forEach(tagIds => {
        tagIds.forEach(id => { counts[id] = (counts[id] ?? 0) + 1 })
    })
    return counts
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
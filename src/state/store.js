import { create } from 'zustand'
import { fetchUserData, saveTrackTags, saveTag, savePreset, deletePreset } from '../lib/apiClient.js'
import { fetchPlaylists, fetchPlaylistTracks, fetchLikedSongs, normalizeTrack, normalizePlaylist } from '../lib/spotifyApi.js'

const LIKED_PLAYLIST = { id: 'liked', label: 'Liked Songs', trackIds: [], loaded: false, total: null, pinned: true, nextUrl: null }

export const useStore = create((set, get) => ({

    // ── Entities ──────────────────────────────────────────────────
    tags:      [],   // loaded from API
    tracks:    {},   // { [spotifyId]: track } — loaded lazily per playlist
    playlists: [],   // loaded from Spotify on login
    presets:   [],   // loaded from API
    tagMap:    {},   // loaded from API — { [trackId]: string[] }

    // ── Session ───────────────────────────────────────────────────
    accessToken:        null,
    userDataLoading:    true,
    playlistLoading:    false,

    // ── UI: active playlist ───────────────────────────────────────
    activePlaylistId: 'liked',

    // ── UI: selected track (tag editor) ──────────────────────────
    selectedTrackId: null,

    // ── UI: deck ─────────────────────────────────────────────────
    deck: {
        selectedTagIds: [],
        matchMode: 'any',
        shuffle: false,
        activeTab: 'build',
    },

    // ── UI: playback ──────────────────────────────────────────────
    playback: {
        currentTrackId: null,
        isPlaying: false,
        queue: [],
        queueSource: null,
    },

    // ── Actions ───────────────────────────────────────────────────

    setAccessToken: (token) => set({ accessToken: token }),

    setSelectedTrack: (id) => set(s => ({
        selectedTrackId: s.selectedTrackId === id ? null : id,
    })),

    setActivePlaylist: (id) => {
        set({ activePlaylistId: id })
        const playlist = get().playlists.find(p => p.id === id)
        if (playlist && !playlist.loaded) {
            get().loadPlaylistTracks(id)
        }
    },

    loadUserData: async (accessToken) => {
        set({ userDataLoading: true })
        try {
            const { userId, tags, trackTags, presets } = await fetchUserData(accessToken)
            const rawPlaylists = await fetchPlaylists(accessToken, userId)

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
            const playlists = [LIKED_PLAYLIST, ...rawPlaylists.map(normalizePlaylist)]

            set({ tags, tagMap, presets: normalizedPresets, playlists })

            // Load the default playlist immediately
            await get().loadPlaylistTracks('liked')
        } catch (e) {
            console.error('Failed to load user data:', e)
        } finally {
            set({ userDataLoading: false })
        }
    },

    loadPlaylistTracks: async (playlistId) => {
        const { playlists, accessToken } = get()
        const playlist = playlists.find(p => p.id === playlistId)
        if (!playlist || playlist.loaded) return

        set({ playlistLoading: true })
        try {
            let rawItems, nextUrl = null, total = null
            if (playlistId === 'liked') {
                const result = await fetchLikedSongs(accessToken)
                rawItems = result.items
                nextUrl  = result.next
                total    = result.total
            } else {
                rawItems = await fetchPlaylistTracks(accessToken, playlistId)
            }

            const normalized = rawItems.map(normalizeTrack).filter(Boolean)
            const newTracks  = Object.fromEntries(normalized.map(t => [t.id, t]))
            const trackIds   = normalized.map(t => t.id)

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === playlistId
                        ? { ...p, trackIds, loaded: true, ...(playlistId === 'liked' ? { nextUrl, total } : {}) }
                        : p
                ),
            }))
        } catch (e) {
            console.error(`Failed to load tracks for ${playlistId}:`, e)
        } finally {
            set({ playlistLoading: false })
        }
    },

    loadMoreLikedSongs: async () => {
        const { playlists, accessToken } = get()
        const liked = playlists.find(p => p.id === 'liked')
        if (!liked?.nextUrl) return

        set({ playlistLoading: true })
        try {
            const nextUrlObj = new URL(liked.nextUrl)
            const offset = parseInt(nextUrlObj.searchParams.get('offset') ?? '0', 10)
            const result  = await fetchLikedSongs(accessToken, offset)

            const normalized  = result.items.map(normalizeTrack).filter(Boolean)
            const newTracks   = Object.fromEntries(normalized.map(t => [t.id, t]))
            const newTrackIds = normalized.map(t => t.id)

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === 'liked'
                        ? { ...p, trackIds: [...p.trackIds, ...newTrackIds], nextUrl: result.next }
                        : p
                ),
            }))
        } catch (e) {
            console.error('Failed to load more liked songs:', e)
        } finally {
            set({ playlistLoading: false })
        }
    },

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

    removePreset: async (id) => {
        const removed = get().presets.find(p => p.id === id)
        set(s => ({ presets: s.presets.filter(p => p.id !== id) }))
        try {
            await deletePreset(get().accessToken, id)
        } catch (e) {
            set(s => ({ presets: [...s.presets, removed] }))
            console.error('Failed to delete preset:', e)
        }
    },

}))

// ── Selectors ─────────────────────────────────────────────────────────────

export function visibleTracks(s) {
    const playlist = s.playlists.find(p => p.id === s.activePlaylistId)
    if (!playlist) return []
    return playlist.trackIds.map(id => s.tracks[id]).filter(Boolean)
}

export function matchedTrackIds(s) {
    const { selectedTagIds: sel, matchMode } = s.deck
    if (!sel.length) return []
    return Object.keys(s.tagMap).filter(trackId => {
        const tags = s.tagMap[trackId] ?? []
        return matchMode === 'all'
            ? sel.every(id => tags.includes(id))
            : sel.some(id => tags.includes(id))
    })
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

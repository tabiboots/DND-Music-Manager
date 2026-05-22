import { create } from 'zustand'
import { getValidTokens } from '../components/spotify/client.js'

let loadUserDataInflight = null
import { fetchUserData, saveTrackTags, saveTag, deleteTag, savePreset, deletePreset } from '../lib/apiClient.js'
import { fetchLikedSongs, fetchRecentlyPlayed, searchTracks, getRecommendations, fetchTracksByIds, normalizeTrack } from '../lib/spotifyApi.js'

const RECENT_PLAYLIST = { id: 'recent', label: 'Recently Played', trackIds: [], loaded: false, total: null, pinned: true }
const TAGGED_PLAYLIST = { id: 'tagged', label: 'Tagged Songs', trackIds: [], loaded: false, total: null, pinned: true }
const LIKED_PLAYLIST = { id: 'liked', label: 'Liked Songs', trackIds: [], loaded: false, total: null, pinned: true, nextUrl: null }
const SEARCH_PLAYLIST = { id: 'search', label: 'Search Results', trackIds: [], loaded: true, total: null, pinned: false }
const RECOMMENDATIONS_PLAYLIST = { id: 'recommendations', label: 'Similar Tracks', trackIds: [], loaded: true, total: null, pinned: false }

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

    // ── UI: search & browse ───────────────────────────────────────
    searchQuery: '',

    // ── UI: active playlist ───────────────────────────────────────
    activePlaylistId: 'tagged',

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

    getAccessToken: async () => {
      const tokens = await getValidTokens()
      if (!tokens) return null
      if (tokens.access_token !== get().accessToken) {
        set({ accessToken: tokens.access_token })
      }
      return tokens.access_token
    },

    setSelectedTrack: (id) => set(s => ({
        selectedTrackId: s.selectedTrackId === id ? null : id,
    })),

    setActivePlaylist: (id) => {
        set({ activePlaylistId: id })
        const playlist = get().playlists.find(p => p.id === id)
        if (playlist && !playlist.loaded) {
            if (id === 'liked') {
                get().loadPlaylistTracks(id)
            } else if (id === 'recent') {
                get().loadRecentlyPlayed()
            } else if (id === 'tagged') {
                get().loadTaggedSongs()
            }
        }
    },

    loadUserData: async () => {
        if (loadUserDataInflight) return loadUserDataInflight
        set({ userDataLoading: true })
        loadUserDataInflight = (async () => { try {
            const accessToken = await get().getAccessToken()
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
            const playlists = [TAGGED_PLAYLIST, RECENT_PLAYLIST, LIKED_PLAYLIST, SEARCH_PLAYLIST, RECOMMENDATIONS_PLAYLIST]

            set({ tags, tagMap, presets: normalizedPresets, playlists })

            // Load the default playlist (tagged songs) immediately
            await get().loadTaggedSongs()
        } catch (e) {
            console.error('Failed to load user data:', e)
        } finally {
            set({ userDataLoading: false })
            loadUserDataInflight = null
        }})()
        return loadUserDataInflight
    },

    loadPlaylistTracks: async (playlistId) => {
        if (playlistId !== 'liked') return
        const playlist = get().playlists.find(p => p.id === playlistId)
        if (!playlist || playlist.loaded) return

        set({ playlistLoading: true })
        try {
            const accessToken = await get().getAccessToken()
            const result = await fetchLikedSongs(accessToken)

            const normalized = result.items.map(normalizeTrack).filter(Boolean)
            const newTracks  = Object.fromEntries(normalized.map(t => [t.id, t]))
            const trackIds   = normalized.map(t => t.id)

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === 'liked'
                        ? { ...p, trackIds, loaded: true, nextUrl: result.next, total: result.total }
                        : p
                ),
            }))
        } catch (e) {
            console.error('Failed to load liked songs:', e)
        } finally {
            set({ playlistLoading: false })
        }
    },

    loadMoreLikedSongs: async () => {
        const liked = get().playlists.find(p => p.id === 'liked')
        if (!liked?.nextUrl) return

        set({ playlistLoading: true })
        try {
            const accessToken = await get().getAccessToken()
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
            const accessToken = await get().getAccessToken()
            await saveTag(accessToken, tag)
        } catch (e) {
            set(s => ({ tags: s.tags.filter(t => t.id !== id) }))
            console.error('Failed to create tag:', e)
        }
    },

    removeTag: async (tagId) => {
        const removed = get().tags.find(t => t.id === tagId)
        set(s => ({
            tags: s.tags.filter(t => t.id !== tagId),
            tagMap: Object.fromEntries(
                Object.entries(s.tagMap).map(([trackId, tagIds]) => [
                    trackId,
                    tagIds.filter(id => id !== tagId)
                ])
            )
        }))
        try {
            const accessToken = await get().getAccessToken()
            await deleteTag(accessToken, tagId)
        } catch (e) {
            set(s => ({ tags: [...s.tags, removed] }))
            console.error('Failed to delete tag:', e)
        }
    },

    setTagForTrack: async (trackId, tagIds) => {
        const oldTagIds = get().tagMap[trackId] ?? []
        set(s => ({ tagMap: { ...s.tagMap, [trackId]: tagIds } }))

        // Update tagged playlist if it's loaded
        const taggedPlaylist = get().playlists.find(p => p.id === 'tagged')
        if (taggedPlaylist?.loaded) {
            set(s => ({
                playlists: s.playlists.map(p => {
                    if (p.id !== 'tagged') return p

                    const shouldBeInList = tagIds.length > 0
                    const isInList = p.trackIds.includes(trackId)

                    if (shouldBeInList && !isInList) {
                        return { ...p, trackIds: [...p.trackIds, trackId] }
                    } else if (!shouldBeInList && isInList) {
                        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) }
                    }
                    return p
                })
            }))
        }

        try {
            const accessToken = await get().getAccessToken()
            await saveTrackTags(accessToken, trackId, tagIds)
        } catch (e) {
            set(s => ({ tagMap: { ...s.tagMap, [trackId]: oldTagIds } }))
            console.error('Failed to save tags:', e)
        }
    },

    loadPreset: (preset) => set(s => ({
        deck: { ...s.deck, selectedTagIds: [...preset.tagIds], matchMode: preset.matchMode },
    })),

    saveCurrentAsPreset: async (label) => {
        const { deck } = get()
        const id = crypto.randomUUID()
        const normalized = { id, label, tagIds: deck.selectedTagIds, matchMode: deck.matchMode, lastUsedAt: null }
        set(s => ({ presets: [...s.presets, normalized] }))
        try {
            const accessToken = await get().getAccessToken()
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
            const accessToken = await get().getAccessToken()
            await deletePreset(accessToken, id)
        } catch (e) {
            set(s => ({ presets: [...s.presets, removed] }))
            console.error('Failed to delete preset:', e)
        }
    },

    searchForTracks: async (query) => {
        set({ searchQuery: query })
        if (!query.trim()) {
            set(s => ({
                playlists: s.playlists.map(p =>
                    p.id === 'search' ? { ...p, trackIds: [] } : p
                ),
            }))
            return
        }

        set({ playlistLoading: true })
        try {
            const accessToken = await get().getAccessToken()
            const result = await searchTracks(accessToken, query)
            const normalized = result.items.map(normalizeTrack).filter(Boolean)
            const newTracks = Object.fromEntries(normalized.map(t => [t.id, t]))
            const trackIds = normalized.map(t => t.id)

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === 'search' ? { ...p, trackIds, loaded: true } : p
                ),
            }))
        } catch (e) {
            console.error('Failed to search tracks:', e)
        } finally {
            set({ playlistLoading: false })
        }
    },

    loadRecentlyPlayed: async () => {
        const recent = get().playlists.find(p => p.id === 'recent')
        if (!recent || recent.loaded) return

        set({ playlistLoading: true })
        try {
            const accessToken = await get().getAccessToken()
            const result = await fetchRecentlyPlayed(accessToken)
            const normalized = result.items.map(normalizeTrack).filter(Boolean)
            const newTracks = Object.fromEntries(normalized.map(t => [t.id, t]))
            const trackIds = normalized.map(t => t.id)

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === 'recent' ? { ...p, trackIds, loaded: true } : p
                ),
            }))
        } catch (e) {
            console.error('Failed to load recently played:', e)
        } finally {
            set({ playlistLoading: false })
        }
    },

    loadTaggedSongs: async () => {
        const tagged = get().playlists.find(p => p.id === 'tagged')
        if (!tagged || tagged.loaded) return

        set({ playlistLoading: true })
        try {
            const accessToken = await get().getAccessToken()
            const tagMap = get().tagMap
            const existingTracks = get().tracks

            // Get all track IDs that have tags
            const isValidSpotifyId = (id) => /^[a-zA-Z0-9]{22}$/.test(id)
            const taggedTrackIds = Object.keys(tagMap)
                .filter(trackId => tagMap[trackId]?.length > 0)
                .filter(isValidSpotifyId)

            if (taggedTrackIds.length === 0) {
                set(s => ({
                    playlists: s.playlists.map(p =>
                        p.id === 'tagged' ? { ...p, trackIds: [], loaded: true } : p
                    ),
                }))
                set({ playlistLoading: false })
                return
            }

            // Fetch tracks we don't have yet
            const tracksToFetch = taggedTrackIds.filter(id => !existingTracks[id])

            let newTracks = {}
            if (tracksToFetch.length > 0) {
                try {
                    const result = await fetchTracksByIds(accessToken, tracksToFetch)
                    const normalized = result.items.map(normalizeTrack).filter(Boolean)
                    newTracks = Object.fromEntries(normalized.map(t => [t.id, t]))
                } catch (fetchError) {
                    console.warn('Could not fetch some tracks, showing only loaded tracks:', fetchError)
                    // Continue with just the tracks we have - don't fail completely
                }
            }

            // Show all tagged tracks we have data for
            const availableTaggedIds = taggedTrackIds.filter(id =>
                existingTracks[id] || newTracks[id]
            )

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === 'tagged' ? { ...p, trackIds: availableTaggedIds, loaded: true } : p
                ),
            }))
        } catch (e) {
            console.error('Failed to load tagged songs:', e)
        } finally {
            set({ playlistLoading: false })
        }
    },

    loadRecommendations: async (seedTrackId) => {
        set({ playlistLoading: true })
        try {
            const accessToken = await get().getAccessToken()
            const result = await getRecommendations(accessToken, [seedTrackId])
            const normalized = result.items.map(normalizeTrack).filter(Boolean)
            const newTracks = Object.fromEntries(normalized.map(t => [t.id, t]))
            const trackIds = normalized.map(t => t.id)

            set(s => ({
                tracks: { ...s.tracks, ...newTracks },
                playlists: s.playlists.map(p =>
                    p.id === 'recommendations' ? { ...p, trackIds, loaded: true } : p
                ),
                activePlaylistId: 'recommendations',
            }))
        } catch (e) {
            console.error('Failed to load recommendations:', e)
        } finally {
            set({ playlistLoading: false })
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

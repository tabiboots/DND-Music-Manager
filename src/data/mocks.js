export const TAGS = [
    { id: 'combat',      label: 'combat',      count: 24, hue: 8,   family: 'encounter' },
    { id: 'boss',        label: 'boss fight',  count: 8,  hue: 0,   family: 'encounter' },
    { id: 'final',       label: 'final hour',  count: 3,  hue: 350, family: 'encounter' },
    { id: 'dread',       label: 'dread',       count: 12, hue: 280, family: 'mood' },
    { id: 'mystery',     label: 'mystery',     count: 11, hue: 260, family: 'mood' },
    { id: 'downtime',    label: 'downtime',    count: 14, hue: 180, family: 'mood' },
    { id: 'ritual',      label: 'ritual',      count: 6,  hue: 300, family: 'mood' },
    { id: 'tavern',      label: 'tavern',      count: 18, hue: 32,  family: 'scene' },
    { id: 'travel',      label: 'travel',      count: 15, hue: 145, family: 'scene' },
    { id: 'exploration', label: 'exploration', count: 19, hue: 195, family: 'scene' },
    { id: 'city',        label: 'city',        count: 9,  hue: 50,  family: 'scene' },
    { id: 'victory',     label: 'victory',     count: 7,  hue: 45,  family: 'scene' },
]

export const TRACKS = [
    { id: 't01', title: 'Heralds at the Gate',  artist: 'Cantorum',          hue: 8,   dur: '5:21' },
    { id: 't02', title: 'The Hanged Man',       artist: 'Aurora Sound',      hue: 280, dur: '4:12' },
    { id: 't03', title: 'Embergrove',           artist: 'Forlane',           hue: 32,  dur: '3:48' },
    { id: 't04', title: 'Long Road West',       artist: 'Vellichor Quartet', hue: 145, dur: '6:02' },
    { id: 't05', title: 'Dust of Old Kingdoms', artist: 'Maren K.',          hue: 50,  dur: '5:33' },
    { id: 't06', title: 'The Crown Beneath',    artist: 'Lyrebird',          hue: 300, dur: '4:48' },
    { id: 't07', title: 'Marketday',            artist: 'Saltspire',         hue: 50,  dur: '2:59' },
    { id: 't08', title: 'Stormbreak',           artist: 'Caelum',            hue: 0,   dur: '5:55' },
    { id: 't09', title: 'Hours Til Dawn',       artist: 'Quietfall',         hue: 180, dur: '4:21' },
    { id: 't10', title: 'Final Hour',           artist: 'Pyralis',           hue: 350, dur: '6:33' },
]

export const TAG_MAP = {
    't01': ['combat', 'boss'],
    't02': ['dread', 'ritual'],
    't03': ['tavern'],
    't04': ['travel'],
    't05': ['mystery', 'exploration'],
    't06': ['ritual', 'dread'],
    't07': ['tavern', 'city'],
    't08': ['combat'],
    't09': ['downtime', 'exploration'],
    't10': ['boss', 'final'],
}

export const PLAYLISTS = [
    { id: 'liked', label: 'Liked Songs',       trackIds: ['t01','t02','t03','t04','t05','t06','t07','t08','t09','t10'], pinned: true },
    { id: 'p1',    label: 'Dark Forest',       trackIds: ['t02','t04','t06','t09'] },
    { id: 'p2',    label: 'High Seas Voyage',  trackIds: ['t04','t05','t08'] },
    { id: 'p3',    label: 'Session 14 — Tomb', trackIds: ['t01','t02','t06','t10'] },
]

export const PRESETS = [
    { id: 'pr1', label: 'Boss rush',     tagIds: ['combat', 'boss', 'final'], matchMode: 'any', lastUsedAt: Date.now() - 172800000 },
    { id: 'pr2', label: 'Tavern night',  tagIds: ['tavern', 'downtime'],       matchMode: 'any', lastUsedAt: Date.now() - 518400000 },
    { id: 'pr3', label: 'Crypt descent', tagIds: ['dread', 'ritual', 'mystery'], matchMode: 'any', lastUsedAt: Date.now() - 1814400000 },
]

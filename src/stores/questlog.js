import { reactive } from 'vue'

const KEY = 'gamgineer.quests.v1'

export const QUESTS = [
  { id: 'boot', label: 'Boot the World', desc: 'Step past the title screen', icon: 'bx-power-off' },
  { id: 'console', label: 'Hack the Terminal', desc: 'Run a dev console command', icon: 'bxs-terminal' },
  { id: 'outfit', label: 'Inspect the Loadout', desc: 'Open the Outfit panel', icon: 'bxs-shield-alt-2' },
  { id: 'innerraise', label: 'Train the Spirit', desc: 'Open Inner-Raise', icon: 'bxs-brain' },
  { id: 'inventory', label: 'Loot the Inventory', desc: 'Open Inventory', icon: 'bxs-package' },
  { id: 'journal', label: 'Read the Journal', desc: 'Open Journal', icon: 'bxs-book-open' },
  { id: 'settings', label: 'Tune the System', desc: 'Open Settings', icon: 'bxs-cog' },
  { id: 'theme', label: 'Recolor the World', desc: 'Change the theme', icon: 'bxs-palette' },
  { id: 'music', label: 'Drop the Beat', desc: 'Toggle the music', icon: 'bxs-music' },
  { id: 'konami', label: 'Crack the Code', desc: 'Enter the legendary Konami code', icon: 'bx-bolt' },
  { id: 'playgame', label: 'Play with the Companion', desc: 'Catch pixels in the mini-game', icon: 'bxs-game' },
  { id: 'card', label: 'Unveil the Legendary Card', desc: 'Open the premium 3D ID card', icon: 'bxs-id-card' }
]

const TAB_QUESTS = {
  outfit: 'outfit',
  innerraise: 'innerraise',
  inventory: 'inventory',
  journal: 'journal',
  settings: 'settings'
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { done: [], at: 0 }
    const s = JSON.parse(raw)
    return {
      done: Array.isArray(s.done) ? s.done.filter((d) => QUESTS.some((q) => q.id === d)) : [],
      at: s.at || 0
    }
  } catch {
    return { done: [], at: 0 }
  }
}

const saved = load()

export const questlog = reactive({
  done: saved.done,
  completedAt: saved.at,
  mark(id) {
    if (!QUESTS.some((q) => q.id === id) || this.done.includes(id)) return
    this.done.push(id)
    this.completedAt = Date.now()
    try {
      localStorage.setItem(KEY, JSON.stringify({ done: this.done, at: this.completedAt }))
    } catch {
      /* ignore */
    }
  },
  isDone: (id) => questlog.done.includes(id)
})

export function markTabQuest(tabId) {
  const q = TAB_QUESTS[tabId]
  if (q) questlog.mark(q)
}

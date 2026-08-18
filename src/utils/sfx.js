import { useSettings } from '../composables/useSettings'

const { settings } = useSettings()

const base = import.meta.env.BASE_URL
const cache = new Map()

function track(name) {
  if (!cache.has(name)) {
    const audio = new Audio(base + 'audio/' + name)
    audio.preload = 'auto'
    audio.load()
    cache.set(name, audio)
  }
  return cache.get(name)
}

function play(name) {
  if (!settings.fx) return
  const audio = track(name)
  try {
    audio.currentTime = 0
    const p = audio.play()
    if (p) p.catch(() => {})
  } catch (e) {}
}

export function playUnlock() { play('sfx_unlock.wav') }
export function playDeny() { play('sfx_deny.wav') }
export function playCoin() { play('sfx_coin.wav') }
export function playPet() { play('sfx_pet.wav') }
export function playStart() { play('sfx_start.wav') }
export function playGameOver() { play('sfx_gameover.wav') }

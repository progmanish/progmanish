import { reactive } from 'vue'

const STORAGE_KEY = 'progmanish-settings'

const defaults = {
  music: true,
  musicVolume: 75,
  fx: true,
  theme: 'east',
  bgFx: true,
  reducedMotion: false
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

const settings = reactive(load())

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable */
  }
}

export function useSettings() {
  return {
    settings,
    save,
    reset() {
      Object.assign(settings, defaults)
      save()
    }
  }
}

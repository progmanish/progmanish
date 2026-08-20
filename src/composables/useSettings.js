import { reactive } from 'vue'

const STORAGE_KEY = 'progmanish-settings'

const ua = navigator.userAgent || ''
const isMobile = /Mobi|Android|iPhone|iPad|IEMobile|Opera Mini/i.test(ua)
const lowCores = (navigator.hardwareConcurrency || 4) <= 2
const lowMemory = navigator.deviceMemory != null && navigator.deviceMemory <= 2
const isLowEnd = isMobile || lowCores || lowMemory

const defaults = {
  music: true,
  musicVolume: 75,
  fx: true,
  theme: 'east',
  bgFx: !isLowEnd,
  reducedMotion: isLowEnd
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const saved = JSON.parse(raw)
    if (isLowEnd) {
      saved.bgFx = false
      saved.reducedMotion = true
    }
    return { ...defaults, ...saved }
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
    isLowEnd,
    isMobile,
    reset() {
      Object.assign(settings, defaults)
      save()
    }
  }
}

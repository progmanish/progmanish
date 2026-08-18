import { reactive } from 'vue'
import { useSettings } from '../composables/useSettings'

const { settings } = useSettings()

const state = reactive({
  audio: null,
  ctx: null,
  analyser: null,
  playing: false,
  beat: 0
})

let rafId = null

export function useSound() {
  return state
}

export async function startMusic() {
  if (state.audio) {
    if (!state.playing && settings.music) await state.audio.play()
    return
  }

  const audio = new Audio()
  audio.src = import.meta.env.BASE_URL + 'audio/bgm_main.mp3'
  audio.loop = true
  audio.volume = settings.musicVolume / 100
  state.audio = audio

  const Ctx = window.AudioContext || window.webkitAudioContext
  if (Ctx) {
    try {
      const ctx = new Ctx()
      const src = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.8
      src.connect(analyser)
      analyser.connect(ctx.destination)
      state.ctx = ctx
      state.analyser = analyser
      if (ctx.state === 'suspended') ctx.resume()
    } catch (e) {
      console.warn('Audio analyser unavailable:', e)
    }
  }

  if (settings.music) {
    try {
      await audio.play()
      state.playing = true
    } catch (e) {
      console.warn('Autoplay blocked:', e)
    }
  }
  tick()
}

function tick() {
  const { analyser } = state
  if (analyser) {
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    let sum = 0
    for (let i = 0; i < data.length / 2; i++) sum += data[i]
    const avg = sum / (data.length / 2) / 255
    state.beat = Math.min(1, avg * 1.9)
  }
  rafId = requestAnimationFrame(tick)
}

export function applyMusicSettings() {
  if (!state.audio) return
  state.audio.volume = settings.musicVolume / 100
  if (settings.music) {
    if (state.ctx && state.ctx.state === 'suspended') state.ctx.resume()
    if (!state.playing) {
      state.audio.play()
        .then(() => { state.playing = true })
        .catch(() => {})
    }
  } else {
    state.audio.pause()
    state.playing = false
  }
}

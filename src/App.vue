<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import BootScreen from './components/BootScreen.vue'
import PauseMenu from './components/PauseMenu.vue'
import CompanionMascot from './components/CompanionMascot.vue'
import { usePortfolioData } from './composables/usePortfolioData'
import { useSettings } from './composables/useSettings'
import { questlog } from './stores/questlog'
import { tell } from './stores/companion'

const { data, loading } = usePortfolioData()
const { settings, isLowEnd, isMobile } = useSettings()

const booted = ref(false)
const activeTab = ref('outfit')

watch(
  () => settings.theme,
  (t) => {
    document.documentElement.setAttribute('data-theme', t)
    questlog.mark('theme')
    tell('theme')
  }
)

watch(
  () => settings.reducedMotion,
  (r) => document.documentElement.classList.toggle('reduced-motion', r),
  { immediate: true }
)

function handleStart() {
  booted.value = true
  questlog.mark('boot')
  tell('boot')
}

let trailCtx = null
let trailRaf = null
let trailDots = []

function initTrail() {
  const canvas = document.getElementById('mouseTrail')
  if (!canvas || isLowEnd) return
  trailCtx = canvas.getContext('2d')
  resizeTrail()
  window.addEventListener('resize', resizeTrail)

  const addDot = (e) => {
    if (!settings.bgFx) return
    trailDots.push({
      x: e.clientX,
      y: e.clientY,
      r: Math.random() * 2 + 1,
      a: 1,
      dec: Math.random() * 0.03 + 0.012
    })
    if (trailDots.length > 60) trailDots.shift()
  }
  window.addEventListener('mousemove', addDot)

  const draw = () => {
    trailRaf = requestAnimationFrame(draw)
    if (!trailCtx) return
    trailCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const d of trailDots) {
      trailCtx.beginPath()
      trailCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
      trailCtx.fillStyle = `rgba(${accentRGB()}, ${d.a})`
      trailCtx.fill()
      d.a -= d.dec
    }
    trailDots = trailDots.filter((d) => d.a > 0)
  }
  draw()

  return () => {
    window.removeEventListener('resize', resizeTrail)
    window.removeEventListener('mousemove', addDot)
    cancelAnimationFrame(trailRaf)
  }
}

function accentRGB() {
  const t = document.documentElement.getAttribute('data-theme')
  if (t === 'cyber') return '0, 255, 224'
  if (t === 'frost') return '127, 216, 255'
  if (t === 'minimal') return '232, 232, 234'
  return '212, 175, 55'
}

function resizeTrail() {
  const canvas = document.getElementById('mouseTrail')
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

let fxCtx = null
let fxRaf = null
let smoke = []
let glyphs = []

function initWorldFX() {
  const canvas = document.getElementById('worldFX')
  if (!canvas || (isLowEnd && !settings.bgFx)) return
  fxCtx = canvas.getContext('2d')
  resizeFX()
  window.addEventListener('resize', resizeFX)

  const sr = 128
  const sprite = document.createElement('canvas')
  sprite.width = sr
  sprite.height = sr
  const sc = sprite.getContext('2d')
  const g = sc.createRadialGradient(sr / 2, sr / 2, 0, sr / 2, sr / 2, sr / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.5)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.2)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  sc.fillStyle = g
  sc.fillRect(0, 0, sr, sr)

  const GLYPHS = ['</>', '{}', '[]', '//', 'FPS', '0x1F', 'Δ', 'π', '<>', '::', '012', 'gfx', 'cpu', 'ram', 'sys', 'loading', '...', '#', '*', 'x', 'y', 'z']
  const MONO = '"Consolas", "Cascadia Mono", "SF Mono", monospace'

  const makeSmoke = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    const max = 120 + Math.random() * 160
    return {
      x: Math.random() * w,
      y: Math.random() * (h + 220) - 110,
      r: 90 + Math.random() * 180,
      vy: -(0.15 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 0.14,
      a: 0.13 + Math.random() * 0.2,
      life: Math.random() * max,
      max: max
    }
  }
  const makeGlyph = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      text: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: 12 + Math.random() * 15,
      vy: -(0.08 + Math.random() * 0.28),
      vx: (Math.random() - 0.5) * 0.2,
      a: 0.1 + Math.random() * 0.14,
      rot: (Math.random() - 0.5) * 0.5
    }
  }

  const smokeCount = isLowEnd ? 3 : Math.min(10, Math.max(6, Math.round(window.innerWidth / 170)))
  const glyphCount = isLowEnd ? 4 : Math.min(18, Math.max(10, Math.round(window.innerWidth / 80)))
  smoke = Array.from({ length: smokeCount }, makeSmoke)
  glyphs = Array.from({ length: glyphCount }, makeGlyph)

  let lastFrame = 0
  const frameInterval = isLowEnd ? 32 : 16

  const draw = (now) => {
    fxRaf = requestAnimationFrame(draw)
    if (now - lastFrame < frameInterval) return
    lastFrame = now

    const ctx = fxCtx
    if (!ctx) return
    const reduced = document.documentElement.classList.contains('reduced-motion')
    const w = window.innerWidth
    const h = window.innerHeight
    ctx.clearRect(0, 0, w, h)

    if (!reduced && settings.bgFx) {
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      for (const s of smoke) {
        s.life++
        s.y += s.vy
        s.x += s.vx + Math.sin(s.life * 0.02 + s.r) * 0.15
        const fade = Math.min(1, s.life / 25) * Math.max(0, 1 - Math.max(0, s.life - s.max) / 40)
        ctx.globalAlpha = s.a * fade
        const rr = s.r * (1 + Math.sin(s.life * 0.01) * 0.08)
        ctx.drawImage(sprite, s.x - rr, s.y - rr, rr * 2, rr * 2)
        if (s.life > s.max + 40 || s.y < -rr * 2) Object.assign(s, makeSmoke())
      }
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'center'
      for (const gp of glyphs) {
        gp.y += gp.vy
        gp.x += gp.vx
        ctx.globalAlpha = gp.a
        ctx.font = gp.size + 'px ' + MONO
        ctx.fillStyle = 'rgba(' + accentRGB() + ', 1)'
        ctx.fillText(gp.text, gp.x, gp.y)
        if (gp.y < -30 || gp.x < -70 || gp.x > w + 70) Object.assign(gp, makeGlyph())
      }
      ctx.restore()
    }
  }
  fxRaf = requestAnimationFrame(draw)

  return () => {
    window.removeEventListener('resize', resizeFX)
    cancelAnimationFrame(fxRaf)
  }
}

function resizeFX() {
  const canvas = document.getElementById('worldFX')
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function onResetKey(e) {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q') {
    e.preventDefault()
    localStorage.removeItem('gamgineer.quests.v1')
    localStorage.removeItem('gamgineer.contact.v1')
    localStorage.removeItem('progmanish-skilltree-v1')
    localStorage.removeItem('gamgineer.minigame.v1')
    location.reload()
  }
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
const KONAMI_COLORS = ['#ffd700', '#00ffe0', '#ff6fa5', '#a07bff', '#37d39a', '#ffd700']
let konamiIndex = 0
let konamiTimer = null
const konamiFx = ref(false)
const konamiPieces = ref([])

function onSwipeInput(code) {
  if (code === KONAMI[konamiIndex]) {
    konamiIndex++
    if (konamiIndex === KONAMI.length) {
      konamiIndex = 0
      triggerKonami()
      tell('konami')
      questlog.mark('konami')
    }
  } else {
    konamiIndex = code === KONAMI[0] ? 1 : 0
  }
}

function triggerKonami() {
  konamiPieces.value = Array.from({ length: 26 }, () => {
    const a = Math.random() * Math.PI * 2
    const dist = 140 + Math.random() * 280
    return {
      '--dx': `${Math.cos(a) * dist}px`,
      '--dy': `${Math.sin(a) * dist}px`,
      '--rot': `${Math.round(Math.random() * 720 - 360)}deg`,
      '--sz': `${8 + Math.random() * 12}px`,
      '--shape': Math.random() > 0.4 ? '50%' : '20%',
      '--col': KONAMI_COLORS[Math.floor(Math.random() * KONAMI_COLORS.length)],
      animationDelay: `${Math.random() * 0.25}s`
    }
  })
  konamiFx.value = true
  clearTimeout(konamiTimer)
  konamiTimer = setTimeout(() => (konamiFx.value = false), 2100)
}

function onCheatKey(e) {
  const code = e.code || e.key
  if (code === KONAMI[konamiIndex]) {
    konamiIndex++
    if (konamiIndex === KONAMI.length) {
      konamiIndex = 0
      triggerKonami()
      tell('konami')
      questlog.mark('konami')
    }
  } else {
    konamiIndex = code === KONAMI[0] ? 1 : 0
  }
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', settings.theme)
  window.addEventListener('keydown', onResetKey)
  window.addEventListener('keydown', onCheatKey)
  window.addEventListener('konami-swipe', (e) => onSwipeInput(e.detail))
  const cleanup = initTrail()
  const cleanupFX = initWorldFX()
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onResetKey)
    window.removeEventListener('keydown', onCheatKey)
    window.removeEventListener('konami-swipe', onSwipeInput)
    cleanup && cleanup()
    cleanupFX && cleanupFX()
  })
})
</script>

<template>
  <div class="world-bg" aria-hidden="true"></div>
  <canvas id="worldFX" v-show="settings.bgFx" aria-hidden="true"></canvas>
  <canvas id="mouseTrail" v-show="settings.bgFx && !isLowEnd" aria-hidden="true"></canvas>

  <div v-if="!booted" class="boot-zone">
    <BootScreen :loading="loading" @start="handleStart" />
  </div>

  <PauseMenu
    v-else
    :data="data"
    :tab="activeTab"
    @update:tab="(t) => { activeTab = t; tell('tab', t) }"
  />

  <CompanionMascot v-if="booted && !isMobile" />

  <Transition name="konami">
    <div v-if="konamiFx" class="konami-burst" aria-hidden="true">
      <span class="konami-flash"></span>
      <span v-for="(c, i) in konamiPieces" :key="i" class="konami-piece" :style="c"></span>
      <div class="konami-label">SECRET UNLOCKED</div>
    </div>
  </Transition>
</template>

<style scoped>
.boot-zone {
  position: relative;
  z-index: 5;
}

#worldFX {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.konami-burst {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
}
.konami-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.35), transparent 62%);
  animation: kf-flash 0.6s ease-out both;
}
.konami-piece {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--sz);
  height: var(--sz);
  border-radius: var(--shape);
  background: var(--col);
  box-shadow: 0 0 12px var(--col);
  transform: translate(-50%, -50%);
  animation: kf-fly 1.15s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
.konami-label {
  position: absolute;
  left: 50%;
  top: 50%;
  font-family: var(--font-orbitron);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 6px;
  color: #ffd700;
  text-shadow: 0 0 18px rgba(255, 215, 0, 0.9), 0 0 42px rgba(255, 215, 0, 0.5);
  animation: kf-label 2s ease-out both;
  white-space: nowrap;
}
@keyframes kf-flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes kf-fly {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3) rotate(var(--rot)); }
}
@keyframes kf-label {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  15% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
  30% { transform: translate(-50%, -50%) scale(1); }
  78% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1) translateY(-34px); }
}
.konami-enter-active, .konami-leave-active { transition: opacity 0.3s ease; }
.konami-enter-from, .konami-leave-to { opacity: 0; }
</style>

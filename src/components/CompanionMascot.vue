<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useSettings } from '../composables/useSettings'
import { companionBus, messageFor } from '../stores/companion'
import { questlog } from '../stores/questlog'
import { playCoin, playGameOver, playPet, playStart, playUnlock } from '../utils/sfx'

const { settings } = useSettings()

const pet = ref(null)
const spriteEl = ref(null)

const state = ref('sit')
const facing = ref(1)
const sleeping = ref(false)
const mood = ref('neutral') // neutral | happy | surprised
const msg = ref(null)

const game = ref(null)
const hearts = ref([])
const catches = ref([])
const bond = ref(0)

const MINI_KEY = 'gamgineer.minigame.v1'

function loadMini() {
  try {
    const raw = localStorage.getItem(MINI_KEY)
    const d = raw ? JSON.parse(raw) : {}
    return { high: d.high || 0, total: d.total || 0, plays: d.plays || 0, bond: d.bond || 0 }
  } catch {
    return { high: 0, total: 0, plays: 0, bond: 0 }
  }
}

function saveMini(d) {
  try { localStorage.setItem(MINI_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}

let coinId = 0
let heartId = 0
let catchId = 0

let px = window.innerWidth - 120
let py = window.innerHeight - 160
let lastCursor = { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) }
let raf = null
let last = performance.now()

let action = 'sit'
let phase = 'do'
let dur = 2000
let target = { x: px, y: py }
let noticeAt = 0
let hopUntil = 0
let msgUntil = 0
let moodUntil = 0
let idleMsgAt = 0
let lastReactAt = 0

const rnd = (a, b) => a + Math.random() * (b - a)

function setMsg(text, durMs = 3400) {
  if (!text) return
  msg.value = text
  msgUntil = performance.now() + durMs
}

function setMood(m, durMs = 2600) {
  mood.value = m
  moodUntil = performance.now() + durMs
}

watch(
  () => companionBus.evt,
  (e) => {
    if (!e) return
    const now = performance.now()
    const isBlocked = e.type.startsWith('blocked')
    if (now - lastReactAt < 1500 && !isBlocked) return
    lastReactAt = now
    if (sleeping.value) {
      sleeping.value = false
      action = 'look'
      phase = 'do'
      dur = 2000
    }
    const text = messageFor(e.type)
    if (isBlocked) {
      setMood('surprised', 1600)
      setMsg(text || 'Nice try, keep it up !!', 2800)
    } else if (e.type.startsWith('artifact')) {
      setMood('surprised', 1800)
      setMsg(text || 'Ooh, what\'s this?', 3600)
    } else if (e.type === 'click') {
      setMood('happy', 2000)
      setMsg(text, 2400)
      hopUntil = 700
    } else if (text) {
      setMood('happy', 1800)
      setMsg(text, 3600)
    }
  }
)

function pickAction() {
  const w = { sit: 30, look: 22, walk: 24, explore: 14, play: 9, sleep: 9, chase: 6 }
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  let r = Math.random() * sum
  let a = 'sit'
  for (const [k, v] of Object.entries(w)) {
    r -= v
    if (r <= 0) { a = k; break }
  }
  return a
}

function spot() {
  const navPad = window.innerWidth <= 760 ? 80 : 47
  return {
    x: rnd(40, window.innerWidth - 120),
    y: rnd(60, window.innerHeight - navPad - 113)
  }
}

function beginAction(a) {
  action = a
  phase = 'do'
  sleeping.value = false
  hopUntil = 0
  if (a === 'sit') {
    idleMsgAt = performance.now() + rnd(7000, 13000)
    dur = rnd(1500, 4200)
  } else if (a === 'look') {
    dur = rnd(1800, 4000)
  } else if (a === 'walk') {
    target = spot()
    dur = rnd(2600, 6200)
  } else if (a === 'explore') {
    target = spot()
    setMsg(messageFor('idle') || null, 2600)
    dur = rnd(3000, 6000)
  } else if (a === 'play') {
    setMood('happy', 2500)
    dur = rnd(1800, 3600)
  } else if (a === 'chase') {
    target = { ...lastCursor }
    dur = 2800
  } else if (a === 'sleep') {
    phase = 'go'
    target = { x: rnd(window.innerWidth - 260, window.innerWidth - 110), y: rnd(window.innerHeight - 190, window.innerHeight - 120) }
  }
}

function makeCoin(now) {
  const gold = Math.random() < 0.18
  return {
    id: ++coinId,
    x: rnd(90, window.innerWidth - 150),
    y: rnd(90, window.innerHeight - 170),
    at: now,
    ttl: gold ? 4200 : 3600,
    val: gold ? 50 : 10,
    gold
  }
}

function startGame() {
  if (game.value?.active || game.value?.over) return
  sleeping.value = false
  action = 'chase'
  phase = 'do'
  playStart()
  setMood('happy', 2200)
  setMsg(messageFor('game_start') || 'GO!', 2600)
  game.value = {
    active: true,
    over: false,
    coins: [],
    score: 0,
    caught: 0,
    timeLeft: 30,
    maxCoins: 5,
    nextSpawn: performance.now() + 250,
    record: false,
    high: loadMini().high
  }
}

function burstAt(x, y, col) {
  for (let i = 0; i < 5; i++) {
    catches.value.push({ id: ++catchId, x: x + rnd(-8, 8), y: y + rnd(-8, 8), at: performance.now(), col })
  }
}

function updateGame(now, dt) {
  const g = game.value
  g.timeLeft -= dt / 1000
  if (g.timeLeft <= 0) return endGame()
  if (g.coins.length < g.maxCoins && now > g.nextSpawn) {
    g.coins.push(makeCoin(now))
    g.nextSpawn = now + rnd(700, 1300)
  }
  g.coins = g.coins.filter((c) => now - c.at < c.ttl)
  let best = null
  let bd = Infinity
  for (const c of g.coins) {
    const d = Math.hypot(c.x - px, c.y - py)
    if (d < bd) { bd = d; best = c }
  }
  if (best) {
    const speed = 0.3
    const dx = best.x - px
    const dy = best.y - py
    const dist = Math.hypot(dx, dy)
    px += (dx / dist) * speed * dt
    py += (dy / dist) * speed * dt
    if (Math.abs(dx) > 0.5) facing.value = dx > 0 ? 1 : -1
    if (dist < 15) {
      g.score += best.val
      g.caught++
      g.coins = g.coins.filter((c) => c.id !== best.id)
      playCoin()
      burstAt(best.x, best.y, best.gold ? '#ffd700' : 'var(--accent)')
    }
  }
}

function endGame() {
  const g = game.value
  g.active = false
  g.coins = []
  const prev = loadMini()
  const rec = {
    high: Math.max(prev.high, g.score),
    total: prev.total + g.score,
    plays: prev.plays + 1,
    bond: prev.bond
  }
  saveMini(rec)
  g.record = g.score > prev.high
  g.high = rec.high
  g.over = true
  questlog.mark('playgame')
  setMood('happy', 2600)
  setMsg(g.record ? `NEW RECORD! ${g.score} pts!` : `Caught ${g.caught} pixels · ${g.score} pts`, 4400)
  if (g.record) {
    playUnlock()
  } else {
    playGameOver()
  }
  setTimeout(() => { if (game.value) game.value.over = false }, 5200)
}

function tick(now) {
  raf = requestAnimationFrame(tick)
  if (!pet.value) return
  const dt = now - last
  last = now
  dur -= dt
  hopUntil = Math.max(0, hopUntil - dt)

  if (msg.value && now > msgUntil) msg.value = null
  if (now > moodUntil && mood.value !== 'neutral') mood.value = 'neutral'

  hearts.value = hearts.value.filter((h) => now - h.at < 1100)
  catches.value = catches.value.filter((p) => now - p.at < 750)

  if (game.value?.active) {
    updateGame(now, dt)
    render()
    return
  }

  if (action === 'sit' && !sleeping.value && now > idleMsgAt && !msg.value) {
    idleMsgAt = now + rnd(9000, 16000)
    setMsg(messageFor('idle'), 3200)
  }

  if (noticeAt <= now && (action === 'sit' || action === 'look') && Math.hypot(lastCursor.x - px, lastCursor.y - py) < 240) {
    noticeAt = now + rnd(1200, 2600)
    if (Math.random() < 0.5) {
      facing.value = lastCursor.x > px ? 1 : -1
      setMood('surprised', 700)
    }
  }

  if (dur <= 0 && phase !== 'go') {
    beginAction(pickAction())
  }

  const moving = phase === 'go' || action === 'walk' || action === 'explore' || action === 'chase'
  if (moving) {
    const speed = action === 'chase' ? 0.26 : action === 'explore' ? rnd(0.1, 0.16) : rnd(0.07, 0.13)
    const dx = target.x - px
    const dy = target.y - py
    const dist = Math.hypot(dx, dy)
    if (dist > 3) {
      px += (dx / dist) * speed * dt
      py += (dy / dist) * speed * dt
      if (Math.abs(dx) > 0.5) facing.value = dx > 0 ? 1 : -1
    } else if (action === 'chase') {
      phase = 'do'; action = 'sit'; dur = rnd(1800, 3000)
      setMood('happy', 1800)
    } else if (action === 'explore') {
      phase = 'do'; action = 'look'; dur = rnd(1200, 2200)
    } else if (action === 'sleep' && phase === 'go') {
      phase = 'do'; sleeping.value = true; dur = rnd(5000, 11000)
      setMsg(messageFor('sleep'), 3600)
    } else {
      action = 'sit'; phase = 'do'; dur = rnd(900, 2400)
      idleMsgAt = performance.now() + rnd(6000, 12000)
    }
  }

  if (action === 'sleep' && phase === 'do' && !sleeping.value) {
    sleeping.value = true
    setMsg(messageFor('sleep'), 3600)
  }

  render()
}

function render() {
  if (!pet.value) return
  const half = 51
  const margin = 90
  const navPad = window.innerWidth <= 760 ? 80 : 47
  const rightEdge = Math.max(margin, window.innerWidth - margin)
  const cx = Math.min(Math.max(px + half, margin), rightEdge)
  const pyMax = window.innerHeight - navPad - 113
  pet.value.style.transform = `translate3d(${Math.round(cx - half)}px, ${Math.round(Math.min(py, pyMax))}px, 0)`
  state.value = action === 'sleep' && phase === 'go' ? 'walk' : action
  spriteEl.value.classList.toggle('hop-bounce', hopUntil > 0)
}

function onPointer(e) {
  lastCursor.x = e.clientX
  lastCursor.y = e.clientY
}

function petOnce() {
  hopUntil = 900
  setMood('happy', 2000)
  const rec = loadMini()
  rec.bond += 1
  saveMini(rec)
  bond.value = rec.bond
  playPet()
  for (let i = 0; i < 6; i++) {
    hearts.value.push({ id: ++heartId, x: px + 50 + rnd(-26, 26), y: py + rnd(-18, 14), at: performance.now() })
  }
  setMsg(messageFor('pet') || 'Boop!', 2400)
}

function onClick(e) {
  if (game.value?.active || game.value?.over) return
  const d = Math.hypot(e.clientX - (px + 51), e.clientY - (py + 56))
  if (d < 55 && action !== 'sleep') petOnce()
}

function onDblClick(e) {
  const d = Math.hypot(e.clientX - (px + 51), e.clientY - (py + 56))
  if (d < 55) startGame()
}

onMounted(() => {
  bond.value = loadMini().bond
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('click', onClick, { passive: true })
  window.addEventListener('dblclick', onDblClick, { passive: true })
  if (!settings.reducedMotion) raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  window.removeEventListener('click', onClick)
  window.removeEventListener('dblclick', onDblClick)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    ref="pet"
    class="mascot"
    :class="[state, { sleep: sleeping, 'mood-happy': mood === 'happy', 'mood-surprised': mood === 'surprised' }]"
    aria-hidden="true"
  >
    <div class="bubble" v-if="msg">{{ msg }}</div>
    <span class="zzz">
      <i>z</i><i>z</i><i>z</i>
    </span>
    <span class="shadow"></span>
    <div class="dust"><span></span><span></span><span></span></div>

    <div ref="spriteEl" class="sprite-wrap" :style="{ transform: 'scaleX(' + facing + ')' }">
      <svg
        class="sprite view-front"
        viewBox="0 0 96 106"
        width="102"
        height="113"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="haloGrad" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="ballGrad" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="45%" stop-color="var(--accent)" />
            <stop offset="100%" stop-color="#2a2f4a" />
          </radialGradient>
        </defs>

        <circle class="halo" cx="48" cy="44" r="42" fill="url(#haloGrad)" />

        <!-- antenna -->
        <g class="antenna">
          <line x1="48" y1="9" x2="48" y2="20" stroke="#2a2f4a" stroke-width="3" stroke-linecap="round" />
          <circle class="antenna-ball" cx="48" cy="8" r="5" fill="url(#ballGrad)" />
        </g>

        <!-- rocket flames (under feet) -->
        <g class="flame flame-l">
          <path d="M35.5 88 C39 93, 40 99, 35.5 104 C31 99, 32 93, 35.5 88 Z" fill="var(--accent)" opacity="0.85" />
          <path d="M35.5 89 C37.5 92.5, 38.5 96, 35.5 101 C32.5 96, 33.5 92.5, 35.5 89 Z" fill="#ffd76a" opacity="0.95" />
        </g>
        <g class="flame flame-r">
          <path d="M60.5 88 C64 93, 65 99, 60.5 104 C56 99, 57 93, 60.5 88 Z" fill="var(--accent)" opacity="0.85" />
          <path d="M60.5 89 C62.5 92.5, 63.5 96, 60.5 101 C57.5 96, 58.5 92.5, 60.5 89 Z" fill="#ffd76a" opacity="0.95" />
        </g>

        <!-- arms -->
        <rect x="5" y="40" width="12" height="9" rx="4.5" fill="#f2f4fa" stroke="#2a2f4a" stroke-width="3" />
        <rect x="79" y="40" width="12" height="9" rx="4.5" fill="#f2f4fa" stroke="#2a2f4a" stroke-width="3" />

        <!-- legs -->
        <rect x="28" y="80" width="15" height="9" rx="4.5" fill="#f2f4fa" stroke="#2a2f4a" stroke-width="3" />
        <rect x="53" y="80" width="15" height="9" rx="4.5" fill="#f2f4fa" stroke="#2a2f4a" stroke-width="3" />

        <!-- body -->
        <rect class="chassis" x="17" y="18" width="62" height="66" rx="24" fill="#f2f4fa" stroke="#2a2f4a" stroke-width="3" />
        <rect x="17" y="56" width="62" height="28" rx="12" fill="#dfe4f2" opacity="0.6" />

        <!-- chest button -->
        <circle class="chest-btn" cx="48" cy="73" r="5" fill="url(#ballGrad)" />

        <!-- face screen -->
        <rect class="screen" x="26" y="28" width="44" height="36" rx="11" fill="#23283d" />

        <!-- blush -->
        <ellipse v-if="!sleeping" cx="34" cy="52" rx="3.4" ry="2.2" fill="#ff9db0" opacity="0.55" />
        <ellipse v-if="!sleeping" cx="62" cy="52" rx="3.4" ry="2.2" fill="#ff9db0" opacity="0.55" />

        <!-- expressions -->
        <g class="eyes eyes-normal" v-if="!sleeping && mood === 'neutral'">
          <circle cx="40" cy="45" r="3.4" fill="var(--accent)" />
          <circle cx="56" cy="45" r="3.4" fill="var(--accent)" />
          <circle cx="40.9" cy="43.9" r="1.1" fill="#ffffff" />
          <circle cx="56.9" cy="43.9" r="1.1" fill="#ffffff" />
        </g>
        <g class="eyes eyes-happy" v-else-if="!sleeping && mood === 'happy'">
          <path d="M35 48 Q40 42 45 48" stroke="var(--accent)" stroke-width="3.2" fill="none" stroke-linecap="round" />
          <path d="M51 48 Q56 42 61 48" stroke="var(--accent)" stroke-width="3.2" fill="none" stroke-linecap="round" />
        </g>
        <g class="eyes eyes-surprised" v-else-if="!sleeping && mood === 'surprised'">
          <circle cx="40" cy="45" r="5" fill="var(--accent)" />
          <circle cx="56" cy="45" r="5" fill="var(--accent)" />
          <circle cx="41.2" cy="43.6" r="1.7" fill="#ffffff" />
          <circle cx="57.2" cy="43.6" r="1.7" fill="#ffffff" />
        </g>
        <g class="eyes eyes-sleep" v-else>
          <path d="M35 47 Q40 43 45 47" stroke="#8a94c0" stroke-width="3" fill="none" stroke-linecap="round" />
          <path d="M51 47 Q56 43 61 47" stroke="#8a94c0" stroke-width="3" fill="none" stroke-linecap="round" />
        </g>

        <path v-if="!sleeping && mood === 'neutral'" d="M43 55 Q48 59 53 55" stroke="var(--accent)" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <path v-else-if="!sleeping && mood === 'happy'" d="M41 54 Q48 62 55 54 Q48 57 41 54 Z" fill="var(--accent)" />
        <ellipse v-else-if="!sleeping && mood === 'surprised'" cx="48" cy="56" rx="3" ry="4" fill="var(--accent)" />
        <text v-else-if="sleeping" x="48" y="58" text-anchor="middle" class="screen-text" font-size="15">z z</text>
      </svg>

      <span class="spark">✦</span>
      <span class="spark">✦</span>
      <span class="spark">✦</span>
    </div>
  </div>

  <Teleport to="body">
    <div class="game-layer">
      <div v-if="game?.active" class="game-hud">
        <span class="gh-label">PIXEL HUNT</span>
        <div class="gh-timer">
          <div class="gh-timer-fill" :style="{ width: (game.timeLeft / 30 * 100) + '%' }"></div>
        </div>
        <span class="gh-time">{{ Math.ceil(game.timeLeft) }}</span>
        <span class="gh-score">SCORE <b>{{ game.score }}</b></span>
        <span class="gh-bond">♥ {{ bond }}</span>
      </div>

      <span
        v-for="c in game?.coins || []"
        :key="c.id"
        class="coin"
        :class="{ gold: c.gold }"
        :style="{ left: c.x + 'px', top: c.y + 'px' }"
      >✦</span>

      <span
        v-for="h in hearts"
        :key="h.id"
        class="heart"
        :style="{ left: h.x + 'px', top: h.y + 'px' }"
      >♥</span>

      <span
        v-for="p in catches"
        :key="p.id"
        class="catch"
        :style="{ left: p.x + 'px', top: p.y + 'px', '--col': p.col }"
      ></span>

      <div v-if="game?.over" class="game-over" @click.stop="game.over = false">
        <div class="go-card">
          <h3>GAME OVER</h3>
          <div class="go-score">{{ game.score }}<small> pts</small></div>
          <div class="go-caught">{{ game.caught }} pixels caught</div>
          <div v-if="game.record" class="go-record">★ NEW RECORD ★</div>
          <div class="go-high">HIGH SCORE {{ game.high }}</div>
          <div class="go-hint">click anywhere to dismiss</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mascot {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 101;
  pointer-events: none;
  will-change: transform;
}

/* speech bubble */
.bubble {
  position: absolute;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 172px;
  padding: 6px 10px;
  background: rgba(10, 12, 22, 0.88);
  border: 1px solid var(--accent);
  border-radius: 6px;
  box-shadow: 0 0 14px rgba(0, 0, 0, 0.4), 0 0 18px color-mix(in srgb, var(--accent) 25%, transparent);
  font-family: var(--font-pixel, 'VT323', monospace);
  font-size: 12px;
  line-height: 1.4;
  color: #e8e8ee;
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  animation: bubble-in 0.22s ease-out;
}
.bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--accent);
}
@keyframes bubble-in {
  from { transform: translateX(-50%) translateY(6px) scale(0.7); opacity: 0; }
  to { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
}

.shadow {
  position: absolute;
  left: 18px;
  bottom: 4px;
  width: 66px;
  height: 12px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  filter: blur(2px);
}
.mascot.sleep .shadow { width: 58px; }

.sprite-wrap { position: relative; transform-origin: center; }
.sprite {
  display: block;
  animation: floaty 2.6s ease-in-out infinite;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 40%, transparent))
    drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35));
}

/* rocket flames under the feet */
.flame {
  transform-box: fill-box;
  transform-origin: 50% 0%;
  animation: flick 0.18s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 5px var(--accent));
}
.flame-r { animation-delay: 0.07s; }
.mascot:is(.walk, .explore, .chase) .flame { animation: thrust 0.11s ease-in-out infinite alternate; }
@keyframes flick {
  from { transform: scaleY(0.9) scaleX(0.9); }
  to { transform: scaleY(1.1) scaleX(1.06); }
}
@keyframes thrust {
  from { transform: scaleY(1.3) scaleX(0.94); }
  to { transform: scaleY(1.55) scaleX(1.04); }
}
.mascot.sleep .flame { opacity: 0; }
@keyframes floaty {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-7px) rotate(1.5deg); }
}

/* moving bounce (hover-thrust) */
.mascot:is(.walk, .explore, .chase) .sprite { animation: bob 0.3s ease-in-out infinite alternate; }
@keyframes bob {
  from { transform: translateY(0) scaleY(1); }
  to { transform: translateY(-7px) scaleY(0.96); }
}
.mascot:is(.walk, .explore, .chase) .shadow { width: 58px; opacity: 0.7; }

/* mood reactions */
.mascot.mood-happy .sprite { animation: happy-bounce 0.55s ease; }
@keyframes happy-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-14px) scale(1.1, 0.85); }
  60% { transform: translateY(0) scale(0.9, 1.15); }
}
.mascot.mood-surprised .sprite { animation: pulse 0.7s ease; }
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  40% { transform: scale(1.14); }
}

/* hop on click */
.hop-bounce { animation: hop 0.55s cubic-bezier(0.28, 0.8, 0.4, 1); }
@keyframes hop {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-26px) scale(1.06, 0.88); }
  55% { transform: translateY(0) scale(0.9, 1.1); }
  100% { transform: translateY(0) scale(1); }
}

/* antenna pulse */
.antenna-ball { transform-box: fill-box; transform-origin: center; animation: ball-pulse 1.6s ease-in-out infinite; }
@keyframes ball-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.85; }
}
.chest-btn { transform-box: fill-box; transform-origin: center; animation: ball-pulse 1.6s ease-in-out infinite; animation-delay: 0.4s; }

/* blink */
.eyes-normal { transform-box: fill-box; transform-origin: center; animation: blink 3.6s infinite; }
@keyframes blink {
  0%, 94%, 100% { transform: scaleY(1); }
  97% { transform: scaleY(0.08); }
}

/* sparkles (happy / play) */
.spark {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 12px;
  color: var(--accent);
  text-shadow: 0 0 8px var(--accent);
  opacity: 0;
  animation: orbit 2.4s linear infinite;
}
.spark:nth-child(2) { animation-delay: 0.8s; }
.spark:nth-child(3) { animation-delay: 1.6s; }
.mascot.mood-happy .spark, .mascot.play .spark, .mascot.chase .spark { opacity: 1; }
@keyframes orbit {
  from { transform: translate(-50%, -50%) rotate(0deg) translateX(58px) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg) translateX(58px) rotate(-360deg); }
}

/* dust trail while moving */
.dust { position: absolute; left: 0; top: 0; opacity: 0; transition: opacity 0.2s; }
.mascot:is(.walk, .explore, .chase) .dust { opacity: 1; }
.dust span {
  position: absolute;
  left: 50%;
  top: 78px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  animation: fall 0.8s ease-out infinite;
}
.dust span:nth-child(2) { animation-delay: 0.27s; left: 36%; }
.dust span:nth-child(3) { animation-delay: 0.54s; left: 64%; }
@keyframes fall {
  0% { transform: translate(0, 0) scale(1); opacity: 0.85; }
  100% { transform: translate(0, 26px) scale(0.3); opacity: 0; }
}

/* sleep */
.mascot.sleep .sprite {
  animation: sleep-hover 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.12)) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.3));
}
@keyframes sleep-hover {
  0%, 100% { transform: translateY(8px); }
  50% { transform: translateY(10px); }
}
.mascot.sleep .screen { opacity: 0.55; }
.mascot.sleep .antenna-ball { opacity: 0.4; }
.mascot.sleep .zzz { opacity: 1; }

.zzz {
  position: absolute;
  top: -20px;
  right: 2px;
  display: flex;
  gap: 1px;
  font-family: var(--font-pixel, 'VT323', monospace);
  font-size: 12px;
  color: var(--accent);
  opacity: 0;
  pointer-events: none;
}
.zzz i { animation: float-z 1.8s ease-in-out infinite; display: inline-block; }
.zzz i:nth-child(2) { animation-delay: 0.4s; }
.zzz i:nth-child(3) { animation-delay: 0.8s; }
@keyframes float-z {
  0% { transform: translate(0, 4px) scale(0.6); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translate(10px, -18px) scale(1); opacity: 0; }
}

.screen-text {
  font-family: var(--font-pixel, 'VT323', monospace);
  fill: #8a94c0;
}

/* ---------- mini-game layer ---------- */
.game-layer {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
}

.game-hud {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: rgba(10, 12, 22, 0.85);
  border: 1px solid var(--accent);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.45);
  font-family: var(--font-orbitron);
  color: #e8e8ee;
  animation: bubble-in 0.22s ease-out;
}
.gh-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--accent);
}
.gh-timer {
  position: relative;
  width: 130px;
  height: 8px;
  border-radius: 6px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  overflow: hidden;
}
.gh-timer-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--accent), #ffd700);
  box-shadow: 0 0 8px var(--accent);
  transition: width 0.1s linear;
}
.gh-time {
  font-size: 13px;
  font-weight: 700;
  color: #ffd700;
  min-width: 16px;
}
.gh-score { font-size: 11px; color: var(--text-dim); }
.gh-score b { color: var(--accent); margin-left: 3px; font-size: 13px; }
.gh-bond { font-size: 11px; color: #ff6fa5; }

.coin {
  position: fixed;
  font-size: 24px;
  line-height: 1;
  color: var(--accent);
  text-shadow: 0 0 12px var(--accent);
  transform: translate(-50%, -50%);
  animation: coin-bob 1s ease-in-out infinite;
}
.coin.gold {
  color: #ffd700;
  text-shadow: 0 0 16px #ffd700;
  font-size: 29px;
}
@keyframes coin-bob {
  0%, 100% { transform: translate(-50%, -50%) translateY(0) scale(1); }
  50% { transform: translate(-50%, -50%) translateY(-9px) scale(1.14); }
}

.heart {
  position: fixed;
  font-size: 15px;
  line-height: 1;
  color: #ff6fa5;
  text-shadow: 0 0 8px #ff6fa5;
  transform: translate(-50%, -50%);
  animation: heart-rise 0.95s ease-out forwards;
}
@keyframes heart-rise {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
  100% { opacity: 0; transform: translate(-50%, -50%) translateY(-44px) scale(0.7); }
}

.catch {
  position: fixed;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--col);
  box-shadow: 0 0 12px var(--col);
  transform: translate(-50%, -50%);
  animation: catch-pop 0.7s ease-out forwards;
}
@keyframes catch-pop {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.8); }
}

.game-over {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  display: grid;
  place-items: center;
  background: rgba(4, 6, 12, 0.55);
  backdrop-filter: blur(2px);
  animation: go-fade 0.25s ease-out;
  cursor: pointer;
}
.go-card {
  text-align: center;
  padding: 26px 42px;
  border: 1px solid var(--accent);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--panel-hi), transparent), rgba(10, 12, 22, 0.92);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), 0 0 30px color-mix(in srgb, var(--accent) 30%, transparent);
  font-family: var(--font-orbitron);
  color: #e8e8ee;
  animation: go-card 0.35s cubic-bezier(0.2, 1.2, 0.4, 1);
}
.go-card h3 {
  color: var(--accent);
  letter-spacing: 4px;
  margin-bottom: 12px;
  font-size: 14px;
}
.go-score {
  font-size: 46px;
  font-weight: 800;
  color: #ffd700;
  text-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
}
.go-score small { font-size: 13px; color: var(--text-dim); }
.go-caught { color: var(--text-dim); margin-top: 6px; font-size: 12px; }
.go-record {
  margin-top: 10px;
  color: #ffd700;
  letter-spacing: 3px;
  font-size: 12px;
  animation: rec-blink 0.9s steps(2) infinite;
}
.go-high { margin-top: 4px; color: var(--text-dim); font-size: 11px; }
.go-hint {
  margin-top: 16px;
  color: var(--text-dim);
  opacity: 0.7;
  font-size: 9px;
  letter-spacing: 2px;
}
@keyframes go-fade { from { opacity: 0; } }
@keyframes go-card { from { transform: scale(0.7); opacity: 0; } }
@keyframes rec-blink { 50% { opacity: 0.3; } }

@media (prefers-reduced-motion: reduce) {
  .mascot .sprite,
  .mascot .flame,
  .mascot .antenna-ball,
  .mascot .chest-btn,
  .mascot .eyes-normal,
  .mascot .spark,
  .mascot .zzz i,
  .mascot .dust span {
    animation: none !important;
  }
  .game-layer .coin,
  .game-layer .heart,
  .game-layer .catch,
  .game-layer .game-hud,
  .game-layer .go-card {
    animation: none !important;
  }
}
</style>

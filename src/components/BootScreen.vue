<script setup>
import { ref, onMounted, watch } from 'vue'
import { startMusic, useSound } from '../stores/sound'

const props = defineProps({
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['start'])

const progress = ref(0)
const ready = ref(false)
const { beat } = useSound()

watch(
  () => props.loading,
  (l) => {
    if (!l && ready.value) start()
  }
)

onMounted(() => {
  const startT = Date.now()
  const duration = 2400
  const step = () => {
    const t = Math.min(1, (Date.now() - startT) / duration)
    progress.value = Math.round(t * 100)
    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      ready.value = true
      if (!props.loading) start()
    }
  }
  requestAnimationFrame(step)
})

async function start() {
  emit('start')
  await startMusic()
}
</script>

<template>
  <div class="boot" :class="{ ready }">
    <div class="aura" :style="{ opacity: 0.4 + beat * 0.5 }"></div>

    <div class="logo-wrap">
      <div class="logo-rune">✦</div>
      <h1 class="logo">progmanish</h1>
      <p class="tagline">A wandering engineer's tome</p>
    </div>

    <div class="load-track">
      <div class="load-fill" :style="{ width: progress + '%' }"></div>
      <div class="load-text">{{ progress }}%</div>
    </div>

    <p class="load-sub">INITIALIZING MENU…</p>
  </div>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: radial-gradient(80% 70% at 50% 45%, var(--bg-1) 0%, var(--bg-0) 75%);
  overflow: hidden;
}

.aura {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(30% 26% at 50% 40%, var(--glow-soft), transparent 70%),
    radial-gradient(20% 18% at 62% 52%, var(--glow-soft), transparent 70%);
  filter: blur(30px);
  transition: opacity 0.3s linear;
}

.logo-wrap {
  text-align: center;
  animation: fade-in 1s ease both;
}

.logo-rune {
  font-size: 42px;
  color: var(--accent);
  text-shadow: 0 0 22px var(--glow);
  animation: spin-slow 14s linear infinite;
  margin-bottom: 10px;
}

.logo {
  font-family: var(--font-display);
  font-size: clamp(40px, 8vw, 86px);
  font-weight: 700;
  letter-spacing: 8px;
  color: var(--text);
  text-shadow:
    0 0 24px var(--glow),
    2px 0 0 var(--accent-red-bright),
    -2px 0 0 var(--accent);
  animation: fade-in 1.2s ease both;
}

.tagline {
  font-family: var(--font-hud);
  letter-spacing: 5px;
  color: var(--text-dim);
  margin-top: 10px;
  text-transform: uppercase;
}

.load-track {
  position: relative;
  width: min(420px, 78vw);
  height: 8px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.load-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-bright));
  box-shadow: 0 0 16px var(--glow);
  transition: width 0.1s linear;
}

.load-text {
  position: absolute;
  right: 0;
  top: 14px;
  font-family: var(--font-pixel);
  font-size: 9px;
  color: var(--text-dim);
}

.load-sub {
  font-family: var(--font-hud);
  font-size: 12px;
  letter-spacing: 4px;
  color: var(--text-dim);
}

@media (max-width: 760px) {
  .aura { filter: blur(10px); }
  .logo { text-shadow: 0 0 12px var(--glow); }
}
</style>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import CardFace from './CardFace.vue'
import { playCoin } from '../../utils/sfx'

const props = defineProps({
  open: { type: Boolean, default: false },
  user: { type: Object, default: null },
  appearance: { type: Object, default: null },
  contact: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const flipped = ref(false)
const rx = ref(0)
const ry = ref(0)
const scene = ref(null)

function onMove(e) {
  const el = scene.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  ry.value = (px - 0.5) * 16
  rx.value = (0.5 - py) * 16
}
function onLeave() {
  rx.value = 0
  ry.value = 0
}
function onFlip() {
  flipped.value = !flipped.value
  playCoin()
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.open) {
    e.stopPropagation()
    emit('close')
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))

watch(
  () => props.open,
  (v) => {
    if (v) {
      flipped.value = false
      rx.value = 0
      ry.value = 0
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-mask" @click.self="emit('close')">
      <div class="card-modal" role="dialog" aria-modal="true">
        <button class="cm-close" @click="emit('close')" aria-label="Close">✕</button>

        <header class="cm-head">
          <span class="hud-label cm-eyebrow">- LEGENDARY ID CARD -</span>
          <h2 class="cm-title">The Wanderer's Calling Card</h2>
        </header>

        <div class="cm-body">
          <div class="card-stage">
            <div
              ref="scene"
              class="card-scene"
              @pointermove="onMove"
              @pointerleave="onLeave"
            >
              <div class="card-float">
                <div
                  class="card-3d"
                  :class="{ flipped }"
                  :style="{ '--rx': rx + 'deg', '--ry': ry + 'deg' }"
                >
                  <CardFace side="front" :user="user" :appearance="appearance" :contact="contact" />
                  <CardFace side="back" :user="user" :appearance="appearance" :contact="contact" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="cm-actions">
          <button class="ca-btn" type="button" @click="onFlip">
            <i class="bx" :class="flipped ? 'bx-sync' : 'bx-refresh'"></i>
            {{ flipped ? 'SHOW FRONT' : 'FLIP CARD' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(3, 5, 12, 0.78);
  backdrop-filter: blur(9px);
  animation: fade-in 0.25s ease both;
}

.card-modal {
  position: relative;
  width: min(760px, 100%);
  max-height: 94vh;
  overflow-y: auto;
  padding: 26px 24px 22px;
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  background:
    radial-gradient(120% 100% at 0% 0%, var(--glow-soft), transparent 55%),
    linear-gradient(180deg, var(--panel-hi), var(--panel-solid));
  box-shadow: 0 0 44px var(--glow-soft), inset 0 0 30px var(--glow-soft);
  animation: rise-in 0.3s ease both;
}

.cm-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: var(--panel-solid);
  color: var(--text-dim);
  font-size: 15px;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
}
.cm-close:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: rotate(90deg);
}

.cm-head { text-align: center; margin-bottom: 18px; padding: 0 26px; }
.cm-eyebrow { color: var(--accent); letter-spacing: 3px; font-size: 10px; }
.cm-title {
  font-family: var(--font-display);
  font-size: clamp(18px, 2.6vw, 24px);
  letter-spacing: 3px;
  color: var(--text);
  text-shadow: 0 0 18px var(--glow);
  margin: 6px 0 4px;
}

.cm-body { min-height: 340px; display: flex; align-items: center; justify-content: center; }

/* ---------- 3D card ---------- */
.card-stage { width: 100%; display: flex; align-items: center; justify-content: center; }

.card-scene {
  position: relative;
  perspective: 1300px;
  display: grid;
  place-items: center;
  padding: 26px 10px 24px;
  width: min(560px, 100%);
}

.card-float {
  width: min(500px, 100%);
  transform-style: preserve-3d;
  animation: card-float 6.5s ease-in-out infinite;
}

.card-3d {
  position: relative;
  width: 100%;
  aspect-ratio: 1.586;
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(calc(var(--ry, 0deg) + var(--flip, 0deg)));
  transition: transform 0.5s cubic-bezier(0.34, 1.25, 0.44, 1);
}

.card-3d.flipped { --flip: 180deg; }

.card-3d :deep(.card-face) {
  position: absolute;
  inset: 0;
}

@keyframes card-float {
  0%, 100% { transform: translateY(-6px); }
  50% { transform: translateY(7px); }
}

/* ---------- Actions ---------- */
.cm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.ca-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 11px;
  background: var(--panel-solid);
  font-family: var(--font-hud);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.22s ease;
  white-space: nowrap;
}
.ca-btn i { color: var(--accent); font-size: 15px; flex: none; }
.ca-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--glow-soft);
  transform: translateY(-1px);
}
.ca-btn.primary {
  border-color: var(--accent);
  color: var(--accent);
  background: linear-gradient(180deg, var(--glow-soft), transparent);
  box-shadow: inset 0 0 14px var(--glow-soft);
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .card-float { animation: none; }
}
</style>

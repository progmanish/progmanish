<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  rarity: { type: Object, required: true },
  rarityKey: { type: String, default: 'uncommon' },
  index: { type: Number, default: 0 }
})
const emit = defineEmits(['open'])

const root = ref(null)

const tags = computed(() => (props.item.tech || []).slice(0, 2))

const GEM_ICON = {
  legendary: 'bx-trophy',
  epic: 'bx-star',
  uncommon: 'bx-cube',
  worn: 'bx-shield-alt'
}

const TIER = { legendary: 5, epic: 4, uncommon: 3, worn: 2 }
const BUILD = { legendary: 'v2.4', epic: 'v1.9', uncommon: 'v0.8', worn: 'v0.3' }

function onMove(e) {
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg')
  el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg')
  el.style.setProperty('--mx', e.clientX - r.left + 'px')
  el.style.setProperty('--my', e.clientY - r.top + 'px')
}

function onLeave() {
  const el = root.value
  if (!el) return
  el.style.setProperty('--rx', '0deg')
  el.style.setProperty('--ry', '0deg')
}

function burst() {
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const x = r.width / 2
  const y = r.height / 2
  const n = 14
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.className = 'spark'
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6
    const dist = 46 + Math.random() * 70
    const dx = Math.cos(ang) * dist
    const dy = Math.sin(ang) * dist
    s.style.setProperty('--dx', dx.toFixed(1) + 'px')
    s.style.setProperty('--dy', dy.toFixed(1) + 'px')
    s.style.setProperty('--sc', Math.random() < 0.3 ? '#ffffff' : props.rarity.color)
    s.style.left = x + 'px'
    s.style.top = y + 'px'
    el.appendChild(s)
    setTimeout(() => s.remove(), 680)
  }
}

function onClick() {
  burst()
  emit('open', props.item)
}
</script>

<template>
  <article
    ref="root"
    class="item"
    :class="{ aged: rarityKey === 'worn' }"
    :style="{
      '--rc': rarity.color,
      '--rglow': rarity.frameGlow,
      '--rtint': rarity.tint,
      '--i': index
    }"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @click="onClick"
  >
    <div class="frame">
      <img class="art" :src="item.thumbnail" :alt="item.title" loading="lazy" draggable="false" />
      <span class="art-tint"></span>
      <span class="scan"></span>

      <span class="gem" :style="{ background: rarity.color, boxShadow: '0 0 12px ' + rarity.color }">
        <i class="bx" :class="GEM_ICON[rarityKey] || 'bx-cube'"></i>
      </span>
    </div>

    <div class="info">
      <div class="meta">
        <span class="cat-label" :style="{ color: rarity.color }">{{ rarity.cat }}</span>
        <span class="ver"><i class="bx bx-chip"></i> {{ rarity.weight }}</span>
      </div>

      <h3 class="name">{{ item.title }}</h3>

      <div class="tags">
        <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
      </div>
    </div>

    <div class="foot">
      <span class="tier">
        <i
          v-for="n in 5"
          :key="n"
          class="tier-dot"
          :class="{ on: n <= TIER[rarityKey] }"
          :style="n <= TIER[rarityKey] ? { background: rarity.color, boxShadow: '0 0 6px ' + rarity.color } : {}"
        ></i>
      </span>
      <span class="build"><i class="bx bx-code-block"></i> {{ BUILD[rarityKey] || 'v0.1' }}</span>
    </div>
  </article>
</template>

<style scoped>
.item {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--panel-hi), var(--bg-1));
  overflow: hidden;
  cursor: pointer;
  transform-style: preserve-3d;
  will-change: transform;
  transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 0.16s ease-out, box-shadow 0.3s ease, border-color 0.3s ease;
  animation: popIn 0.55s cubic-bezier(0.22, 0.9, 0.3, 1.2) both;
  animation-delay: calc(var(--i, 0) * 45ms);
}
@keyframes popIn {
  from { opacity: 0; transform: perspective(900px) translateY(28px) scale(0.9); }
}
.item:hover {
  transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(-6px);
  border-color: var(--rc);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.5), 0 0 24px var(--glow-soft);
}
.item:active { transform: perspective(900px) translateY(-2px) scale(0.98); }
.item::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px dashed var(--line-strong);
  border-radius: 10px;
  opacity: 0.35;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.item:hover::after { opacity: 0.7; }

/* Cursor-follow glow ring */
.item::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), var(--glow-soft), transparent 65%);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.item:hover::before { opacity: 1; }

/* Sparks */
.spark {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sc);
  pointer-events: none;
  z-index: 40;
  animation: sparkFly 0.66s cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
}
@keyframes sparkFly {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); }
}

/* Art frame */
.frame {
  position: relative;
  flex: none;
  height: 175px;
  margin: 10px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--bg-0);
}
.art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.item:hover .art { transform: scale(1.12); }
.art-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--rtint), transparent 55%);
  mix-blend-mode: overlay;
  opacity: 0.8;
}
.scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 32%, rgba(255, 255, 255, 0.16) 50%, transparent 68%);
  transform: translateX(-140%);
  transition: transform 0.65s ease;
  mix-blend-mode: screen;
}
.item:hover .scan { transform: translateX(140%); }

.gem {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #000;
  border: 2px solid var(--bg-0);
  animation: gemPulse 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.33s);
}
@keyframes gemPulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.16); filter: brightness(1.35); }
}
.cat-label {
  font-family: var(--font-orbitron);
  text-transform: uppercase;
  opacity: 0.8;
}

/* Body */
.info {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 16px 8px;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ver {
  font-family: var(--font-hud);
  font-size: 12px;
  color: var(--rc);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.name {
  font-family: var(--font-hud);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.3px;
  line-height: 1.3;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}
.item:hover .name { color: var(--rc); }

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-family: var(--font-hud);
  font-size: 11px;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-dim);
  background: var(--bg-0);
}

/* Footer */
.foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 16px;
  border-top: 1px solid var(--line);
  background: var(--bg-1);
}
.tier {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.tier-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  transform: rotate(45deg);
  background: var(--line-strong);
  opacity: 0.45;
  transition: opacity 0.2s ease;
}
.tier-dot.on { opacity: 1; }
.item:hover .tier-dot.on { opacity: 1; transform: rotate(45deg) scale(1.25); }
.build {
  font-family: var(--font-hud);
  font-size: 12px;
  color: var(--text-dim);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.build i { color: var(--rc); }

/* Worn items look aged */
.item.aged .art { filter: saturate(0.5) brightness(0.85) sepia(0.18); }
.item.aged:hover .art { filter: saturate(0.7) brightness(0.95); }

</style>

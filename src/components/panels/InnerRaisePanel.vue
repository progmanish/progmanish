<script setup>
import { computed, ref } from 'vue'
import { useSkillTree } from '../../composables/useSkillTree'
import { playUnlock, playDeny } from '../../utils/sfx'
import { tell } from '../../stores/companion'

const props = defineProps({
  data: { type: Object, required: true }
})

const tree = computed(() => props.data.skillTree)
const branches = computed(() => tree.value?.branches || [])
const skillTree = useSkillTree()

const allNodes = computed(() => branches.value.flatMap((b) => b.nodes))
const starCount = computed(() => allNodes.value.length)
const litStars = computed(() => allNodes.value.filter((n) => skillTree.isUnlocked(n.name)).length)
const unlockedNodes = computed(() => allNodes.value.filter((n) => skillTree.isUnlocked(n.name)))
const average = computed(() => {
  const list = unlockedNodes.value
  return list.length ? Math.round(list.reduce((s, n) => s + (n.level || 0), 0) / list.length) : 0
})

const rank = computed(() => {
  if (average.value >= 85) return { label: 'Master', color: '#ffd700' }
  if (average.value >= 75) return { label: 'Senior', color: '#7fd8ff' }
  if (average.value >= 60) return { label: 'Intermediate', color: '#b07bff' }
  if (average.value >= 45) return { label: 'Junior', color: '#d4af37' }
  return { label: 'Beginner', color: '#9a8f79' }
})

const selected = ref(null)
const flashing = ref(new Set())
const shaking = ref(new Set())
const carousel = ref(null)
const activeBranch = ref(0)

function scrollToBranch(i) {
  const el = carousel.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  activeBranch.value = i
}

function onCarouselScroll() {
  const el = carousel.value
  if (!el) return
  const i = Math.round(el.scrollLeft / el.clientWidth)
  if (i >= 0 && i < branches.value.length && i !== activeBranch.value) activeBranch.value = i
}

function stateOf(b, n) {
  const un = skillTree.isUnlocked(n.name)
  const ready = skillTree.isReady(b.nodes, n.name)
  return { un, ready, locked: !un && !ready }
}

function prevUnlocked(b, ni) {
  return skillTree.isUnlocked(b.nodes[ni - 1].name)
}

function pick(node) {
  selected.value = node
}

function flash(name) {
  flashing.value.add(name)
  setTimeout(() => flashing.value.delete(name), 900)
}

function shake(name) {
  shaking.value.add(name)
  setTimeout(() => shaking.value.delete(name), 420)
}

function onStarHover(b, n) {
  if (stateOf(b, n).locked) return
  pick(n)
}

function onStarClick(b, n) {
  const st = stateOf(b, n)
  if (st.locked) {
    playDeny()
    shake(n.name)
    return
  }
  if (st.ready && skillTree.unlock(n.name)) {
    playUnlock()
    flash(n.name)
    tell('skill_unlock', n.name)
  }
  pick(n)
}

const selectedMeta = computed(() => {
  if (!selected.value) return null
  for (const b of branches.value) {
    const n = b.nodes.find((x) => x.name === selected.value.name)
    if (n) return { node: n, color: b.color, branch: b.name }
  }
  return null
})

function branchAvg(b) {
  return b.nodes.length ? Math.round(b.nodes.reduce((s, n) => s + (n.level || 0), 0) / b.nodes.length) : 0
}

function masteryClass(level) {
  if (level >= 85) return { label: 'Mastered', color: '#ffd700' }
  if (level >= 70) return { label: 'Expert', color: '#7fd8ff' }
  if (level >= 50) return { label: 'Skilled', color: '#b07bff' }
  return { label: 'Apprentice', color: '#9a8f79' }
}
</script>

<template>
  <div class="innerraise panel">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>

    <div class="sky-area">
      <div class="starfield" aria-hidden="true"></div>

      <header class="sa-head">
        <div class="sa-titlebox">
          <div class="sa-kicker">
            <span class="sa-prompt">&gt;</span>
            <span class="eyebrow">INNER-RAISE</span>
          </div>
          <h2 class="head-name">PROGRESS PATH</h2>
          <p class="sa-sub">// Five constellations · unlock the path, one star at a time</p>
        </div>

        <div class="rank-card">
          <div class="rank-top">
            <span class="eyebrow">LEVEL</span>
            <strong class="rank-name" :style="{ color: rank.color }">{{ rank.label }}</strong>
          </div>
          <div class="rank-bottom">
            <div class="rank-bar">
              <div class="rank-fill" :style="{ width: average + '%', background: rank.color }"></div>
            </div>
            <div class="rank-meta">
              <span><i class="bx bxs-star"></i> {{ litStars }}/{{ starCount }}</span>
              <span>{{ average }}%</span>
            </div>
          </div>
        </div>
      </header>

      <div class="br-switch">
        <button
          v-for="(b, i) in branches"
          :key="b.id"
          class="br-dot"
          :class="{ on: activeBranch === i }"
          :style="{ '--bc': b.color }"
          :aria-label="b.name"
          :title="b.name"
          @click="scrollToBranch(i)"
        >
          <i :class="b.icon"></i>
        </button>
      </div>

      <div ref="carousel" class="constellations" @scroll="onCarouselScroll">
        <section
          v-for="b in branches"
          :key="b.id"
          class="constellation"
          :style="{ '--cc': b.color }"
        >
          <header class="const-head">
            <span class="const-sigil"><i :class="b.icon"></i></span>
            <div class="const-titles">
              <h3 class="const-name">{{ b.name }}</h3>
              <p class="const-desc">{{ b.desc }}</p>
            </div>
            <span class="const-avg">{{ branchAvg(b) }}</span>
          </header>

          <div class="stars">
            <template v-for="(n, ni) in b.nodes" :key="n.name">
              <span
                v-if="ni > 0"
                class="star-link"
                :class="{ on: prevUnlocked(b, ni) }"
              ></span>
              <button
                class="star"
                :class="{
                  lit: stateOf(b, n).un,
                  ready: stateOf(b, n).ready,
                  locked: stateOf(b, n).locked,
                  flash: flashing.has(n.name),
                  shake: shaking.has(n.name),
                  selected: !stateOf(b, n).locked && selected && selected.name === n.name
                }"
                :style="{ '--p': stateOf(b, n).un ? n.level : 0 }"
                @click="onStarClick(b, n)"
                @mouseenter="onStarHover(b, n)"
              >
                <span class="star-ring">
                  <span class="star-core"><i :class="n.icon"></i></span>
                </span>
                <span class="star-name">{{ n.name }}</span>
                <span class="star-lvl">
                  <i v-if="stateOf(b, n).locked" class="bx bxs-lock-alt"></i>
                  <template v-else>{{ n.level }}%</template>
                </span>
              </button>
            </template>
          </div>
        </section>
      </div>
    </div>

    <aside class="detail-area">
      <div v-if="selectedMeta" class="detail" :style="{ '--dc': selectedMeta.color }">
        <div class="det-head">
          <span class="det-orbit" :style="{ '--p': selectedMeta.node.level }">
            <span class="det-core"><i :class="selectedMeta.node.icon"></i></span>
          </span>
          <div class="det-titles">
            <span class="eyebrow" :style="{ color: selectedMeta.color }">{{ selectedMeta.branch }}</span>
            <h3 class="det-name" :style="{ color: selectedMeta.color }">{{ selectedMeta.node.name }}</h3>
            <span class="det-class" :style="{ color: masteryClass(selectedMeta.node.level).color }">
              <i class="bx bxs-badge-check"></i> {{ masteryClass(selectedMeta.node.level).label }}
            </span>
          </div>
        </div>

        <p class="det-desc">{{ selectedMeta.node.desc }}</p>

        <div class="det-stat">
          <div class="ds-head">
            <span class="hud-label">STARLIGHT</span>
            <span class="ds-val" :style="{ color: selectedMeta.color }">{{ selectedMeta.node.level }}%</span>
          </div>
          <div class="bar">
            <div class="bar-fill" :style="{ width: selectedMeta.node.level + '%' }"></div>
          </div>
        </div>
      </div>

      <div v-else class="detail empty">
        <span class="empty-star">✦</span>
        <p>Reach for a star<br />to read its story.<br /><em>Locked stars need the one before them.</em></p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.root, .innerraise {
  --mono: 'Consolas', 'Cascadia Mono', 'JetBrains Mono', 'SF Mono', monospace;
}

.innerraise {
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 480px;
  overflow: hidden;
  background: linear-gradient(180deg, var(--panel-solid), var(--panel));
}

.corner { position: absolute; width: 16px; height: 16px; z-index: 6; pointer-events: none; opacity: 0.9; }
.corner.tl { top: 8px; left: 8px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.tr { top: 8px; right: 8px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); }
.corner.bl { bottom: 8px; left: 8px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }

/* ---------- Head ---------- */
.sa-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(16px, 2.4vw, 24px) clamp(18px, 3vw, 28px);
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, var(--bg-1), transparent);
}
.sa-titlebox { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.sa-kicker { display: flex; align-items: center; gap: 8px; }
.sa-prompt { font-family: var(--mono); color: var(--accent); font-size: 16px; }
.eyebrow { font-family: var(--font-orbitron); font-size: 10px; letter-spacing: 3px; color: var(--text-dim); }
.head-name {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent);
  text-shadow: 0 0 18px var(--glow);
}
.sa-sub {
  width: 100%; margin-top: 6px; color: var(--text-dim); font-family: var(--mono); font-size: 12px; opacity: 0.8;
}

.rank-card {
  width: 400px;
  min-width: 400px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
  backdrop-filter: blur(6px);
}
.rank-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.rank-name {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 1px;
  text-shadow: 0 0 14px currentColor;
}
.rank-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rank-bar {
  height: 7px;
  background: var(--bg-2);
  border-radius: 6px;
  overflow: hidden;
}
.rank-fill { height: 100%; border-radius: 6px; transition: width 0.8s ease; }
.rank-meta {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-orbitron);
  font-size: 10px;
  color: var(--text-dim);
}
.rank-meta i { color: var(--accent); }

/* ---------- Sky ---------- */
.sky-area {
  position: relative;
  overflow-y: auto;
  min-height: 0;
}

.starfield {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 18%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 68% 9%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1.5px 1.5px at 34% 34%, rgba(255, 255, 255, 0.35), transparent),
    radial-gradient(1px 1px at 82% 28%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 45% 55%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1.5px 1.5px at 90% 58%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 22% 72%, rgba(255, 255, 255, 0.35), transparent),
    radial-gradient(1px 1px at 58% 82%, rgba(255, 255, 255, 0.45), transparent),
    radial-gradient(1.5px 1.5px at 74% 92%, rgba(255, 255, 255, 0.3), transparent);
}

.hud-label {
  font-family: var(--font-orbitron);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-dim);
  text-transform: uppercase;
}

/* ---------- Constellations ---------- */
.constellations {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
  padding: 28px;
}

.constellation {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 16px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background:
    radial-gradient(120% 90% at 50% 0%, var(--glow-soft), transparent 60%),
    linear-gradient(180deg, var(--panel-hi), transparent);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.constellation:hover {
  border-color: var(--cc);
  box-shadow: 0 0 22px var(--glow-soft);
  transform: translateY(-2px);
}

.const-head {
  display: flex;
  align-items: center;
  gap: 11px;
}
.const-sigil {
  flex: none;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--cc);
  border-radius: 12px;
  font-size: 19px;
  color: var(--cc);
  background: linear-gradient(160deg, var(--glow-soft), transparent);
  box-shadow: 0 0 12px var(--glow-soft);
}
.const-titles { flex: 1; min-width: 0; }
.const-name {
  font-family: var(--font-hud);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text);
}
.constellation:hover .const-name { color: var(--cc); }
.const-desc {
  font-family: var(--font-hud);
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
  line-height: 1.4;
}
.const-avg {
  font-family: var(--font-orbitron);
  font-size: 12px;
  font-weight: 700;
  color: var(--cc);
  text-shadow: 0 0 8px var(--cc);
}

/* ---------- Stars ---------- */
.stars {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding-top: 4px;
}

.star-link {
  width: 2px;
  height: 24px;
  background: repeating-linear-gradient(180deg, var(--cc) 0 3px, transparent 3px 7px);
  opacity: 0.45;
  transition: opacity 0.25s ease, filter 0.25s ease;
}
.star-link.on {
  opacity: 1;
  filter: drop-shadow(0 0 5px var(--cc));
}

.star {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 12px;
  transition: transform 0.22s ease;
}
.star:hover { transform: translateY(-3px); }
.star.locked {
  cursor: not-allowed;
  filter: grayscale(1) brightness(0.62);
  opacity: 0.72;
}
.star.locked:hover { transform: none; }
.star.locked .star-name,
.star.locked .star-lvl { color: var(--text-dim); }

.star.shake { animation: star-shake 0.4s ease; }

@keyframes star-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.star-ring {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: conic-gradient(var(--cc) calc(var(--p) * 1%), rgba(255, 255, 255, 0.07) 0);
  display: grid;
  place-items: center;
  transition: filter 0.25s ease, transform 0.25s ease;
}
.star-ring::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--bg-1);
}

.star:not(.lit) .star-ring {
  filter: saturate(0.3) brightness(0.75);
  opacity: 0.8;
}
.star:not(.lit) .star-link {
  opacity: 0.22;
}

.star.ready { cursor: pointer; }
.star.ready .star-ring {
  filter: saturate(0.75) brightness(1.02);
  animation: ready-pulse 1.5s ease-in-out infinite;
}
.star.ready .star-ring::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid var(--cc);
  animation: ready-ring 1.5s ease-out infinite;
  pointer-events: none;
}
.star.ready .star-name { color: var(--text); }

@keyframes ready-pulse {
  0%, 100% { box-shadow: 0 0 2px var(--glow-soft); }
  50% { box-shadow: 0 0 14px var(--glow-soft); }
}
@keyframes ready-ring {
  0% { transform: scale(0.7); opacity: 0.9; }
  100% { transform: scale(1.35); opacity: 0; }
}

.star.flash .star-ring {
  animation: flash-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.star.flash .star-ring::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid var(--cc);
  box-shadow: 0 0 20px var(--cc);
  animation: burst-ring 0.7s ease-out both;
  pointer-events: none;
}

@keyframes flash-pop {
  0% { transform: scale(1); filter: saturate(0.5) brightness(0.9); }
  45% { transform: scale(1.22); filter: saturate(1.5) brightness(1.8); }
  100% { transform: scale(1); filter: saturate(1) brightness(1); }
}
@keyframes burst-ring {
  0% { transform: scale(0.4); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.star-core {
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 22px;
  color: var(--text-dim);
  background: radial-gradient(circle at 35% 28%, var(--glow-soft), var(--bg-0) 75%);
  box-shadow: inset 0 0 14px rgba(0, 0, 0, 0.55);
  transition: color 0.25s ease;
}
.star.lit .star-core { color: var(--cc); }

.star:hover .star-ring {
  transform: scale(1.06);
}
.star.lit:hover .star-ring {
  filter: drop-shadow(0 0 10px var(--cc));
}
.star.lit .star-ring::before {
  background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.14), transparent 70%), var(--bg-1);
}
.star.selected:not(.lit) .star-ring {
  filter: saturate(0.5) brightness(0.9);
}
.star.selected .star-ring {
  animation: star-pulse 1.9s ease-in-out infinite;
  filter: drop-shadow(0 0 16px var(--cc));
}

@keyframes star-pulse {
  0%, 100% { filter: drop-shadow(0 0 8px var(--cc)); }
  50% { filter: drop-shadow(0 0 24px var(--cc)); }
}

.star-name {
  font-family: var(--font-hud);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-align: center;
  color: var(--text-dim);
  max-width: 120px;
  line-height: 1.25;
  transition: color 0.25s ease;
}
.star.lit .star-name { color: var(--text); }
.star.selected .star-name { color: var(--cc); }

.star-lvl {
  font-family: var(--font-orbitron);
  font-size: 10px;
  color: var(--text-dim);
}
.star.lit .star-lvl { color: var(--cc); }
.star.selected .star-lvl { text-shadow: 0 0 8px var(--cc); }

/* ---------- Detail ---------- */
.detail-area {
  border-left: 1px solid var(--line);
  padding: 20px;
  overflow-y: auto;
  background: linear-gradient(180deg, var(--glow-soft), transparent 40%);
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
  animation: rise-in 0.3s ease both;
}

.det-head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.det-orbit {
  position: relative;
  flex: none;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: conic-gradient(var(--dc) calc(var(--p) * 1%), rgba(255, 255, 255, 0.07) 0);
  display: grid;
  place-items: center;
  filter: drop-shadow(0 0 12px var(--dc));
}
.det-orbit::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--bg-1);
}
.det-core {
  position: relative;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 27px;
  color: var(--dc);
  background: radial-gradient(circle at 35% 28%, var(--glow-soft), var(--bg-0) 78%);
  box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.6);
}

.det-titles { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.det-name {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.5px;
  line-height: 1.2;
}
.det-class {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.det-desc {
  color: var(--text-dim);
  font-size: 13.5px;
  line-height: 1.7;
}

.det-stat { display: flex; flex-direction: column; gap: 8px; }
.ds-head { display: flex; justify-content: space-between; align-items: center; }
.ds-val { font-family: var(--font-orbitron); font-size: 15px; font-weight: 700; }

.bar {
  height: 8px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--dc), var(--dc));
  box-shadow: 0 0 10px var(--dc);
  transition: width 0.6s ease;
}

.empty {
  align-items: center;
  text-align: center;
  justify-content: center;
  color: var(--text-dim);
  min-height: 240px;
  gap: 12px;
}
.empty-star {
  font-size: 40px;
  color: var(--accent);
  text-shadow: 0 0 18px var(--glow);
  animation: spin-slow 12s linear infinite;
  display: inline-block;
}
.empty p { font-size: 13px; line-height: 1.6; }

.br-switch { display: none; }

@media (max-width: 900px) {
  .innerraise { grid-template-columns: 1fr; overflow-y: auto; }
  .detail-area { border-left: none; border-top: 1px solid var(--line); }
}

@media (max-width: 760px) {
  .innerraise { display: block; overflow: hidden; position: relative; }
  .sky-area { height: 100%; }
  .eyebrow, .sa-sub { display: none; }
  .sa-prompt { display: none;}
  .sa-titlebox h2 { font-size: 22px; padding-top: 1px; }

  .rank-card { display: none; }

  .br-switch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 0 10px;
  }
  .br-dot {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    font-size: 16px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--bg-0);
    color: var(--text-dim);
    transition: all 0.2s ease;
  }
  .br-dot.on {
    color: var(--bc, var(--accent));
    border-color: var(--bc, var(--accent));
    background: linear-gradient(160deg, var(--glow-soft), transparent);
    box-shadow: 0 0 12px var(--glow-soft);
  }

  .constellations {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
    padding: 0 0;
    scrollbar-width: none;
  }
  .constellations::-webkit-scrollbar { display: none; }
  .constellation {
    flex: none;
    width: 100%;
    scroll-snap-align: start;
    padding: 20px;
    gap: 12px;
    border-radius: 16px;
  }
  .constellation:hover { transform: none; }
  .const-head { gap: 10px; }
  .const-sigil { width: 34px; height: 34px; font-size: 17px; border-radius: 10px; }
  .const-name { font-size: 13px; letter-spacing: 1px; }
  .const-desc { display: none; }
  .const-avg { font-size: 12px; }

  .star-link { width: 2px; height: 18px; }
  .star-ring { width: 48px; height: 48px; }
  .star-core { width: 40px; height: 40px; font-size: 18px; }
  .star-name { font-size: 11px; max-width: 130px; }
  .star-lvl { font-size: 9px; }

  .detail-area {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 10px;
    z-index: 5;
    padding: 0;
    border-left: none;
    border-top: none;
    overflow: visible;
    background: none;
  }
  .detail {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--panel-solid);
    box-shadow: 0 0 24px rgba(0, 0, 0, 0.45);
  }
  .det-head { flex: 1 1 45%; min-width: 0; gap: 10px; }
  .det-orbit { width: 42px; height: 42px; }
  .det-core { width: 34px; height: 34px; font-size: 17px; }
  .det-name { font-size: 13px; }
  .det-class { font-size: 10px; letter-spacing: 1px; }
  .det-desc {
    flex: 1 1 50%;
    min-width: 0;
    font-size: 12px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .det-stat { display: none; }
  .empty {
    min-height: 0;
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    gap: 10px;
    padding: 10px 14px;
  }
  .empty-star { font-size: 20px; }
  .empty p { font-size: 12px; }

.corner { display: none; position: absolute; width: 16px; height: 16px; z-index: 6; pointer-events: none; opacity: 0.9; }
}

@media (max-width: 560px) {
  .sky-area { padding: 12px 12px calc(130px + env(safe-area-inset-bottom, 0px)); }
}
</style>

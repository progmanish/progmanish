<script setup>
import { computed } from 'vue'
import { useSound } from '../stores/sound'

const props = defineProps({
  user: { type: Object, required: true },
  appearance: { type: Object, required: true },
  contact: { type: Object, required: true }
})

const { beat } = useSound()

const stats = computed(() => props.appearance.stats || [])
const gear = computed(() => props.appearance.gear || [])

const particles = computed(() =>
  Array.from({ length: 26 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i * 0.7) % 6}s`,
    dur: `${5 + (i % 5)}s`,
    size: `${2 + (i % 3)}px`
  }))
)

const rank = computed(() => {
  const total = stats.value.reduce((s, st) => s + st.value, 0)
  const avg = stats.value.length ? Math.round(total / stats.value.length) : 0
  return avg
})
</script>

<template>
  <div class="portrait" :class="['tier-' + Math.floor(rank / 25)]">
    <div class="stage" :style="{ '--pulse': 0.55 + beat * 0.45 }">
      <div class="silhouette-wrap">
        <svg viewBox="0 0 240 320" class="silhouette" aria-hidden="true">
          <defs>
            <linearGradient id="auraGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-bright)" stop-opacity="0.95" />
              <stop offset="55%" stop-color="var(--accent)" stop-opacity="0.5" />
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.08" />
            </linearGradient>
            <radialGradient id="haloGrad">
              <stop offset="0%" stop-color="var(--accent-bright)" stop-opacity="0.7" />
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle cx="120" cy="118" r="86" fill="url(#haloGrad)" />
          <path
            fill="url(#auraGrad)"
            d="M120 16c18 0 32 14 32 32 0 11-6 20-15 25v14c20 8 34 24 34 43l-2 40 6 96 4 26c2 12-8 22-20 22h-78c-12 0-22-10-20-22l4-26 6-96-2-40c0-19 14-35 34-43v-14c-9-5-15-14-15-25 0-18 14-32 32-32z"
          />
        </svg>
      </div>

      <div class="frame">
        <img
          class="face"
          :src="'images/profile_pic.png'"
          :alt="user.name + ' portrait'"
          draggable="false"
        />
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>
      </div>

      <span
        v-for="(p, i) in particles"
        :key="i"
        class="particle"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, width: p.size, height: p.size }"
      ></span>
    </div>

    <div class="nameplate">
      <div class="np-top">
        <span class="hud-label">{{ appearance.characterClass }}</span>
        <span class="np-level">{{ appearance.level }}</span>
      </div>
      <h2 class="np-name">{{ appearance.nameplate || user.name }}</h2>
      <div class="np-aura">
        <i class="bx bxs-zap"></i>
        {{ appearance.aura }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.portrait {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 8px;
}

.stage {
  position: relative;
  width: min(38vh, 300px);
  aspect-ratio: 3 / 4;
  animation: float-y 7s ease-in-out infinite;
}

.silhouette-wrap {
  position: absolute;
  inset: 4% 0 6% 0;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 calc(24px * var(--pulse)) var(--glow));
}

.silhouette {
  width: 100%;
  height: 100%;
  animation: spin-slow 0s none;
  opacity: 0.9;
}

.frame {
  position: absolute;
  inset: 12% 18% 14% 18%;
  border: 2px solid var(--line-strong);
  outline: 1px solid var(--line);
  outline-offset: 5px;
  border-radius: 46% 46% 42% 42% / 40% 40% 46% 46%;
  box-shadow: 0 0 calc(18px * var(--pulse)) var(--glow), inset 0 0 30px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  background: var(--bg-0);
}

.face {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  opacity: 0.94;
  transition: transform 0.4s ease;
}
.frame:hover .face { transform: scale(1.04); }

.corner {
  position: absolute;
  width: 26px;
  height: 26px;
  border: 3px solid var(--accent);
  box-shadow: 0 0 8px var(--glow);
}
.corner.tl { top: -3px; left: -3px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
.corner.tr { top: -3px; right: -3px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
.corner.bl { bottom: -3px; left: -3px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
.corner.br { bottom: -3px; right: -3px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }

.particle {
  position: absolute;
  border-radius: 50%;
  background: var(--accent-bright);
  box-shadow: 0 0 8px var(--accent);
  opacity: 0;
  animation: floatP ease-in-out infinite;
}

@keyframes floatP {
  0% { transform: translateY(30px); opacity: 0; }
  20% { opacity: 0.9; }
  80% { opacity: 0.5; }
  100% { transform: translateY(-60px); opacity: 0; }
}

.nameplate {
  width: min(100%, 340px);
  text-align: center;
  padding: 14px 18px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--panel), var(--panel-solid));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 30px var(--glow-soft);
  position: relative;
}

.nameplate::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 12%;
  right: 12%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-bright), transparent);
  box-shadow: 0 0 10px var(--glow);
}

.np-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.np-level {
  font-family: var(--font-orbitron);
  font-size: 13px;
  color: var(--accent);
  text-shadow: 0 0 10px var(--glow);
}

.np-name {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.4vw, 28px);
  letter-spacing: 3px;
  color: var(--text);
  text-shadow: 0 0 18px var(--glow);
}

.np-aura {
  margin-top: 8px;
  font-family: var(--font-hud);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>

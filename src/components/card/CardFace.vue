<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
  appearance: { type: Object, required: true },
  contact: { type: Object, required: true },
  side: { type: String, default: 'front' }
})

const socials = computed(() => Object.entries(props.contact?.social || {}))

function handleFor(url) {
  if (!url) return ''
  const clean = url.replace(/\/+$/, '')
  return clean.slice(clean.lastIndexOf('/') + 1)
}
</script>

<template>
  <div class="card-face" :class="side">
    <span class="card-sheen"></span>

    <template v-if="side === 'front'">
      <div class="c-top">
        <span class="c-logo"><i class="bx bxs-game"></i> {{ user.logo || 'progmanish' }}</span>
        <span class="hud-label c-kicker">LEGENDARY ID</span>
      </div>

      <div class="c-main">
        <div class="c-portrait">
          <img :src="'images/profile_pic.png'" :alt="(appearance.nameplate || user.name) + ' portrait'" draggable="false" />
        </div>

        <div class="c-info">
          <div class="c-name">{{ appearance.nameplate || user.name }}</div>
          <div class="c-lv-row">
            <span class="c-lv">{{ appearance.level }}</span>
            <span class="c-class">{{ appearance.characterClass }}</span>
          </div>
          <div class="c-code">PROMNS · 2049 · WANDERER</div>
        </div>

        <span class="c-chip" aria-hidden="true"></span>
      </div>

      <p class="c-whoami">{{ user.slogan }}</p>

      <div class="c-foot">
        <span class="hud-label">PROGMANISH © {{ new Date().getFullYear() }}</span>
        <span class="c-wanderer">THE WANDERER</span>
      </div>
    </template>

    <template v-else>
      <span class="c-mono" aria-hidden="true">G</span>

      <div class="c-top">
        <span class="c-logo"><i class="bx bxs-game"></i> {{ user.logo || 'progmanish' }}</span>
        <span class="hud-label c-kicker">CONTACT</span>
      </div>

      <div class="c-stripe" aria-hidden="true"></div>

      <div class="c-back-body">
        <div class="c-contact">
          <a v-if="contact?.email" class="c-row" :href="'mailto:' + contact.email" title="Email">
            <i class="bx bx-mail-send"></i>
            <span class="c-val">{{ contact.email }}</span>
          </a>
          <a v-if="contact?.phone" class="c-row" :href="'tel:' + contact.phone.replace(/\s/g, '')" title="Call">
            <i class="bx bxs-phone"></i>
            <span class="c-val">{{ contact.phone }}</span>
          </a>
          <div v-if="contact?.location" class="c-row">
            <i class="bx bxs-map-pin"></i>
            <span class="c-val">{{ contact.location }}</span>
          </div>
        </div>

        <div class="c-guilds">
          <span class="hud-label c-guild-head">GUILDS</span>
          <a
            v-for="[key, href] in socials"
            :key="key"
            class="c-soc"
            :href="href"
            target="_blank"
            rel="noopener"
          >
            <i class="bx" :class="'bxl-' + key"></i>
            <span>@{{ handleFor(href) }}</span>
          </a>
        </div>
      </div>

      <div class="c-foot">
        <span class="hud-label">THE WANDERER</span>
        <span class="c-wanderer">EST. {{ new Date().getFullYear() }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card-face {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 10px 10px;
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.55);
  box-shadow:
    0 16px 34px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(0, 0, 0, 0.4),
    inset 0 0 22px rgba(212, 175, 55, 0.08);
  background:
    radial-gradient(120% 90% at 12% 0%, rgba(212, 175, 55, 0.16), transparent 55%),
    linear-gradient(160deg, #1b1510 0%, #0c0b13 48%, #141322 100%);
  overflow: hidden;
  backface-visibility: hidden;
}

.card-face.back { transform: rotateY(180deg); }

.card-sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 235, 180, 0.09) 42%, transparent 55%);
}

.c-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1.5px dashed rgba(212, 175, 55, 0.3);
}

.c-logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent-bright);
  text-shadow: 0 0 10px var(--glow);
}
.c-logo i { font-size: 9.5px; }

.c-kicker {
  color: var(--accent);
  font-size: 6px;
  letter-spacing: 2px;
}

/* ---------- front main ---------- */
.c-main {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 10px 0 0px;
  flex: none;
}

.c-portrait {
  position: relative;
  flex: none;
  width: clamp(60px, 30%, 150px);
  aspect-ratio: 4 / 5;
  background: #000;
  filter: drop-shadow(0 0 14px var(--glow));
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='420' viewBox='0 0 320 420'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.035' numOctaves='3' seed='11' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='34' xChannelSelector='R' yChannelSelector='G'/%3E%3CfeGaussianBlur stdDeviation='3'/%3E%3C/filter%3E%3Cpath fill='%23ffffff' filter='url(%23r)' d='M160 6 C214 16 258 52 272 108 C286 166 268 224 240 272 C212 318 164 348 118 338 C74 330 38 296 24 246 C10 196 20 140 52 96 C84 54 122 2 160 6 Z'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='420' viewBox='0 0 320 410'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.039' numOctaves='89' seed='722' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='110' xChannelSelector='R' yChannelSelector='G'/%3E%3CfeGaussianBlur stdDeviation='3'/%3E%3C/filter%3E%3Cpath fill='%23ffffff' filter='url(%23r)' d='M160 6 C214 16 258 52 272 108 C286 166 268 224 240 272 C212 318 164 348 118 338 C74 330 38 296 24 246 C10 196 20 140 52 96 C84 54 122 2 160 6 Z'/%3E%3C/svg%3E");
  -webkit-mask-size: 110% 110%;
  mask-size: 110% 110%;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

.c-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 16%;
  display: block;
}

.c-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
}

.c-name {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: 600;
  color: var(--text);
  text-shadow: 0 0 12px var(--glow);
  overflow-wrap: anywhere;
}

.c-lv-row {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-wrap: wrap;
}

.c-lv {
  flex: none;
  padding: 0px 4px;
  border: 1px solid var(--accent);
  border-radius: 5px;
  background: var(--glow-soft);
  font-family: var(--font-orbitron);
  letter-spacing: 1px;
  color: var(--accent-bright);
  text-shadow: 0 0 8px var(--glow);
  box-shadow: inset 0 0 8px var(--glow-soft);
}

.c-class {
  font-family: var(--font-hud);
  letter-spacing: 0.5px;
  padding-top: 3px;
  color: var(--text-dim);
}

.c-code {
  font-family: var(--font-orbitron);
  letter-spacing: 1px;
  color: rgba(212, 175, 55, 0.75);
}

.c-chip {
  flex: none;
  width: 34px;
  height: 25px;
  border-radius: 5px;
  background: linear-gradient(135deg, #e8c65c, #b8922e 55%, #8a6a1f);
  border: 1px solid rgba(255, 235, 180, 0.4);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.5), inset 0 0 4px rgba(0, 0, 0, 0.35);
  position: relative;
}
.c-chip::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 3px;
  border: 1px solid rgba(120, 90, 20, 0.65);
  background: repeating-linear-gradient(90deg, transparent 0 3px, rgba(120, 90, 20, 0.4) 3px 4px);
}

.c-whoami {
  font-family: var(--font-hud);
  color: var(--text);
  position: relative;
  padding-bottom: 5px;
  line-height: 20px;
  opacity: 0.2;
  padding-left: 15px;
}

.c-foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 5px;
  border-top: 1.5px dashed rgba(212, 175, 55, 0.3);
}
.c-foot .hud-label { font-size: 5px; letter-spacing: 1.3px; color: var(--text-dim); }

.c-wanderer {
  font-family: var(--font-orbitron);
  font-size: 5.5px;
  letter-spacing: 1.4px;
  color: var(--accent);
}

/* ---------- back ---------- */
.c-mono {
  position: absolute;
  right: -6px;
  bottom: -20px;
  font-family: var(--font-display);
  font-size: 150px;
  font-weight: 600;
  line-height: 1;
  color: rgba(212, 175, 55, 0.07);
  user-select: none;
  pointer-events: none;
}

.c-stripe {
  height: 18px;
  margin: 10px -16px 10px;
  background: linear-gradient(180deg, #000, #1a1a1a);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
}

.c-back-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 6px;
  align-items: stretch;
  padding-left: 25px;
}

.c-contact {
  flex: 1;
  min-width: 280px;
  font-size: 3px;
  display: inline-flex;
  flex-direction: column;
  gap: 5px;
}

.c-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  text-decoration: none;
  transition: all 0.2s ease;
  min-width: 0;
}
.c-row:hover { border-color: var(--accent); box-shadow: 0 0 10px var(--glow-soft); }
.c-row i { font-size: 7px; color: var(--accent); flex: none; }

.c-val {
  flex: 1;
  font-family: var(--font-hud);
  font-size: 7px;
  color: var(--text);
  overflow-wrap: anywhere;
}

.c-guilds {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.c-guild-head {
  color: var(--accent);
  font-size: 6px;
  letter-spacing: 2px;
}

.c-soc {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  background: var(--glow-soft);
  font-family: var(--font-hud);
  font-size: 7px;
  color: var(--text-dim);
  text-decoration: none;
  width: fit-content;
  transition: all 0.2s ease;
}
.c-soc:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 10px var(--glow-soft);
  transform: translateX(2px);
}
.c-soc i { font-size: 9.5px; color: var(--accent); }

@media (prefers-reduced-motion: reduce) {
  .c-portrait img, .c-sheen { animation: none; }
}

@media (max-width: 480px) {
  .card-face { padding: 11px 13px 10px; }
  .c-top { padding-bottom: 6px; }
  .c-logo { font-size: 8px; }
  .c-kicker { font-size: 5.5px; }
  .c-main { gap: 12px; margin: 8px 0 7px; }
  .c-portrait { width: 60px; }
  .c-name { font-size: 8.5px; letter-spacing: 1px; }
  .c-lv { font-size: 5px; padding: 1px 4px; }
  .c-class { font-size: 6.5px; }
  .c-code { font-size: 5px; letter-spacing: 2px; }
  .c-chip { width: 28px; height: 21px; }
  .c-whoami { font-size: 7px; line-height: 1.55; }
  .c-foot { padding-top: 6px; }
  .c-foot .hud-label { font-size: 4.5px; }
  .c-wanderer { font-size: 5px; }
  .c-stripe { height: 13px; margin: 8px -13px 8px; }
  .c-back-body { gap: 8px; }
  .c-row { padding: 3px 5px; gap: 5px; }
  .c-val { font-size: 7px; }
  .c-guilds { gap: 4px; }
  .c-guild-head { font-size: 5.5px; }
  .c-soc { font-size: 6.5px; padding: 2px 6px; }
}
</style>

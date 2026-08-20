<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSettings } from '../../composables/useSettings'
import { applyMusicSettings } from '../../stores/sound'

const props = defineProps({
  data: { type: Object, required: true }
})

const { settings, reset } = useSettings()
const tab = ref('audio')

const THEMES = [
  { id: 'east', label: 'Eastern', desc: 'Eastern gold · crimson ink', colors: ['#d4af37', '#c8102e', '#171209'] },
  { id: 'cyber', label: 'Neon', desc: 'Cyan circuits · electric rush', colors: ['#00ffe0', '#ff0055', '#15152a'] },
  { id: 'frost', label: 'Frost', desc: 'Icy resolve · frozen peaks', colors: ['#7fd8ff', '#4f9dff', '#0a1424'] },
  { id: 'minimal', label: 'Minimal', desc: 'Pure focus · clean lines', colors: ['#e8e8ea', '#909090', '#131316'] }
]

const MENU = [
  { id: 'audio', label: 'Audio', icon: 'bx-volume-full' },
  { id: 'display', label: 'Display', icon: 'bx-desktop' },
  { id: 'system', label: 'System', icon: 'bx-cog' },
  { id: 'contact', label: 'Contact', icon: 'bx-mail-send' }
]

const contact = computed(() => props.data.contact || {})

function setVolume(e) {
  settings.musicVolume = Number(e.target.value)
  applyMusicSettings()
}

function toggleMusic(on) {
  settings.music = on
  applyMusicSettings()
}

function setTheme(id) {
  settings.theme = id
}

function handleReset() {
  reset()
  applyMusicSettings()
}

const SAVE_KEYS = [
  'gamgineer.quests.v1',
  'gamgineer.contact.v1',
  'progmanish-skilltree-v1',
  'gamgineer.minigame.v1'
]

function handleSaveReset() {
  SAVE_KEYS.forEach((k) => localStorage.removeItem(k))
  location.reload()
}

function playTest() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'square'
    o.frequency.value = 440
    const v = 0.001 + (settings.musicVolume / 100) * 0.09
    g.gain.setValueAtTime(v, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16)
    o.start()
    o.stop(ctx.currentTime + 0.18)
    o.onended = () => { try { ctx.close() } catch {} }
  } catch {}
}

function onKeydown(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
  const idx = MENU.findIndex((m) => m.id === tab.value)
  if (idx === -1) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    tab.value = MENU[(idx + 1) % MENU.length].id
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    tab.value = MENU[(idx - 1 + MENU.length) % MENU.length].id
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="settings panel">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>

    <header class="s-head">
      <div class="s-title">
        <div class="s-kicker">
          <span class="s-prompt">&gt;</span>
          <span class="eyebrow">OPTIONS</span>
        </div>
        <h2 class="head-name">SETTINGS</h2>
        <p class="s-ver">// BUILD v2.0.0 · PROGMANISH.ENGINE</p>
      </div>
      <button class="reset-btn" @click="handleReset">
        <i class="bx bx-reset"></i> <span>RESTORE DEFAULTS</span>
      </button>
    </header>

    <div class="s-main">
      <aside class="s-nav">
        <div class="nav-kicker"><span class="hud-label">// MENU</span></div>
        <button
          v-for="(m, i) in MENU"
          :key="m.id"
          class="nav-item"
          :class="{ active: tab === m.id }"
          @click="tab = m.id"
        >
          <i class="bx" :class="m.icon"></i>
          <span class="n-label">{{ m.label }}</span>
          <span class="n-bar"></span>
        </button>

        <div class="nav-hint">
          <i class="bx bx-chevron-up"></i>
          <span class="hud-label">SELECT A CATEGORY</span>
          <i class="bx bx-chevron-down"></i>
        </div>
      </aside>

      <section class="s-content">
        <Transition name="tab" mode="out-in">
          <div :key="tab" class="tab-pane">
            <!-- AUDIO -->
            <template v-if="tab === 'audio'">
              <div class="g-head">
                <h3 class="g-title"><i class="bx bxs-volume-full"></i> Audio</h3>
                <span class="g-path">settings &gt; audio</span>
              </div>

              <div class="g-rows">
                <div class="row">
                  <div class="row-label"><i class="bx bx-music"></i><span>Music</span></div>
                  <div class="seg">
                    <button :class="{ on: !settings.music }" @click="toggleMusic(false)">OFF</button>
                    <button :class="{ on: settings.music }" @click="toggleMusic(true)">ON</button>
                  </div>
                </div>

                <div class="row">
                  <div class="row-label"><i class="bx bx-volume"></i><span>Music Volume</span></div>
                  <div class="vol-ctrl">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      :value="settings.musicVolume"
                      :style="{ '--fill': settings.musicVolume + '%' }"
                      @input="setVolume"
                    />
                    <span class="vol-val">{{ settings.musicVolume }}%</span>
                  </div>
                </div>

                <div class="row">
                  <div class="row-label"><i class="bx bx-bell"></i><span>Sound FX</span></div>
                  <div class="seg">
                    <button :class="{ on: !settings.fx }" @click="settings.fx = false">OFF</button>
                    <button :class="{ on: settings.fx }" @click="settings.fx = true">ON</button>
                  </div>
                </div>

                <div class="row">
                  <div class="row-label"><i class="bx bx-volume-low"></i><span>Test Tone</span></div>
                  <button class="test-btn" @click="playTest"><i class="bx bx-play"></i> PLAY TEST TONE</button>
                </div>
              </div>
            </template>

            <!-- DISPLAY -->
            <template v-else-if="tab === 'display'">
              <div class="g-head">
                <h3 class="g-title"><i class="bx bxs-palette"></i> Display</h3>
                <span class="g-path">settings &gt; display</span>
              </div>

              <div class="g-rows">
                <div class="row">
                  <div class="row-label"><i class="bx bx-sparkles"></i><span>Background FX</span></div>
                  <div class="seg">
                    <button :class="{ on: !settings.bgFx }" @click="settings.bgFx = false">OFF</button>
                    <button :class="{ on: settings.bgFx }" @click="settings.bgFx = true">ON</button>
                  </div>
                </div>

                <div class="row">
                  <div class="row-label"><i class="bx bx-wind"></i><span>Reduced Motion</span></div>
                  <div class="seg">
                    <button :class="{ on: !settings.reducedMotion }" @click="settings.reducedMotion = false">OFF</button>
                    <button :class="{ on: settings.reducedMotion }" @click="settings.reducedMotion = true">ON</button>
                  </div>
                </div>
              </div>

              <div class="g-sub">VISUAL PRESET</div>
              <div class="theme-grid">
                <button
                  v-for="t in THEMES"
                  :key="t.id"
                  class="theme-btn"
                  :class="{ active: settings.theme === t.id }"
                  @click="setTheme(t.id)"
                >
                  <span class="t-strip">
                    <i v-for="c in t.colors" :key="c" :style="{ background: c }"></i>
                    <span v-if="settings.theme === t.id" class="t-check"><i class="bx bx-check"></i></span>
                  </span>
                  <span class="t-meta">
                    <strong>{{ t.label }}</strong>
                    <small>{{ t.desc }}</small>
                  </span>
                </button>
              </div>
            </template>

            <!-- SYSTEM -->
            <template v-else-if="tab === 'system'">
              <div class="g-head">
                <h3 class="g-title"><i class="bx bxs-cog"></i> System</h3>
                <span class="g-path">settings &gt; system</span>
              </div>

              <div class="sys-card">
                <div class="sys-line"><span class="sys-k">ENGINE</span><span class="sys-v">PROGMANISH.ENGINE</span></div>
                <div class="sys-line"><span class="sys-k">BUILD</span><span class="sys-v">v2.0.0</span></div>
                <div class="sys-line"><span class="sys-k">PROFILE</span><span class="sys-v">local-storage ✓</span></div>
                <div class="sys-line"><span class="sys-k">THEME</span><span class="sys-v" :style="{ color: 'var(--accent)' }">{{ settings.theme.toUpperCase() }}</span></div>
              </div>

              <div class="g-sub">SAVE DATA</div>
              <div class="g-rows">
                <div class="row">
                  <div class="row-label"><i class="bx bx-undo"></i><span>Reset all options to defaults</span></div>
                  <button class="danger-btn" @click="handleSaveReset"><i class="bx bx-reset"></i> RESET</button>
                </div>
              </div>

              <div class="g-sub">ABOUT</div>
              <p class="about">
                A wandering engineer's portfolio, forged as a playable menu.
                Theming, audio, FX and UI are all handled through this options screen.
              </p>
            </template>

            <!-- CONTACT -->
            <template v-else>
              <div class="g-head">
                <h3 class="g-title"><i class="bx bxs-contact"></i> Contact</h3>
                <span class="g-path">settings &gt; contact</span>
              </div>

              <div class="g-rows">
                <div class="row">
                  <div class="row-label"><i class="bx bx-envelope"></i><span>Email</span></div>
                  <a class="link-val" :href="'mailto:' + contact.email">{{ contact.email }}</a>
                </div>
                <div class="row">
                  <div class="row-label"><i class="bx bx-phone"></i><span>Phone</span></div>
                  <a class="link-val" :href="'tel:' + contact.phone">{{ contact.phone }}</a>
                </div>
                <div class="row">
                  <div class="row-label"><i class="bx bx-map"></i><span>Location</span></div>
                  <a
                    class="link-val"
                    :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(contact.location)"
                    target="_blank"
                    rel="noopener"
                  >{{ contact.location }}</a>
                </div>
              </div>

              <div class="g-sub">SOCIAL</div>
              <div class="c-social">
                <a
                  v-for="[key, href] in Object.entries(contact.social || {})"
                  :key="key"
                  :href="href"
                  target="_blank"
                  rel="noopener"
                  class="soc"
                >
                  <i class="bx" :class="'bxl-' + key"></i>
                </a>
              </div>

              <a class="cv-btn" href="manish_kumar_singh_resume.pdf" download="manish_kumar_singh_cv.pdf">
                <i class="bx bx-download"></i> DOWNLOAD CV
              </a>
            </template>
          </div>
        </Transition>
      </section>
    </div>

    <footer class="s-foot">
      <span class="hud-label">↑↓ NAVIGATE · ENTER SELECT</span>
      <span class="hud-label">AUDIO ▸ DISPLAY ▸ SYSTEM ▸ CONTACT</span>
    </footer>
  </div>
</template>

<style scoped>
:root, .settings { 
  --mono: 'Consolas', 'Cascadia Mono', 'JetBrains Mono', 'SF Mono', monospace; 
}

.settings {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, var(--panel-solid), var(--panel));
}

.corner { position: absolute; width: 18px; height: 18px; z-index: 40; pointer-events: none; opacity: 0.9; }
.corner.tl { top: 8px; left: 8px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.tr { top: 8px; right: 8px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); }
.corner.bl { bottom: 8px; left: 8px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }

/* Header */
.s-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(16px, 2.4vw, 26px) clamp(18px, 3vw, 28px);
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, var(--bg-1), transparent);
}
.s-title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.s-kicker { display: flex; align-items: center; gap: 8px; }
.s-prompt { font-family: var(--mono); color: var(--accent); font-size: 16px; }
.eyebrow { font-family: var(--font-orbitron); font-size: 10px; letter-spacing: 3px; color: var(--text-dim); }
.head-name {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent);
  text-shadow: 0 0 18px var(--glow);
}
.s-ver { width: 100%; margin-top: 4px; color: var(--text-dim); font-family: var(--mono); font-size: 12px; opacity: 0.8; }

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--line-strong);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--accent-red-bright);
  background: var(--bg-1);
  cursor: pointer;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: all 0.2s ease;
}
.reset-btn:hover { background: var(--accent-red); color: #fff; box-shadow: 0 0 18px rgba(200, 16, 46, 0.5); }

/* Main */
.s-main { flex: 1; min-height: 0; display: flex; gap: 0; }

/* Sidebar nav */
.s-nav {
  flex: none;
  width: 230px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--line);
  background: linear-gradient(180deg, var(--bg-1), var(--panel));
}
.nav-kicker { padding: 4px 10px 12px; }
.nav-kicker .hud-label { font-size: 9px; color: var(--text-dim); font-family: var(--mono); }
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  text-align: left;
  font-family: var(--font-hud);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  background: transparent;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  cursor: pointer;
  overflow: hidden;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: all 0.2s ease;
}
.nav-item:hover { background: var(--panel-hi); color: var(--text); border-color: var(--line); }
.nav-item.active {
  color: var(--accent);
  border-color: var(--line-strong);
  border-left-color: var(--accent);
  background: linear-gradient(90deg, var(--glow-soft), var(--panel-hi));
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.25);
}
.nav-item i { font-size: 18px; }
.n-bar {
  position: absolute;
  right: 10px;
  bottom: 8px;
  left: 14px;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.nav-item.active .n-bar { transform: scaleX(1); }
.nav-hint {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  color: var(--text-dim);
  opacity: 0.6;
}
.nav-hint .hud-label { font-size: 8px; font-family: var(--mono); letter-spacing: 1px; }

/* Content */
.s-content { flex: 1; min-width: 0; overflow-y: auto; padding: clamp(18px, 3vw, 34px); }

.tab-pane { display: flex; flex-direction: column; gap: 16px; }

.g-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.g-title {
  font-family: var(--font-hud);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 0 14px var(--glow);
}
.g-title i { font-size: 22px; }
.g-path { font-family: var(--mono); font-size: 11px; color: var(--text-dim); opacity: 0.7; }

.g-sub {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--text-dim);
  opacity: 0.8;
  border-bottom: 1px solid var(--line);
  padding-bottom: 6px;
  margin-top: 6px;
}

.g-rows {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--line);
}
.row:last-child { border-bottom: none; }
.row-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-hud);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.row-label i { color: var(--accent); font-size: 17px; }

/* Segmented ON/OFF */
.seg {
  display: inline-flex;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-0);
}
.seg button {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1px;
  padding: 7px 16px;
  color: var(--text-dim);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.seg button:hover { color: var(--text); }
.seg button.on {
  background: var(--accent);
  color: var(--bg-0);
  box-shadow: 0 0 14px var(--glow);
}

/* Slider */
.vol-ctrl { display: flex; align-items: center; gap: 14px; flex: 1; max-width: 380px; }
.vol-ctrl input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--accent) var(--fill), var(--line-strong) var(--fill));
  outline: none;
  cursor: pointer;
}
.vol-ctrl input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: var(--accent);
  border: 2px solid var(--bg-0);
  transform: rotate(45deg);
  box-shadow: 0 0 12px var(--glow);
}
.vol-ctrl input[type='range']::-moz-range-thumb {
  width: 16px; height: 16px; border-radius: 3px;
  background: var(--accent); border: 2px solid var(--bg-0);
  box-shadow: 0 0 12px var(--glow);
}
.vol-val {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--accent);
  min-width: 46px;
  text-align: right;
}

.test-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--accent);
  background: var(--bg-1);
  border: 1px solid var(--line-strong);
  padding: 8px 14px;
  cursor: pointer;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: all 0.2s ease;
}
.test-btn:hover { background: var(--accent); color: var(--bg-0); box-shadow: 0 0 16px var(--glow); }

/* Theme presets */
.theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
.theme-btn {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--bg-0);
  text-align: left;
  cursor: pointer;
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  transition: all 0.22s ease;
}
.theme-btn:hover { border-color: var(--line-strong); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35); }
.theme-btn.active { border-color: var(--accent); box-shadow: 0 0 18px var(--glow-soft); }
.t-strip {
  position: relative;
  display: flex;
  height: 46px;
  overflow: hidden;
}
.t-strip i { flex: 1; }
.t-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--bg-0);
  display: grid;
  place-items: center;
  font-size: 14px;
  box-shadow: 0 0 10px var(--glow);
}
.t-meta { display: flex; flex-direction: column; gap: 3px; padding: 11px 13px 12px; }
.t-meta strong { font-family: var(--font-display); font-size: 16px; letter-spacing: 1px; color: var(--text); }
.theme-btn.active .t-meta strong { color: var(--accent); }
.t-meta small { font-family: var(--font-hud); font-size: 11px; color: var(--text-dim); letter-spacing: 0.3px; }

/* System */
.sys-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
  padding: 6px 18px;
  font-weight: 600;
}
.sys-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px dashed var(--line);
  font-family: var(--mono);
}
.sys-line:last-child { border-bottom: none; }
.sys-k { font-size: 11px; letter-spacing: 1.5px; color: var(--text-dim); }
.sys-v { font-size: 12px; color: var(--text); }

.danger-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--accent-red-bright);
  background: var(--bg-1);
  border: 1px solid var(--accent-red-bright);
  padding: 8px 14px;
  cursor: pointer;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: all 0.2s ease;
}
.danger-btn:hover { background: var(--accent-red); color: #fff; box-shadow: 0 0 16px rgba(200, 16, 46, 0.5); }

.about { font-family: var(--font-display); font-size: 20px; line-height: 1.8; color: var(--text-dim); }

/* Contact */
.link-val { font-family: var(--mono); font-size: 13px; color: var(--accent); transition: text-shadow 0.2s ease; }
.link-val:hover { text-shadow: 0 0 10px var(--glow); }
.c-social { display: flex; gap: 10px; }
.soc {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  font-size: 20px;
  color: var(--text-dim);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: all 0.22s ease;
}
.soc:hover { color: var(--accent); border-color: var(--accent); box-shadow: 0 0 14px var(--glow); transform: translateY(-2px); }
.cv-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 11px 18px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--accent);
  background: var(--bg-1);
  border: 1px solid var(--line-strong);
  cursor: pointer;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: all 0.22s ease;
}
.cv-btn:hover { background: var(--accent); color: var(--bg-0); box-shadow: 0 0 20px var(--glow); }

/* Footer */
.s-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 22px;
  border-top: 1px solid var(--line);
}
.s-foot .hud-label { color: var(--text-dim); font-size: 10px; font-family: var(--mono); }

/* Tab transition */
.tab-enter-active { transition: all 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
.tab-leave-active { transition: all 0.18s ease; }
.tab-enter-from { opacity: 0; transform: translateY(12px); }
.tab-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 760px) {
  .s-head { padding: 20px 25px; align-items: center; gap: 10px; }
  .s-kicker, .s-ver { display: none; }
  .head-name { font-size: 22px;}
  .reset-btn { padding: 8px 10px; }
  .reset-btn span { display: none; }
  .reset-btn i { font-size: 16px; margin: 0; }

  .s-main { flex-direction: column; }
  .s-nav {
    width: 100%;
    flex-direction: row;
    flex-wrap: nowrap;
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding: 8px 10px;
    gap: 6px;
  }
  .nav-kicker, .nav-hint { display: none; }
  .nav-item {
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
    padding: 8px 6px;
    border-radius: 10px;
    border: 1px solid var(--line);
    clip-path: none;
  }
  .n-bar { display: none; }
  .nav-item i { font-size: 18px; }
  .n-label { font-size: 9px; letter-spacing: 1px; }

  .s-content { padding: 14px; }
  .g-path { display: none; }
  .g-title { font-size: 16px; letter-spacing: 1px; gap: 8px; }
  .g-title i { font-size: 18px; }
  .g-rows { border-radius: 12px; }
  .row { padding: 12px 14px; gap: 10px; }
  .row-label { font-size: 13px; }
  .row-label i { font-size: 15px; }
  .vol-ctrl { max-width: none; }
  .seg button { padding: 6px 12px; }
  .theme-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .s-foot { display: none; }

  .corner { display: none; position: absolute; width: 18px; height: 18px; z-index: 40; pointer-events: none; opacity: 0.9; }
  .about { font-family: var(--font-display); font-size: 14px; line-height: 1.2; color: var(--text-dim); }
}
</style>

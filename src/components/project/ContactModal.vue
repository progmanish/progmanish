<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  contact: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const email = computed(() => props.contact?.email || '')
const phone = computed(() => props.contact?.phone || '')
const location = computed(() => props.contact?.location || '')
const socials = computed(() => Object.entries(props.contact?.social || {}))

const KEY = 'gamgineer.contact.v1'

const INIT_STEPS = [
  { id: 'scroll', label: 'Copy the Scroll', xp: 10, done: false },
  { id: 'raven', label: 'Send the Raven', xp: 20, done: false },
  { id: 'call', label: 'Light the Signal', xp: 15, done: false },
  { id: 'guild', label: 'Solve the Guild Riddle', xp: 10, done: false }
]

const GUILD_CLUES = {
  github: 'The vault where all source code is forged',
  linkedin: 'The hall where careers are sworn',
  instagram: 'The gallery of the wandering years'
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!Array.isArray(s.steps)) return null
    const doneMap = {}
    for (const st of s.steps) doneMap[st.id] = !!st.done
    return {
      steps: INIT_STEPS.map((d) => ({ ...d, done: !!doneMap[d.id] })),
      xp: Math.max(0, s.xp || 0),
      line: Math.max(0, s.line || 0)
    }
  } catch {
    return null
  }
}

const saved = load()

const steps = ref(
  saved ? saved.steps : INIT_STEPS.map((d) => ({ ...d }))
)
const xp = ref(saved ? saved.xp : 0)
const lineIdx = ref(saved ? saved.line : 0)
const copied = ref(false)
const toast = ref('')
const challengeKey = ref('')
const challenged = ref(false)
const shake = ref(false)
let toastTimer = null
let copyTimer = null
let shakeTimer = null

const LINES = [
  'Ah, a traveler! I have been expecting you.',
  'The realm whispers of your arrival.',
  'You carry the mark of a true explorer.',
  'Your legend grows, adventurer.',
  'The devs shall sing of you this day.'
]

const MAX_XP = INIT_STEPS.reduce((a, s) => a + s.xp, 0)
const RANKS = [
  { min: 0, name: 'Stranger' },
  { min: 20, name: 'Wandering Dev' },
  { min: 40, name: 'Trusted Ally' },
  { min: 55, name: 'Legendary Ally' }
]

const line = computed(() => LINES[Math.min(lineIdx.value, LINES.length - 1)])
const rankName = computed(() => [...RANKS].reverse().find((r) => xp.value >= r.min)?.name || 'Stranger')
const pct = computed(() => Math.round((xp.value / MAX_XP) * 100))
const questDone = computed(() => steps.value.every((s) => s.done))
const guildDone = computed(() => steps.value.find((s) => s.id === 'guild')?.done || false)
const clueText = computed(() => GUILD_CLUES[challengeKey.value] || '')

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ steps: steps.value.map((s) => ({ id: s.id, done: s.done })), xp: xp.value, line: lineIdx.value })
    )
  } catch {
    /* ignore */
  }
}

function mark(id, gain, msg) {
  const st = steps.value.find((s) => s.id === id)
  if (st && !st.done) {
    st.done = true
    xp.value += gain
  }
  if (lineIdx.value < LINES.length - 1) lineIdx.value += 1
  showToast(msg)
  persist()
}

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(email.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 1600)
    mark('scroll', 10, '+10 XP · Scroll copied')
  } catch {
    showToast('The scroll resists… try again')
  }
}

function tryGuild(key, href) {
  if (key === challengeKey.value) {
    if (!guildDone.value) mark('guild', 10, 'The guildmaster approves! +10 XP')
    else showToast('The guilds already know you.')
    challenged.value = true
    if (href) window.open(href, '_blank', 'noopener')
  } else {
    if (challenged.value && href) {
      window.open(href, '_blank', 'noopener')
      return
    }
    shake.value = true
    showToast('The guildmaster frowns… try again')
    clearTimeout(shakeTimer)
    shakeTimer = setTimeout(() => (shake.value = false), 500)
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.open) {
    e.stopPropagation()
    close()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))

watch(
  () => props.open,
  (v) => {
    if (v) {
      copied.value = false
      const keys = Object.keys(GUILD_CLUES).filter((k) => socials.value.some(([sk]) => sk === k))
      const pool = keys.length ? keys : Object.keys(GUILD_CLUES)
      challengeKey.value = pool[Math.floor(Math.random() * pool.length)]
      challenged.value = guildDone.value
    }
  }
)

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cm-mask" @click.self="close">
      <div class="cm-modal panel" role="dialog" aria-modal="true">
        <button class="cm-close" @click="close" aria-label="Close">✕</button>

        <div class="cm-npc">
          <div class="cm-portrait">
            <img :src="'images/profile_pic.png'" alt="The developer" draggable="false" />
            <span class="cm-portrait-ring"></span>
          </div>
          <div class="cm-npc-info">
            <span class="hud-label">- QUEST GIVER -</span>
            <h2 class="panel-title">The Lorekeeper</h2>
            <span class="cm-class"><i class="bx bxs-map-pin"></i> {{ location }}</span>
          </div>
          <div class="cm-rank">
            <span class="cm-rank-k">RELATION</span>
            <b class="cm-rank-v">{{ rankName }}</b>
          </div>
        </div>

        <div class="cm-dialog">
          <span class="cm-dq">“</span>
          <p>{{ line }}</p>
          <i class="cm-cursor"></i>
        </div>

        <div class="cm-quest">
          <div class="cm-q-head">
            <span class="hud-label"><i class="bx bxs-flag-alt"></i> QUEST - REACH THE DEV</span>
            <span class="cm-q-xp"><i class="bx bxs-star"></i> {{ xp }} XP</span>
          </div>
          <div class="cm-q-bar">
            <i class="cm-q-fill" :style="{ width: pct + '%' }"></i>
          </div>
          <ul class="cm-steps">
            <li v-for="s in steps" :key="s.id" :class="{ done: s.done }">
              <i class="bx" :class="s.done ? 'bxs-check-circle' : 'bx-circle'"></i>
              <span>{{ s.label }}</span>
              <b class="cm-reward">+{{ s.xp }} XP</b>
            </li>
          </ul>
        </div>

        <div class="cm-actions">
          <a
            class="cm-btn primary"
            :href="'mailto:' + email"
            @click="mark('raven', 20, '+20 XP · Raven sent')"
          >
            <i class="bx bx-mail-send"></i> Send a Raven
          </a>
          <button class="cm-btn" type="button" @click="copyEmail">
            <i class="bx" :class="copied ? 'bxs-check-circle' : 'bxs-copy-alt'"></i>
            {{ copied ? 'Scroll Copied' : 'Copy the Scroll' }}
          </button>
          <a
            v-if="phone"
            class="cm-btn"
            :href="'tel:' + phone.replace(/\s/g, '')"
            @click="mark('call', 15, '+15 XP · Signal lit')"
          >
            <i class="bx bxs-phone"></i> Light the Signal
          </a>
        </div>

        <div v-if="socials.length" class="cm-guild">
          <div class="cm-guild-head">
            <span class="hud-label"><i class="bx bxs-key"></i> GUILD CHALLENGE</span>
            <span class="cm-guild-xp" :class="{ solved: guildDone }">
              <i class="bx" :class="guildDone ? 'bxs-check-circle' : 'bxs-star'"></i>
              {{ guildDone ? 'Solved' : '+10 XP' }}
            </span>
          </div>
          <p class="cm-clue">“{{ clueText }}”</p>
          <div class="cm-guild-sub">
            <span v-if="!challenged && !guildDone">Pick the guild that matches the clue.</span>
            <span v-else-if="guildDone">The guildmaster nods - you are known.</span>
            <span v-else>The gates are open, traveler.</span>
          </div>
          <div class="cm-socials-row" :class="{ shake }">
            <a
              v-for="[key, href] in socials"
              :key="key"
              class="cm-soc"
              :class="{ found: challenged && key === challengeKey }"
              :href="key === challengeKey || challenged ? href : undefined"
              @click.prevent="tryGuild(key, href)"
              :title="key"
            >
              <i class="bx" :class="'bxl-' + key"></i>
            </a>
          </div>
        </div>

        <Transition name="cm-toast">
          <div v-if="toast" class="cm-toast">{{ toast }}</div>
        </Transition>

        <Transition name="cm-done">
          <div v-if="questDone" class="cm-done">
            <span class="cm-done-star">✦</span>
            <p><b>QUEST COMPLETE</b><br />The dev has been reached - your tale is told.</p>
            <span class="cm-done-star">✦</span>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cm-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(3, 5, 12, 0.75);
  backdrop-filter: blur(8px);
  animation: fade-in 0.25s ease both;
}
.cm-modal {
  position: relative;
  width: min(620px, 100%);
  max-height: 94vh;
  overflow-y: auto;
  padding: 30px 28px 28px;
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

.cm-npc {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--line);
}
.cm-portrait {
  position: relative;
  flex: none;
  width: 84px;
  height: 84px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  background: var(--bg-0);
}
.cm-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cm-portrait-ring {
  position: absolute;
  inset: -1px;
  border: 1px solid var(--accent);
  border-radius: 20px;
  box-shadow: 0 0 14px var(--glow);
  animation: cm-ring 2.6s ease-in-out infinite;
}
@keyframes cm-ring {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.cm-npc-info { flex: 1; min-width: 0; }
.cm-npc-info .panel-title { font-size: 23px; margin: 4px 0 5px; }
.cm-class {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-hud);
  font-size: 12px;
  color: var(--text-dim);
}
.cm-class i { color: var(--accent); }
.cm-rank {
  flex: none;
  text-align: right;
}
.cm-rank-k {
  display: block;
  font-family: var(--font-orbitron);
  font-size: 8px;
  letter-spacing: 1.6px;
  color: var(--text-dim);
  margin-bottom: 3px;
}
.cm-rank-v {
  font-family: var(--font-orbitron);
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--accent);
  text-shadow: 0 0 12px var(--glow);
}

.cm-dialog {
  position: relative;
  margin: 18px 0;
  padding: 16px 18px 16px 38px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
  min-height: 60px;
}
.cm-dialog p {
  margin: 0;
  font-family: var(--font-hud);
  font-size: 15px;
  font-style: italic;
  color: var(--text);
  line-height: 1.75;
}
.cm-dq {
  position: absolute;
  top: 2px;
  left: 10px;
  font-size: 28px;
  color: var(--accent);
  opacity: 0.7;
}
.cm-cursor {
  display: inline-block;
  width: 8px;
  height: 14px;
  margin-left: 4px;
  vertical-align: -2px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--glow);
  animation: blink 1s steps(1) infinite;
}

.cm-quest {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--glow-soft);
}
.cm-q-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 11px;
}
.cm-q-head .hud-label { display: flex; align-items: center; gap: 7px; }
.cm-q-head .hud-label i { color: var(--accent); font-size: 14px; }
.cm-q-xp {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-orbitron);
  font-size: 10.5px;
  letter-spacing: 1px;
  color: var(--accent);
}
.cm-q-bar {
  height: 9px;
  border: 1px solid var(--line);
  border-radius: 99px;
  background: var(--panel-solid);
  overflow: hidden;
  margin-bottom: 13px;
}
.cm-q-fill {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--accent), var(--accent-bright));
  box-shadow: 0 0 10px var(--glow);
  transition: width 0.5s ease;
}
.cm-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.cm-steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-hud);
  font-size: 14px;
  color: var(--text-dim);
}
.cm-steps li i { font-size: 16px; color: var(--line-strong); }
.cm-steps li span { flex: 1; }
.cm-reward {
  font-family: var(--font-orbitron);
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--text-dim);
}
.cm-steps li.done { color: var(--text); }
.cm-steps li.done i { color: #3dce8a; text-shadow: 0 0 8px rgba(61, 206, 138, 0.6); }
.cm-steps li.done .cm-reward { color: #3dce8a; }

.cm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}
.cm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 14px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 11px;
  background: var(--panel-solid);
  font-family: var(--font-hud);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.22s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cm-btn i { color: var(--accent); font-size: 16px; flex: none; }
.cm-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--glow-soft);
  transform: translateY(-1px);
}
.cm-btn.primary {
  border-color: var(--accent);
  color: var(--accent);
  background: linear-gradient(180deg, var(--glow-soft), transparent);
  box-shadow: inset 0 0 14px var(--glow-soft);
}

.cm-guild {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px dashed var(--line-strong);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
}
.cm-guild-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cm-guild-head .hud-label { display: flex; align-items: center; gap: 7px; color: var(--accent); }
.cm-guild-head .hud-label i { font-size: 14px; }
.cm-guild-xp {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-orbitron);
  font-size: 9.5px;
  letter-spacing: 1px;
  color: var(--accent);
}
.cm-guild-xp.solved { color: #3dce8a; }
.cm-clue {
  margin: 10px 0 4px;
  font-family: var(--font-hud);
  font-size: 14.5px;
  font-style: italic;
  color: var(--text);
  line-height: 1.6;
}
.cm-guild-sub {
  font-family: var(--font-hud);
  font-size: 11.5px;
  color: var(--text-dim);
  margin-bottom: 12px;
}
.cm-socials-row {
  display: flex;
  gap: 8px;
}
.cm-soc {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 18px;
  color: var(--text-dim);
  transition: all 0.22s ease;
}
.cm-soc:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 12px var(--glow-soft);
  transform: translateY(-2px);
}
.cm-soc.found {
  color: #3dce8a;
  border-color: #3dce8a;
  box-shadow: 0 0 14px rgba(61, 206, 138, 0.45);
}
.cm-socials-row.shake { animation: cm-shake 0.45s ease; }
@keyframes cm-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}

.cm-toast {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border: 1px solid var(--accent);
  border-radius: 99px;
  background: var(--panel-solid);
  box-shadow: 0 0 16px var(--glow-soft);
  font-family: var(--font-orbitron);
  font-size: 10.5px;
  letter-spacing: 1px;
  color: var(--accent);
  white-space: nowrap;
  z-index: 4;
}
.cm-toast-enter-active, .cm-toast-leave-active { transition: all 0.25s ease; }
.cm-toast-enter-from, .cm-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

.cm-done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
  padding: 13px 10px;
  border: 1px solid var(--accent);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--glow-soft), transparent);
  text-align: center;
}
.cm-done p { margin: 0; font-size: 12px; line-height: 1.7; color: var(--text-dim); }
.cm-done b {
  font-family: var(--font-orbitron);
  font-size: 11.5px;
  letter-spacing: 2px;
  color: var(--accent);
}
.cm-done-star {
  color: var(--accent);
  animation: qlog-star 1.6s ease-in-out infinite;
}
.cm-done-enter-active, .cm-done-leave-active { transition: all 0.3s ease; }
.cm-done-enter-from, .cm-done-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 480px) {
  .cm-rank { display: none; }
  .cm-btn { flex: 1 1 100%; }
}
</style>

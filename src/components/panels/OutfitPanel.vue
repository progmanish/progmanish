<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { questlog, QUESTS } from '../../stores/questlog'
import ContactModal from '../project/ContactModal.vue'
import { con, pushLine, clearConsole } from '../../stores/console'

const props = defineProps({
  data: { type: Object, required: true }
})

const user = computed(() => props.data.user)
const appearance = computed(() => props.data.appearance)
const contact = computed(() => props.data.contact)

const realmStages = computed(
  () => appearance.value.realmStages || ['Novice', 'Disciple', 'Adept', 'Expert', 'Master', 'Grandmaster']
)
const realmIndex = computed(() => {
  const v = appearance.value.realmIndex
  return Number.isInteger(v) && v >= 0 && v < realmStages.value.length
    ? v
    : Math.floor(realmStages.value.length / 2)
})
const realmName = computed(() => realmStages.value[realmIndex.value] || 'Senior')
const pipsStyle = computed(() => {
  const n = realmStages.value.length
  const pip = 13
  const gap = 18
  const width = n * pip + (n - 1) * gap
  const fill = ((pip / 2 + realmIndex.value * (pip + gap)) / width) * 100
  return { width: width + 'px', '--fill': fill + '%' }
})

const avg = computed(() => {
  const s = appearance.value.stats || []
  return s.length ? Math.round(s.reduce((a, b) => a + b.value, 0) / s.length) : 0
})

const skills = computed(() => props.data.skills || [])

const questsDone = computed(() => QUESTS.filter((q) => questlog.isDone(q.id)).length)
const questsActive = computed(() => QUESTS.filter((q) => !questlog.isDone(q.id)))
const questsPct = computed(() => Math.round((questsDone.value / QUESTS.length) * 100))
const allQuestDone = computed(() => questsDone.value === QUESTS.length)

function tierLabel(v) {
  const n = parseInt(v) || 0
  if (n >= 80) return 'MASTER'
  if (n >= 60) return 'ADEPT'
  return 'INITIATE'
}

function descOf(name) {
  const key = name.toLowerCase()
  const match = props.data.skillTree?.branches
    ?.flatMap((b) => b.nodes)
    .find((nd) => nd.name.toLowerCase().includes(key))
  return match?.desc || ''
}

const prompt = 'prog@manish:~$'
const bodyEl = ref(null)
const inputRef = ref(null)

watch(() => con.lines.length, () => scrollBottom())
watch(() => con.busy, (v) => {
  if (!v) {
    scrollBottom()
    nextTick(() => { if (window.innerWidth > 760) inputRef.value?.focus() })
  }
})

function scrollBottom() {
  nextTick(() => {
    const el = bodyEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

onMounted(() => {
  if (con.lines.length) {
    scrollBottom()
  } else {
    type([
      { text: 'manish_dev_console v2.0 - resume terminal', cls: 'head' },
      { text: '> access granted · welcome back, developer.', cls: 'ok' },
      { text: "> type 'help'", cls: 'dim' }
    ])
  }
})

function type(out, done) {
  con.busy = true
  let i = 0
  const step = () => {
    if (i >= out.length) {
      con.busy = false
      if (done) done()
      return
    }
    pushLine(out[i].text, out[i].cls)
    const wait = out[i].wait ?? 90
    i++
    setTimeout(step, wait)
  }
  step()
}

function submit() {
  const cmd = con.input.trim()
  if (!cmd || con.busy) return
  pushLine(prompt + ' ' + cmd, 'prompt')
  con.input = ''
  questlog.mark('console')
  run(cmd.toLowerCase())
}

function run(cmd) {
  const [c, ...rest] = cmd.split(/\s+/)
  const arg = rest.join(' ')
  switch (c) {
    case 'help':
      type([
        { text: 'AVAILABLE COMMANDS', cls: 'head' },
        { text: '  help        list commands', cls: 'dim' },
        { text: '  whoami      identify the developer', cls: 'dim' },
        { text: '  skills      list every skill + mastery', cls: 'dim' },
        { text: '  focus <s>   deep-dive a skill  (ex: focus unreal)', cls: 'dim' },
        { text: '  build       compile the portfolio', cls: 'dim' },
        { text: '  cheatcode   try it, dev', cls: 'dim' },
        { text: '  clear       wipe the terminal', cls: 'dim' }
      ])
      break
    case 'whoami':
      type([
        { text: (user.value.name || 'MANISH').toUpperCase() + ' KUMAR SINGH', cls: 'ok' },
        { text: user.value.role || 'Game Programmer', cls: 'dim' },
        { text: 'realm: ' + realmName.value, cls: 'acc' }
      ])
      break
    case 'skills':
      if (!skills.value.length) {
        type([{ text: 'no skills found in the archive', cls: 'err' }])
        break
      }
      type(skills.value.map((s) => ({
        text: `  [${tierLabel(s.level)}]  ${String(s.name).padEnd(15)} ${s.level}`,
        cls: tierLabel(s.level) === 'MASTER' ? 'gold' : tierLabel(s.level) === 'ADEPT' ? 'ok' : 'dim'
      })))
      break
    case 'focus': {
      if (!arg) {
        type([{ text: 'usage: focus <skill>   (ex: focus c++)', cls: 'warn' }])
        break
      }
      const hit = skills.value.find((s) => s.name.toLowerCase().includes(arg))
      if (!hit) {
        type([{ text: `skill '${arg}' not found - run 'skills'`, cls: 'err' }])
        break
      }
      type([
        { text: `▸ ${hit.name.toUpperCase()} - ${hit.level}% [${tierLabel(hit.level)}]`, cls: 'head' },
        { text: '  ' + (descOf(hit.name) || 'no lore recorded for this craft yet.'), cls: 'dim' }
      ])
      break
    }
    case 'build':
      type([
        { text: 'compiling portfolio...', cls: 'dim' },
        { text: '  > bundling components........ ok', cls: 'dim' },
        { text: '  > baking shaders............ ok', cls: 'dim' },
        { text: '  > inlining experience....... ok', cls: 'dim' },
        { text: '✓ BUILD SUCCESS - 0 errors, 0 warnings', cls: 'ok', wait: 150 }
      ])
      break
    case 'cheatcode':
      type([
        { text: '↑ ↑ ↓ ↓ ← → ← → B A', cls: 'gold', wait: 120 },
        { text: '✦ UNLIMITED POWER UNLOCKED ✦', cls: 'gold', wait: 120 },
        { text: '> all skills temporarily set to 100%.', cls: 'dim' }
      ])
      break
    case 'clear':
    case 'cls':
      clearConsole()
      break
    case 'ls':
      type([{ text: 'engines/  systems/  tools/  prototypes/  bugs(real)/', cls: 'dim' }])
      break
    case 'meme':
      type([
        { text: 'it works on my machine (tm)', cls: 'warn' },
        { text: '...it did in the build before the merge.', cls: 'dim' }
      ])
      break
    case 'sudo':
      type([{ text: `manish is not in the sudoers file. this incident will be reported.`, cls: 'err' }])
      break
    default:
      type([{ text: `command not found: ${c} - type 'help'`, cls: 'err' }])
  }
}

const quest = computed(() => {
  const all = props.data.projects?.['completed-games'] || []
  return all.find((p) => /progress/i.test(p.title)) || all[0] || null
})
const questDesc = computed(() => {
  const d = quest.value?.description
  if (!d) return ''
  const first = Array.isArray(d) ? d[0] : String(d)
  const s = String(first)
  return s.length > 150 ? s.slice(0, 150).trimEnd() + '…' : s
})

const contactOpen = ref(false)
const location = computed(() => contact.value?.location || user.value?.location || '')
const socials = computed(() => Object.entries(contact.value?.social || {}))
</script>

<template>
  <div class="outfit panel">
    <!-- Hero dossier -->
    <div class="left">
      <div class="dossier">
        <i class="cr tl"></i><i class="cr tr"></i><i class="cr bl"></i><i class="cr br"></i>

        <div class="medallion">
          <div class="halo"></div>
          <div class="ring spin-border"></div>
          <div class="medal-inner">
            <img
              class="face"
              :src="'images/profile_pic.png'"
              :alt="user.name + ' portrait'"
              draggable="false"
            />
            <div class="sheen"></div>
          </div>
          <span class="lv-chip">{{ appearance.level }}</span>
        </div>

        <div class="seal-row">
          <span class="orn"><i class="orn-line"></i><span class="orn-dot"></span></span>
          <h2 class="np-name">{{ appearance.nameplate || user.name }}</h2>
          <span class="orn"><span class="orn-dot"></span><i class="orn-line"></i></span>
        </div>

        <div class="divider"><span class="diamond">✦</span></div>

        <div class="meta-row">
          <span class="eyebrow"><i class="bx bxs-shield-alt-2"></i> {{ appearance.characterClass }}</span>
        </div>

        <div class="cult">
          <span class="cult-label"><i class="bx bxs-moon"></i> STAGE</span>
          <div class="cult-pips" :style="pipsStyle">
            <span
              v-for="(st, i) in realmStages"
              :key="st"
              class="cult-pip"
              :class="{ on: i <= realmIndex, cur: i === realmIndex }"
              :title="st"
            ></span>
          </div>
          <div class="cult-name">
            <span class="realm">{{ realmName }}</span>
            <span class="step">{{ realmIndex + 1 }} / {{ realmStages.length }}</span>
          </div>
        </div>

        <div class="mastery">
          <div class="m-bar"><i class="m-fill" :style="{ width: avg + '%' }"></i></div>
          <div class="m-meta">
            <span class="hud-label">OVERALL SKILL</span>
            <span class="hud-label gold">{{ avg }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Story -->
    <div class="right">
      <header class="rp-head" :class="{ cleared: allQuestDone }">
        <div class="qlog-head">
          <span class="eyebrow tag"><i class="bx bxs-flag-alt"></i> Quest Log</span>
          <span class="qlog-count" :class="{ done: allQuestDone }">
            <i class="bx" :class="allQuestDone ? 'bxs-trophy' : 'bx-chevrons-right'"></i>
            {{ allQuestDone ? 'World Cleared' : questsDone + ' / ' + QUESTS.length + ' done' }}
          </span>
        </div>

        <div class="qlog-bar">
          <i class="qlog-fill" :style="{ width: questsPct + '%' }"></i>
        </div>

        <ul class="qlog-list">
          <li v-for="q in questsActive" :key="q.id" class="qlog-item">
            <i class="bx qlog-ico" :class="q.icon"></i>
            <span class="qlog-txt">
              <b>{{ q.label }}</b>
              <small>{{ q.desc }}</small>
            </span>
            <span class="qlog-xp">+10 XP</span>
          </li>
        </ul>

        <div v-if="allQuestDone" class="qlog-cleared">
          <span class="qlog-cstar">✦</span>
          <p><b>ALL QUESTS COMPLETE</b><br />Legendary Developer - the realm is yours.</p>
          <span class="qlog-cstar">✦</span>
        </div>
      </header>

      <!-- Lore -->
      <section class="sec">
        <div class="sec-head">
          <span class="eyebrow">The Wanderer's Tale</span>
          <span class="sec-line"></span>
        </div>
        <div class="lore">
          <p>{{ user.bio }}</p>
          <span class="lore-chip"><i class="bx bxs-map-pin"></i> {{ location }}</span>
        </div>
      </section>

      <!-- Dev console -->
      <section class="sec">
        <div class="sec-head">
          <span class="eyebrow">Dev Console</span>
          <span class="sec-line"></span>
        </div>
        <div class="term" @click="inputRef && inputRef.focus()">
          <div class="term-bar">
            <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
            <span class="term-title">Dev Console</span>
            <span class="term-live"><i></i> online</span>
          </div>
          <div class="term-body" ref="bodyEl">
            <p v-for="l in con.lines" :key="l.id" class="t-line" :class="l.cls">{{ l.text }}</p>
            <div v-if="!con.busy" class="t-prompt">
              <span class="t-prompt-label">{{ prompt }} </span>
              <input
                ref="inputRef"
                v-model="con.input"
                class="t-input"
                @keydown.enter.prevent="submit"
                :disabled="con.busy"
                spellcheck="false"
                autocomplete="off"
                aria-label="console command"
              />
              <span class="t-cursor"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- Active quest -->
      <section v-if="quest" class="sec">
        <div class="sec-head">
          <span class="eyebrow">Current Objective</span>
          <span class="sec-line"></span>
        </div>
        <article class="objective">
          <div class="obj-media">
            <img
              class="obj-thumb"
              :src="quest.thumbnail"
              :alt="quest.title"
              loading="lazy"
              draggable="false"
            />
            <span class="obj-badge"><i class="bx bxs-bolt"></i> ACTIVE</span>
            <span class="obj-scan"></span>
          </div>
          <div class="obj-body">
            <div class="obj-status"><i class="q-dot"></i> MAIN QUEST</div>
            <h3 class="obj-title">{{ quest.title }}</h3>
            <p class="obj-desc">{{ questDesc }}</p>
            <div class="obj-row">
              <div class="obj-tags">
                <span v-for="t in quest.tech.slice(0, 4)" :key="t" class="obj-tag">{{ t }}</span>
              </div>
              <div class="obj-actions">
                <a
                  v-if="quest.repo"
                  class="obj-btn ghost"
                  :href="quest.repo"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="bx bx-code-alt"></i> Repo
                </a>
                <a
                  v-if="quest.live"
                  class="obj-btn ghost"
                  :href="quest.live"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="bx bx-globe"></i> Live
                </a>
                <a
                  v-if="quest.video"
                  class="obj-btn primary"
                  :href="quest.video"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="bx bx-play-circle"></i> Watch Demo
                </a>
              </div>
            </div>
          </div>
        </article>
      </section>

      <footer class="rp-foot">
        <div class="socials">
          <a
            v-for="[key, href] in socials"
            :key="key"
            :href="href"
            target="_blank"
            rel="noopener"
            class="social-btn"
            :title="key"
          >
            <i class="bx" :class="'bxl-' + key"></i>
          </a>
        </div>
        <div class="cta">
          <button class="btn-primary" type="button" @click="contactOpen = true">
            <i class="bx bx-mail-send"></i> Contact Me
          </button>
          <a class="btn-ghost" href="manish_kumar_singh_resume.pdf" download="manish_kumar_singh_cv.pdf">
            <i class="bx bx-download"></i> CV
          </a>
        </div>
      </footer>
    </div>

    <ContactModal :open="contactOpen" :contact="contact" @close="contactOpen = false" />
  </div>
</template>

<style scoped>
.outfit {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(300px, 36%) 1fr;
  overflow: hidden;
}

/* ---------- Left: hero dossier ---------- */
.left {
  border-right: 1px solid var(--line);
  padding: clamp(18px, 2.6vw, 32px);
  overflow-y: auto;
  min-height: 0;
  display: flex;
  align-items: center;
  background:
    radial-gradient(120% 80% at 50% 0%, var(--glow-soft), transparent 60%),
    transparent;
}

.dossier {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  padding: clamp(26px, 3.4vw, 40px) clamp(18px, 2.4vw, 30px) clamp(28px, 3.4vw, 40px);
  background: linear-gradient(180deg, var(--panel-hi), transparent 78%);
  border-radius: 18px;
}

.cr {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent);
  opacity: 0.65;
  transition: opacity 0.25s ease;
}
.dossier:hover .cr { opacity: 1; }
.cr.tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
.cr.tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
.cr.bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
.cr.br { bottom: 10px; right: 10px; border-left: none; border-top: none; }

/* Medallion */
.medallion {
  position: relative;
  width: min(30vh, 240px);
  aspect-ratio: 1;
}
.halo {
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow), transparent 70%);
  pointer-events: none;
}
.ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: conic-gradient(
    from var(--ang),
    transparent 0deg,
    var(--accent-bright) 35deg,
    transparent 80deg,
    transparent 210deg,
    var(--accent) 255deg,
    transparent 305deg
  );
  mix-blend-mode: screen;
  pointer-events: none;
}
.medal-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  padding: 3px;
  overflow: hidden;
  background: linear-gradient(165deg, var(--accent-bright), var(--line) 45%, var(--accent) 125%);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55), 0 0 30px var(--glow-soft);
}
.face {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 22%;
  display: block;
}
.sheen {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.13) 50%, transparent 60%);
  transform: translateX(-130%);
}
.medallion:hover .sheen { animation: sheen-sweep 0.9s ease; }
@keyframes sheen-sweep {
  0% { transform: translateX(-130%); }
  100% { transform: translateX(130%); }
}

.lv-chip {
  position: absolute;
  top: 3%;
  right: -4%;
  padding: 7px 13px;
  border-radius: 999px;
  background: linear-gradient(160deg, var(--accent-bright), var(--accent));
  font-family: var(--font-orbitron);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--bg-0);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  z-index: 3;
}

/* Calligraphy name + seal */
.seal-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
}
.np-name {
  font-family: var(--font-display);
  font-size: clamp(23px, 2.4vw, 29px);
  font-weight: 500;
  letter-spacing: 5px;
  line-height: 1.2;
  text-align: center;
  background: linear-gradient(180deg, #ffffff, var(--accent-bright));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 14px var(--glow));
}
.orn { display: flex; align-items: center; gap: 8px; flex: none; }
.orn-line {
  width: clamp(22px, 4vw, 46px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent));
  opacity: 0.85;
}
.orn:last-child .orn-line { background: linear-gradient(90deg, var(--accent), transparent); }
.orn-dot {
  width: 7px;
  height: 7px;
  transform: rotate(45deg);
  border-radius: 1px;
  background: linear-gradient(160deg, var(--accent-bright), var(--accent));
  box-shadow: 0 0 8px var(--glow);
  flex: none;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
}
.divider::before { background: linear-gradient(90deg, transparent, var(--line-strong)); }
.divider::after { background: linear-gradient(90deg, var(--line-strong), transparent); }
.diamond { color: var(--accent); font-size: 12px; text-shadow: 0 0 8px var(--glow); }

.meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
}
.meta-row .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 9.5px;
  text-align: center;
}
.meta-row .eyebrow i { color: var(--accent); font-size: 14px; }

/* Cultivation realm */
.cult {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 13px;
  padding: 16px 18px 15px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
}
.cult::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-bright), transparent);
  box-shadow: 0 0 10px var(--glow);
}
.cult-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-orbitron);
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--text-dim);
}
.cult-label i { color: var(--accent); font-size: 14px; }

.cult-pips {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}
.cult-pips::before,
.cult-pips::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 2px;
  border-radius: 2px;
}
.cult-pips::before { left: 7px; right: 7px; background: var(--line); }
.cult-pips::after {
  left: 7px;
  width: var(--fill);
  background: linear-gradient(90deg, var(--accent), var(--accent-bright));
  box-shadow: 0 0 8px var(--glow);
}

.cult-pip {
  position: relative;
  z-index: 1;
  width: 13px;
  height: 13px;
  transform: rotate(45deg);
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  background: var(--bg-0);
  transition: all 0.3s ease;
}
.cult-pip.on {
  border-color: var(--accent-bright);
  background: linear-gradient(160deg, var(--accent-bright), var(--accent));
  box-shadow: 0 0 8px var(--glow);
}
.cult-pip.cur { animation: pip-breathe 1.8s ease-in-out infinite; }
@keyframes pip-breathe {
  0%, 100% { box-shadow: 0 0 5px var(--glow); }
  50% { box-shadow: 0 0 16px var(--glow), 0 0 28px var(--glow); }
}

.cult-name {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.realm {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(180deg, #ffffff, var(--accent-bright));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px var(--glow));
}
.step {
  font-family: var(--font-orbitron);
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--text-dim);
}

.mastery { width: 100%; }
.m-bar {
  height: 6px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 99px;
  overflow: hidden;
}
.m-fill {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--accent), var(--accent-bright));
  box-shadow: 0 0 10px var(--glow);
  transition: width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.m-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
}
.m-meta .hud-label { font-size: 9.5px; }
.m-meta .gold { color: var(--accent); }

/* ---------- Right ---------- */
.right {
  padding: clamp(20px, 2.8vw, 36px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-height: 0;
}

.eyebrow {
  font-family: var(--font-orbitron);
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--text-dim);
  text-transform: uppercase;
}

.rp-head {
  position: relative;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 18px 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background:
    radial-gradient(120% 100% at 0% 0%, var(--glow-soft), transparent 55%),
    linear-gradient(180deg, var(--panel-hi), transparent);
  overflow: hidden;
}
.rp-head::before {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-bright), transparent);
  box-shadow: 0 0 12px var(--glow);
  animation: tele-sweep 4.5s ease-in-out infinite;
}
@keyframes tele-sweep {
  0% { left: -40%; }
  60%, 100% { left: 110%; }
}

.qlog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.qlog-head .tag { display: flex; align-items: center; gap: 12px; }
.qlog-head .tag::before,
.qlog-head .tag::after {
  content: '';
  height: 1px;
  width: 26px;
  background: linear-gradient(90deg, transparent, var(--line-strong));
}
.qlog-head .tag::after { background: linear-gradient(90deg, var(--line-strong), transparent); }
.qlog-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--glow-soft);
  font-family: var(--font-orbitron);
  font-size: 9px;
  letter-spacing: 1.5px;
  color: var(--accent);
  white-space: nowrap;
}
.qlog-count.done {
  color: var(--accent-bright);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--glow-soft);
}

.qlog-bar {
  height: 7px;
  border: 1px solid var(--line);
  border-radius: 99px;
  background: var(--panel-solid);
  overflow: hidden;
}
.qlog-fill {
  display: block;
  height: 100%;
  width: 0;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--accent), var(--accent-bright));
  box-shadow: 0 0 10px var(--glow);
  transition: width 0.5s ease;
}

.qlog-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.qlog-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
  min-width: 0;
}
.qlog-ico {
  font-size: 16px;
  color: var(--accent);
  flex: none;
}
.qlog-txt {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.qlog-txt b {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qlog-txt small {
  font-family: var(--font-hud);
  font-size: 10.5px;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qlog-xp {
  flex: none;
  padding: 3px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: var(--font-orbitron);
  font-size: 8px;
  letter-spacing: 1px;
  color: var(--text-dim);
}

.qlog-cleared {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 15px 10px;
  border: 1px solid var(--accent);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--glow-soft), transparent);
  box-shadow: inset 0 0 26px var(--glow-soft);
  text-align: center;
}
.qlog-cstar {
  color: var(--accent);
  font-size: 15px;
  animation: qlog-star 1.6s ease-in-out infinite;
}
.qlog-cleared p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-dim);
}
.qlog-cleared b {
  font-family: var(--font-orbitron);
  font-size: 12px;
  letter-spacing: 2.5px;
  color: var(--accent);
}
@keyframes qlog-star {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.sec-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--line-strong), transparent); }

/* Lore */
.lore {
  position: relative;
  padding: 18px 20px 16px 20px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--panel-hi), transparent);
}
.lore p {
  color: var(--text-dim);
  font-family: var(--font-display);
  font-weight: 550;
  font-size: 18px;
  line-height: 1.85;
}
.lore-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  padding: 6px 13px;
  border: 1px solid var(--line);
  border-radius: 99px;
  font-family: var(--font-hud);
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--accent);
  background: var(--bg-0);
}

/* Dev console */
.term {
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Consolas', 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
  background:
    radial-gradient(120% 90% at 12% 8%, var(--glow-soft), transparent 55%),
    radial-gradient(110% 85% at 92% 95%, var(--glow-soft), transparent 55%),
    linear-gradient(180deg, #0b0f1a 0%, #070a12 55%, #0b0714 100%);
  box-shadow: inset 0 0 34px var(--glow-soft), 0 0 0 1px rgba(0, 0, 0, 0.4);
}
.term-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #1b2230, #12161f);
  border-bottom: 1px solid var(--line);
}
.term-bar .dot { width: 11px; height: 11px; border-radius: 50%; }
.term-bar .dot.r { background: #ff5f57; }
.term-bar .dot.y { background: #febc2e; }
.term-bar .dot.g { background: #28c840; }
.term-title {
  margin-left: 8px;
  flex: 1;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: var(--text-dim);
}
.term-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #28c840;
}
.term-live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #28c840;
  box-shadow: 0 0 6px #28c840;
  animation: term-blink 1s infinite;
}
@keyframes term-blink { 50% { opacity: 0.15; } }

.term-body {
  position: relative;
  height: 340px;
  overflow-y: auto;
  padding: 12px 14px;
  font-size: 18px;
  line-height: 1.3;
}
.term-body::-webkit-scrollbar { width: 6px; }
.term-body::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 3px; }

.t-line { margin: 0; white-space: pre-wrap; word-break: break-word; }
.t-line.dim { color: #7f8b9d; }
.t-line.ok { color: #7dd88f; }
.t-line.err { color: #ff6b6b; }
.t-line.warn { color: #ffd166; }
.t-line.gold { color: #ffd76a; text-shadow: 0 0 8px rgba(255, 215, 106, 0.4); }
.t-line.acc { color: var(--accent); }
.t-line.head { color: #e8edf4; font-weight: 600; letter-spacing: 1px; }
.t-line.prompt { color: #8a94a6; }

.t-prompt { display: flex; align-items: center; }
.t-prompt-label { color: var(--accent); white-space: pre; }
.t-input {
  flex: 1;
  min-width: 40px;
  background: transparent;
  border: 0;
  outline: 0;
  color: #e8edf4;
  font: inherit;
  caret-color: var(--accent);
}
.t-cursor {
  width: 8px;
  height: 15px;
  flex: none;
  background: var(--accent);
  animation: term-blink 0.8s steps(1) infinite;
}


/* Active quest */
.objective {
  display: flex;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background:
    radial-gradient(120% 90% at 0% 0%, var(--glow-soft), transparent 55%),
    linear-gradient(180deg, var(--panel-hi), transparent);
  overflow: hidden;
}
.obj-media {
  position: relative;
  flex: none;
  width: 165px;
  aspect-ratio: 1 / 1;
  align-self: flex-start;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-0);
}
.obj-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.objective:hover .obj-thumb { transform: scale(1.06); }
.obj-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 6px;
  font-family: var(--font-orbitron);
  font-size: 8.5px;
  letter-spacing: 1.5px;
  color: #0b0f1a;
  background: linear-gradient(180deg, var(--accent-bright), var(--accent));
  box-shadow: 0 0 12px var(--glow);
}
.obj-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.14), transparent);
  animation: obj-scan 3.2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes obj-scan {
  0% { top: -45%; }
  60%, 100% { top: 110%; }
}
.obj-body { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
.obj-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-orbitron);
  font-size: 9.5px;
  letter-spacing: 1.5px;
  color: var(--accent);
}
.q-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--glow);
  animation: quest-pulse 1.6s ease-in-out infinite;
}
@keyframes quest-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.7); }
}
.obj-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text);
  text-shadow: 0 0 14px var(--glow-soft);
  margin: 5px 0 6px;
}
.obj-desc {
  margin: 0;
  color: var(--text-dim);
  font-size: 12.5px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.obj-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 10px;
}
.obj-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.obj-tag {
  font-family: var(--font-hud);
  font-size: 10px;
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-dim);
}
.obj-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin: 0;
}
.obj-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 15px;
  border-radius: 9px;
  border: 1px solid var(--line-strong);
  font-family: var(--font-hud);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--text);
  transition: all 0.22s ease;
}
.obj-btn i { color: var(--accent); font-size: 14px; }
.obj-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--glow-soft);
  transform: translateY(-1px);
}
.obj-btn.primary {
  border-color: var(--accent);
  color: var(--accent);
  background: linear-gradient(180deg, var(--glow-soft), transparent);
  box-shadow: inset 0 0 14px var(--glow-soft);
}
.obj-btn.primary:hover { box-shadow: 0 0 18px var(--glow); }

@media (max-width: 560px) {
  .left { padding: 14px; }
  .dossier { gap: 14px; padding: 20px 12px 22px; }
  .dossier .medallion { width: min(26vh, 150px); }
  .lv-chip { right: -10%; top: 1%; font-size: 11px; padding: 6px 11px; }
  .np-name { font-size: 19px; letter-spacing: 3px; }
  .realm { font-size: 18px; letter-spacing: 2px; }
  .cult { padding: 14px 12px 13px; }
  .cult-pips { gap: 14px; }
  .right { padding: 16px 14px; gap: 20px; }
  .rp-head { padding: 16px 12px 14px; }
  .qlog-head { flex-wrap: wrap; }
  .qlog-list { grid-template-columns: 1fr; }
  .sec-head { margin-bottom: 14px; }
  .term-body { height: 250px; }
  .objective { flex-direction: column; }
  .obj-media { width: 100%; aspect-ratio: 16 / 9; }
}

/* Footer */
.rp-foot {
  margin-top: auto;
  padding-top: 22px;
  border-top: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.socials { display: flex; gap: 10px; }
.social-btn {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  font-size: 20px;
  color: var(--text-dim);
  transition: all 0.22s ease;
}
.social-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--glow);
  transform: translateY(-2px);
}
.cta { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(160deg, var(--accent-bright), var(--accent));
  font-family: var(--font-hud);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--bg-0);
  box-shadow: 0 0 20px var(--glow);
  cursor: pointer;
  transition: all 0.22s ease;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px var(--glow); }
.btn-primary:active { transform: translateY(0); }
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 22px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  font-family: var(--font-hud);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--accent);
  transition: all 0.22s ease;
}
.btn-ghost:hover {
  background: var(--accent);
  color: var(--bg-0);
  box-shadow: 0 0 20px var(--glow);
}

@media (max-width: 900px) {
  .dossier { gap: 18px; }
  .medallion { width: min(26vh, 200px); }
}

@media (max-width: 760px) {
  .outfit { display: block; overflow-y: auto; }
  .left { border-right: none; border-bottom: 1px solid var(--line); overflow: visible; }
  .right { overflow: visible; }
    .lore p {
    color: var(--text-dim);
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 17px;
    line-height: 1.5;
  }
  .term-body { height: 250px; line-height: 1.2; font-size: 16px;}
  .obj-desc {
    display: none;
  }
}
</style>

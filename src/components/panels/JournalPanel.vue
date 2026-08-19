<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useDevlog } from '../../composables/useDevlog'

const { entries, loading, data } = useDevlog()

const selected = ref(null)
const mobileOpen = ref(false)
const charsShown = ref(0)
const typing = ref(false)
const autoOn = ref(false)
const autoEnded = ref(false)
const progress = ref(0)
const reader = ref(null)
const activeCat = ref('all')

const SPEED = 11
const isMobile = /Mobi|Android|iPhone|iPad|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
const TYPE_BATCH = isMobile ? 3 : 1
let timer = null
let pending = null

const CAT_COLORS = {
  unreal: '#3dce8a',
  unity: '#7fb0ff',
  ai: '#b07bff',
  design: '#d07a3f',
  meta: '#d4af37'
}
const PALETTE = ['#3dce8a', '#7fb0ff', '#b07bff', '#d07a3f', '#d4af37', '#4fd6e0']

function catColor(cat) {
  if (CAT_COLORS[(cat || '').toLowerCase()]) return CAT_COLORS[(cat || '').toLowerCase()]
  let h = 0
  for (const ch of String(cat)) h = (h * 31 + ch.charCodeAt(0)) % 997
  return PALETTE[h % PALETTE.length]
}

const catTags = (e) =>
  String(e.category || 'misc')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const cats = computed(() => {
  const m = new Map()
  for (const e of entries.value) {
    for (const c of catTags(e)) m.set(c, (m.get(c) || 0) + 1)
  }
  return [...m.entries()].map(([name, count]) => ({ name, count }))
})

const order = computed(() =>
  activeCat.value === 'all'
    ? entries.value
    : entries.value.filter((e) => catTags(e).includes(activeCat.value))
)

const current = computed(() => order.value.find((e) => e.id === selected.value) || null)
const currentIdx = computed(() => order.value.findIndex((e) => e.id === selected.value))

const bodyText = (e) =>
  (e?.body || []).reduce((acc, s) => {
    const isMark = /^[✦•]/.test(s.trim()) || /^<h[23]>/.test(s.trim())
    return acc ? acc + (isMark ? '\n' + s + '\n' : ' ' + s) : s
  }, '')

const normalizeBody = (e) =>
  bodyText(e)
    .replace(/\s*✦\s+/g, '\n✦ ')
    .replace(/\s*•\s+/g, '\n• ')
    .replace(/ *\n */g, '\n')

const totalChars = (e) => normalizeBody(e).length
const words = computed(() => (current.value ? Math.round(totalChars(current.value) / 5.5) : 0))
const readMin = computed(() => Math.max(1, Math.ceil(words.value / 200)))

const lineSegments = (line) => {
  const re = /<h([23])>([\s\S]*?)<\/h\1>/g
  const segs = []
  let last = 0
  let m
  while ((m = re.exec(line))) {
    if (m.index > last) segs.push({ kind: 'text', text: line.slice(last, m.index) })
    segs.push({ kind: 'head', level: 'h' + m[1], text: m[2].trim() })
    last = m.index + m[0].length
  }
  if (last < line.length) segs.push({ kind: 'text', text: line.slice(last) })
  if (!segs.length) segs.push({ kind: 'text', text: line })
  return segs
}

function bodyLines() {
  const e = current.value
  if (!e) return []
  const raw = normalizeBody(e)
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length)
  const target = typing.value ? charsShown.value : Infinity
  let used = 0
  let activeIdx = -1
  const out = []
  raw.forEach((line, i) => {
    const len = line.length
    let take = len
    let active = false
    if (used + len > target) {
      take = Math.max(0, target - used)
      if (take < len && activeIdx === -1) activeIdx = i
      active = i === activeIdx
    }
    used += len + 1
    const mm = line.match(/^[•✦]\s*/)
    const mark = mm ? (mm[0].trim() === '•' ? 'sub' : 'bullet') : null
    const body = mm ? line.slice(mm[0].length) : line
    const segs = lineSegments(body)
    let remain = take
    const revealed = []
    for (const s of segs) {
      if (remain <= 0) break
      if (remain >= s.text.length) {
        revealed.push({ ...s, active: false })
        remain -= s.text.length
      } else {
        revealed.push({ ...s, text: s.text.slice(0, remain), active: true })
        remain = 0
      }
    }
    const singleHead = segs.length === 1 && segs[0].kind === 'head'
    out.push({
      mark,
      singleHead,
      level: singleHead ? segs[0].level : null,
      segs: revealed,
      hasHead: segs.some((s) => s.kind === 'head'),
      visible: revealed.some((s) => s.text.length),
      active
    })
  })
  return out
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
}
function stopPending() {
  if (pending) { clearTimeout(pending); pending = null }
}

function select(id, instant = false, open = true) {
  stopTimer(); stopPending()
  if (open) mobileOpen.value = true
  selected.value = id
  progress.value = 0
  if (reader.value) reader.value.scrollTop = 0
  const e = order.value.find((x) => x.id === id)
  if (!e) return
  charsShown.value = instant ? totalChars(e) : 0
  typing.value = !instant
  if (!instant) {
    timer = setInterval(() => {
      charsShown.value += TYPE_BATCH
      if (charsShown.value >= totalChars(e)) { stopTimer(); typing.value = false }
    }, SPEED)
  }
}

function skipTyping() {
  if (typing.value && current.value) select(current.value.id, true)
}

function closeReader() {
  stopTimer(); stopPending()
  mobileOpen.value = false
}

watch(typing, (t) => {
  if (!t && autoOn.value && !autoEnded.value && currentIdx.value < order.value.length - 1) {
    stopPending()
    pending = setTimeout(() => {
      const idx = currentIdx.value
      if (idx < order.value.length - 1) select(order.value[idx + 1].id)
    }, 2600)
  } else if (!t && currentIdx.value === order.value.length - 1 && autoOn.value) {
    autoOn.value = false
    autoEnded.value = true
  }
})

function toggleAuto() {
  autoOn.value = !autoOn.value
  stopPending()
  if (autoOn.value) {
    autoEnded.value = false
    if (!typing.value && currentIdx.value < order.value.length - 1) {
      pending = setTimeout(() => {
        const idx = currentIdx.value
        if (idx < order.value.length - 1) select(order.value[idx + 1].id)
      }, 2600)
    }
  }
}

function next() {
  const idx = currentIdx.value
  if (idx >= 0 && idx < order.value.length - 1) select(order.value[idx + 1].id)
  else if (idx === order.value.length - 1) select(order.value[0].id)
}
function prev() {
  const idx = currentIdx.value
  if (idx > 0) select(order.value[idx - 1].id)
}

function setCat(c) {
  activeCat.value = c
  if (order.value.length && !order.value.some((e) => e.id === selected.value)) select(order.value[0].id, false, false)
  else if (!order.value.length) selected.value = null
}

function onScroll() {
  const el = reader.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0
}

watch(charsShown, async () => {
  if (!typing.value) return
  await nextTick()
  const wrap = reader.value
  if (!wrap) return
  const caret = wrap.querySelector('.r-body .caret')
  if (!caret) return
  const wr = wrap.getBoundingClientRect()
  const cr = caret.getBoundingClientRect()
  if (cr.bottom > wr.bottom - 24) wrap.scrollTop += cr.bottom - (wr.bottom - 24)
  else if (cr.top < wr.top + 24) wrap.scrollTop -= wr.top + 24 - cr.top
})

function fmtDate(d) {
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}
function stamp(d) {
  const dt = new Date(d)
  if (isNaN(dt)) return d
  const p = (n) => String(n).padStart(2, '0')
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${String(dt.getFullYear()).slice(2)}`
}

function onKeydown(e) {
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopTimer(); stopPending()
})

watch(
  () => order.value.length,
  (n) => {
    if (n && !order.value.some((e) => e.id === selected.value)) select(order.value[0].id, false, false)
  },
  { immediate: true }
)
</script>

<template>
  <div class="journal panel">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>

    <header class="j-head">
      <div class="j-titlebox">
        <div class="j-kicker">
          <span class="j-prompt">&gt;</span>
          <span class="eyebrow">JOURNAL</span>
        </div>
        <h2 class="head-name">DEVLOG</h2>
        <p class="j-sub">// {{ data?.subtitle || 'the wanderer\'s build log' }}</p>
      </div>

      <div class="j-controls">
        <span class="rec">
          <span class="rec-dot"></span>
          <span class="hud-label">SESSION ACTIVE</span>
        </span>
        <button class="auto-btn" :class="{ on: autoOn }" @click="toggleAuto">
          <span class="auto-ring" :class="{ spin: autoOn }"></span>
          <span class="hud-label">{{ autoOn ? 'AUTO ▶ ON' : 'AUTO ▶' }}</span>
        </button>
        <div class="j-count">
          <i class="bx bxs-book-open"></i>
          <span class="hud-label">{{ String(entries.length).padStart(2, '0') }} RECORDS</span>
        </div>
      </div>
    </header>

    <div v-if="loading" class="j-load">
      <span class="spinner"></span>
      <span class="hud-label">READING JOURNAL…</span>
    </div>

    <div v-else class="j-main" :class="{ 'mobile-open': mobileOpen }">
      <aside class="j-list">
        <div class="win-bar">
          <span class="w-dot r"></span><span class="w-dot y"></span><span class="w-dot g"></span>
          <span class="w-file">log_stream.sh</span>
        </div>

        <div class="filters">
          <button class="f-chip" :class="{ on: activeCat === 'all' }" @click="setCat('all')">
            ALL <span class="f-cnt">{{ entries.length }}</span>
          </button>
          <button
            v-for="c in cats"
            :key="c.name"
            class="f-chip"
            :class="{ on: activeCat === c.name }"
            :style="{ '--cc': catColor(c.name) }"
            @click="setCat(c.name)"
          >
            {{ c.name.toUpperCase() }} <span class="f-cnt">{{ c.count }}</span>
          </button>
        </div>

        <div class="list-body">
          <button
            v-for="(e, i) in order"
            :key="e.id"
            class="j-row"
            :class="{ active: selected === e.id }"
            :style="{ '--cc': catColor(catTags(e)[0]) }"
            @click="select(e.id)"
          >
            <span class="led" :class="{ pulse: selected === e.id }"></span>
            <span class="j-row-body">
              <span class="j-title">{{ e.title }}</span>
              <span class="j-row-meta">
                <span class="j-stamp">[{{ stamp(e.date) }}]</span>
                <span class="j-cat">
                  <template v-for="(t, ti) in catTags(e)" :key="ti">
                    <span class="j-tag" :style="{ '--cc': catColor(t) }">[{{ t }}]</span>
                  </template>
                </span>
              </span>
            </span>
            <span class="j-idx">{{ String(i + 1).padStart(2, '0') }}</span>
          </button>

          <div v-if="!order.length" class="list-empty">
            <i class="bx bx-filter-alt"></i>
            <span class="hud-label">NO RECORDS IN FILTER.</span>
          </div>
        </div>
      </aside>

      <section ref="reader" class="j-reader" @scroll="onScroll">
        <div class="term">
          <div class="term-bar">
            <span class="w-dot r"></span><span class="w-dot y"></span><span class="w-dot g"></span>
            <span class="w-file">read_devlog.log</span>
            <button class="r-back" type="button" @click="closeReader">
              <i class="bx bx-left-arrow-alt"></i> <span class="hud-label">BACK</span>
            </button>
            <span class="t-state"><span class="t-state-dot"></span> BUFFER {{ String(progress).padStart(2, '0') }}%</span>
          </div>

          <template v-if="current">
            <div class="r-head">
              <div class="r-meta">
                <span class="r-cat">
                  <template v-for="(t, ti) in catTags(current)" :key="ti">
                    <span class="r-tag" :style="{ '--cc': catColor(t) }">{{ t }}</span>
                  </template>
                </span>
                <span class="r-date">{{ stamp(current.date) }}</span>
                <span class="r-readtime">~{{ readMin }} MIN</span>
                <span class="r-idx">ENTRY {{ currentIdx + 1 }}/{{ order.length }}</span>
              </div>
              <h2 class="r-title">
                <span class="r-title-prompt">&gt;</span>{{ current.title }}
              </h2>
              <p class="r-prev" v-if="currentIdx > 0" @click="prev">Prev Page: {{ order[currentIdx - 1].title }}</p>
            </div>

            <div class="r-body" @click="skipTyping">
              <template v-for="(l, i) in bodyLines()" :key="i">
                <h2 v-if="!l.mark && l.singleHead && l.level === 'h2' && (l.visible || l.active)" class="bl-h2">{{ l.segs[0].text }}<span v-if="l.active" class="caret"></span></h2>
                <h3 v-else-if="!l.mark && l.singleHead && l.level === 'h3' && (l.visible || l.active)" class="bl-h3">{{ l.segs[0].text }}<span v-if="l.active" class="caret"></span></h3>
                <div v-else-if="l.mark && (l.visible || l.active)" class="bl-line" :class="{ 'bl-sub': l.mark === 'sub', 'bl-hybrid': l.hasHead }">
                  <span class="bullet">{{ l.mark === 'sub' ? '\u2022' : '\u2726' }}</span>
                  <span v-for="(s, j) in l.segs" :key="j" class="bl-seg" :class="s.kind === 'head' ? ('bl-head is-' + s.level) : ''">{{ s.text }}</span>
                  <span v-if="l.active" class="caret"></span>
                </div>
                <p v-else-if="l.hasHead && (l.visible || l.active)">
                  <span v-for="(s, j) in l.segs" :key="j" class="bl-seg" :class="s.kind === 'head' ? ('bl-head is-' + s.level) : ''">{{ s.text }}</span>
                  <span v-if="l.active" class="caret"></span>
                </p>
                <p v-else-if="l.visible || l.active">{{ l.segs.map((s) => s.text).join('') }}<span v-if="l.active" class="caret"></span></p>
              </template>
              <p v-if="currentIdx === 0 && !typing" class="r-end">
                ⏎ EOF - YOU'RE CAUGHT UP. THE STORY CONTINUES SOON.
              </p>
            </div>

            <div class="r-nav">
              <button class="nav-btn" :disabled="currentIdx <= 0" @click="prev">
                <i class="bx bx-chevrons-left"></i> PREV
              </button>
              <span class="nav-pos">[ <i class="bx bx-walk"></i> {{ currentIdx + 1 }}/{{ order.length }} ]</span>
              <button class="nav-btn" @click="next">
                {{ currentIdx === order.length - 1 ? 'LOOP ↻' : 'NEXT' }}
                <i class="bx bx-chevrons-right"></i>
              </button>
            </div>
          </template>

          <div v-else class="reader-empty">
            <i class="bx bx-book-alt"></i>
            <span class="hud-label">SELECT AN ENTRY TO BEGIN READING.</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
:root, .journal {
  --mono: 'Consolas', 'Cascadia Mono', 'JetBrains Mono', 'SF Mono', monospace;
}

.journal {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, var(--panel-solid), var(--panel));
}

/* HUD corner brackets */
.corner {
  position: absolute;
  width: 18px;
  height: 18px;
  z-index: 40;
  pointer-events: none;
  opacity: 0.9;
}
.corner.tl { top: 8px; left: 8px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.tr { top: 8px; right: 8px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); }
.corner.bl { bottom: 8px; left: 8px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }

/* Header */
.j-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(16px, 2.4vw, 26px) clamp(18px, 3vw, 28px);
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, var(--bg-1), transparent);
}
.j-titlebox { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.j-kicker { display: flex; align-items: center; gap: 8px; }
.j-prompt { font-family: var(--mono); color: var(--accent); font-size: 16px; }
.eyebrow { font-family: var(--font-orbitron); font-size: 10px; letter-spacing: 3px; color: var(--text-dim); }
.head-name {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent);
  text-shadow: 0 0 18px var(--glow);
}
.j-sub { width: 100%; margin-top: 4px; color: var(--text-dim); font-family: var(--mono); font-size: 12px; opacity: 0.8; }

.j-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.rec { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-0); }
.rec .hud-label { font-size: 9px; letter-spacing: 1.5px; color: var(--text-dim); }
.rec-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 0 8px var(--glow);
  animation: rec-blink 1.4s ease-in-out infinite;
}
@keyframes rec-blink { 50% { opacity: 0.25; } }
.j-count { display: flex; align-items: center; gap: 8px; color: var(--accent); font-size: 20px; }
.j-count .hud-label { color: var(--text-dim); font-size: 10px; font-family: var(--mono); }

.auto-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-1);
  color: var(--text-dim);
  cursor: pointer;
  font-family: var(--mono);
  transition: all 0.25s ease;
}
.auto-btn:hover { border-color: var(--accent); color: var(--accent); }
.auto-btn.on { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 14px var(--glow-soft); }
.auto-btn .hud-label { font-size: 9px; letter-spacing: 1.5px; font-family: var(--mono); }
.auto-ring { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--line-strong); border-top-color: transparent; }
.auto-ring.spin { animation: auto-spin 1s linear infinite; border-top-color: var(--accent); }
@keyframes auto-spin { to { transform: rotate(360deg); } }

.j-load { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--text-dim); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--line); border-top-color: var(--accent); border-radius: 50%; animation: auto-spin 0.9s linear infinite; }

/* Main two-pane */
.j-main { flex: 1; min-height: 0; display: flex; gap: 0; }

/* Left - log stream */
.j-list {
  flex: none;
  width: 450px;
  min-width: 290px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--line);
  background: linear-gradient(180deg, var(--bg-1), var(--panel));
}
.win-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-0);
}
.w-dot { width: 9px; height: 9px; border-radius: 50%; }
.w-dot.r { background: #e05d5d; } .w-dot.y { background: #d4af37; } .w-dot.g { background: #3dce8a; }
.w-file {
  margin-left: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-dim);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}
.f-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  border: 1px solid var(--line);
  background: var(--bg-0);
  border-radius: 4px;
  padding: 4px 9px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.f-chip:hover { color: var(--text); border-color: var(--line-strong); }
.f-chip.on {
  color: var(--cc, var(--accent));
  border-color: var(--cc, var(--accent));
  box-shadow: 0 0 10px var(--glow-soft);
}
.f-cnt { font-size: 9px; opacity: 0.7; }

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.j-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  padding: 10px 10px 10px 12px;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.18s ease;
}
.j-row:hover { background: var(--panel-hi); border-color: var(--line); }
.j-row.active {
  background: linear-gradient(90deg, var(--glow-soft), var(--panel-hi));
  border-color: var(--line);
  border-left-color: var(--cc);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.25);
}
.led {
  flex: none;
  margin-top: 6px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--cc);
  box-shadow: 0 0 8px var(--cc);
}
.led.pulse { animation: rec-blink 1.2s ease-in-out infinite; }
.j-row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.j-row-meta { display: flex; align-items: center; gap: 8px; }
.j-stamp { font-family: var(--mono); font-size: 8px; color: var(--text-dim); }
.j-cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.j-tag {
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--cc);
}
.j-title {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 1px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.j-row.active .j-title { color: var(--cc); text-shadow: 0 0 12px var(--glow-soft); }
.j-idx { font-family: var(--mono); font-size: 10px; color: var(--text-dim); opacity: 0.45; margin-top: 6px; }
.list-empty { padding: 30px 10px; text-align: center; color: var(--text-dim); font-size: 26px; display: flex; flex-direction: column; gap: 10px; align-items: center; }

/* Right - terminal reader */
.j-reader {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 15px;
  background: linear-gradient(180deg, var(--panel-hi), var(--panel));
}

.term {
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, var(--panel-hi), var(--panel-solid));
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(0, 0, 0, 0.2);
}
.term-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-0);
}
.t-state { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; color: var(--text-dim); }
.t-state-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--glow); animation: rec-blink 1.4s ease-in-out infinite; }

.r-head { padding: clamp(20px, 3vw, 34px) clamp(22px, 3.5vw, 44px) 6px; }
.r-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
.r-cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.r-tag {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--cc, var(--accent));
  border: 1px solid var(--cc, var(--accent));
  padding: 3px 10px;
  border-radius: 3px;
  box-shadow: 0 0 12px var(--glow-soft);
}
.r-date, .r-readtime, .r-idx { font-family: var(--mono); font-size: 11px; letter-spacing: 1px; color: var(--text-dim); text-transform: uppercase; }
.r-title {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.8vw, 30px);
  font-weight: 550;
  line-height: 1;
  letter-spacing: 0.5px;
  color: var(--text);
}
.r-title-prompt { font-family: var(--mono);  color: var(--accent); margin-right: 8px; text-shadow: 0 0 10px var(--glow); }
.r-prev {
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-dim);
  cursor: pointer;
  opacity: 0.7;
  transition: color 0.2s ease;
  max-width: 460px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-prev:hover { color: var(--accent); opacity: 1; }

.r-body {
  padding: 12px clamp(22px, 3.5vw, 44px) 26px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.r-body p {
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.5;
  letter-spacing: 1px;
  color: var(--text-dim);
  padding-left: 14px;
}
.bullet { color: var(--accent); margin-right: 6px; font-size: 10px; }
.bl-line {
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.5;
  letter-spacing: 1px;
  color: var(--text-dim);
  border-left-color: var(--accent);
  padding-left: 18px;
  margin-left: 4px;
}
.bl-line .bullet { text-shadow: 0 0 8px var(--glow); }
.bl-h2 {
  margin: 15px 0 6px;
  font-size: 24px;
  letter-spacing: 1.5px;
  color: var(--accent);
}

.bl-h3 {
  margin: 14px 0 4px;
  font-size: 20px;
  letter-spacing: 1px;
  color: var(--accent);
}
.bl-sub {
  margin-left: 25px;
  border-left-color: var(--line-strong);
}
.bl-sub .bullet { color: var(--muted); }
.bl-hybrid {
  align-items: baseline;
  gap: 8px;
}
.bl-head.is-h2 {
  font-size: 20px;
  letter-spacing: 1.2px;
  color: var(--accent);
  font-weight: 700;
}
.bl-head.is-h3 {
  font-size: 16px;
  letter-spacing: 1px;
  color: var(--accent);
  font-weight: 700;
}
.bl-hybrid .bullet { margin-top: 4px; }
.caret {
  display: inline-block;
  width: 8px;
  height: 16px;
  margin-left: 2px;
  vertical-align: -3px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--glow);
}
.r-end {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--accent);
  opacity: 0.85;
  border: 1px dashed var(--line-strong);
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 10px;
}

.r-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px clamp(22px, 3.5vw, 44px) 18px;
  border-top: 1px solid var(--line);
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--accent);
  background: var(--bg-1);
  border: 1px solid var(--line-strong);
  padding: 9px 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: color 0.2s ease, border-color 0.2s ease;
}
.nav-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--accent), var(--accent-bright));
  transform: translateX(-110%);
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 0;
}
.nav-btn:hover:not(:disabled) { color: var(--bg-0); border-color: var(--accent); box-shadow: 0 0 16px var(--glow-soft); }
.nav-btn:hover:not(:disabled)::before { transform: translateX(0); }
.nav-btn:disabled { opacity: 0.35; cursor: default; }
.nav-btn i, .nav-btn { position: relative; z-index: 1; }
.nav-pos { font-family: var(--mono); font-size: 11px; color: var(--text-dim); }

.r-back {
  display: none;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-1);
  color: var(--accent);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 11px;
  transition: all 0.22s ease;
}
.r-back:hover { border-color: var(--accent); box-shadow: 0 0 12px var(--glow-soft); }
.r-back i { font-size: 15px; }

.reader-empty { padding: 60px 20px; text-align: center; color: var(--text-dim); font-size: 30px; display: flex; flex-direction: column; gap: 12px; align-items: center; }

@media (max-width: 900px) {
  .j-main { flex-direction: column; }
  .j-list { width: 100%; min-width: 0; max-height: 38%; border-right: none; border-bottom: 1px solid var(--line); }
  .r-head, .r-body, .r-nav { padding-left: 18px; padding-right: 18px; }
}

@media (max-width: 760px) {
  .j-head { padding: 15px 22px; }
  .j-controls { display: none; }
  .eyebrow, .j-sub { display: none; }
  .j-prompt { display: none;}
  .j-titlebox h2 { font-size: 25px; letter-spacing: 1px; padding-top: 6px; }

  .win-bar { display: none; }
  .filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding: 8px 12px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .filters::-webkit-scrollbar { display: none; }
  .f-chip { flex: none; padding: 5px 10px; font-size: 9px; }

  .list-body { padding: 8px 8px 20px; gap: 2px; }
  .j-row { padding: 9px 10px 9px 11px; gap: 8px; }
  .led { display: none; }
  .j-idx { display: none; }
  .j-title { font-size: 14px; }
  .j-stamp { font-size: 9px; }
  .j-cat { font-size: 8px; }

  .j-main { position: relative; flex: 1; min-height: 0; }
  .j-list { max-height: none; height: 100%; border-bottom: none; }
  .j-reader { display: none; }
  .j-main.mobile-open .j-list { display: none; }
  .j-main.mobile-open .j-reader {
    display: block;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .j-main.mobile-open .j-reader .term {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100%;
  }
  .r-back { display: inline-flex; }

  .term-bar { padding: 6px 8px; }
  .w-dot, .w-file, .t-state { display: none; }
  .r-head { padding: 16px 14px 4px; }
  .r-meta { margin-bottom: 10px; gap: 8px; }
  .r-readtime, .r-idx, .r-prev { display: none; }
  .r-title { font-size: 24px; line-height: 1.3;}
  .r-body { padding: 10px 14px 20px; gap: 1px; }
  .r-body p { font-size: 18px; line-height: 1.75; padding-left: 12px; }
  .r-nav { padding: 10px 14px 14px; }
  .nav-btn { padding: 9px 12px; font-size: 10px; }
  .nav-pos { display: none; }

  .bl-h2 {
    margin: 15px 0 6px;
    font-size: 20px;
    letter-spacing: 1.5px;
    color: var(--accent);
  }

  .bl-h3 {
    margin: 14px 0 4px;
    font-size: 18px;
    letter-spacing: 1px;
    color: var(--accent);
  }

  .corner {
    position: absolute;
    width: 18px;
    height: 18px;
    z-index: 40;
    pointer-events: none;
    opacity: 0.9;
    display: none;
  }
}
</style>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  project: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const videoLoaded = ref(false)

watch(
  () => props.project,
  (p) => {
    videoLoaded.value = false
    if (p) {
      const t = setTimeout(() => (videoLoaded.value = true), 80)
      return () => clearTimeout(t)
    }
  }
)

function onKeydown(e) {
  if (e.key === 'Escape' && props.project) {
    e.stopPropagation()
    close()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))

function close() {
  emit('close')
}

function parseLine(line) {
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

function descLines() {
  const desc = props.project?.description
  if (!Array.isArray(desc)) return []
  return desc.map((raw) => {
    const trimmed = String(raw).trim()
    const isMark = /^[✦•]/.test(trimmed)
    const mark = isMark ? (trimmed.startsWith('•') ? 'sub' : 'bullet') : null
    const body = isMark ? trimmed.replace(/^[✦•]\s*/, '') : trimmed
    const segs = parseLine(body)
    const singleHead = segs.length === 1 && segs[0].kind === 'head'
    return {
      mark,
      singleHead,
      level: singleHead ? segs[0].level : null,
      segs,
      hasHead: segs.some((s) => s.kind === 'head')
    }
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="project" class="modal-mask" @click.self="close">
      <div class="modal panel" role="dialog" aria-modal="true">
        <button class="close-btn" @click="close" aria-label="Close">✕</button>

        <div class="video-box">
          <iframe
            v-if="videoLoaded"
            :src="project.video"
            allow="autoplay; fullscreen"
            allowfullscreen
            frameborder="0"
            title="Project video"
          ></iframe>
          <div v-else class="vid-placeholder">
            <i class="bx bx-film"></i>
            <span class="hud-label">LOADING FEED…</span>
          </div>
        </div>

        <div class="modal-body">
          <div class="mb-head">
            <span class="hud-label">ITEM DETAILS</span>
            <h2 class="mb-title">{{ project.title }}</h2>
          </div>

          <div class="mb-desc">
            <template v-for="(l, i) in descLines()" :key="'d' + i">
              <h2 v-if="!l.mark && l.singleHead && l.level === 'h2'" class="desc-h2">{{ l.segs[0].text }}</h2>
              <h3 v-else-if="!l.mark && l.singleHead && l.level === 'h3'" class="desc-h3">{{ l.segs[0].text }}</h3>
              <div v-else-if="l.mark" class="desc-line" :class="{ 'desc-sub': l.mark === 'sub', 'desc-hybrid': l.hasHead }">
                <span class="bullet">{{ l.mark === 'sub' ? '\u2022' : '\u2726' }}</span>
                <span v-for="(s, j) in l.segs" :key="j" class="desc-seg" :class="s.kind === 'head' ? ('desc-head is-' + s.level) : ''">{{ s.text }}</span>
              </div>
              <p v-else-if="l.hasHead">
                <span v-for="(s, j) in l.segs" :key="j" class="desc-seg" :class="s.kind === 'head' ? ('desc-head is-' + s.level) : ''">{{ s.text }}</span>
              </p>
              <p v-else>{{ l.segs.map((s) => s.text).join('') }}</p>
            </template>
          </div>

          <div v-if="Array.isArray(project.extra) && project.extra.length" class="mb-extra">
            <h4 class="extra-head">{{ project.extra[0] }}</h4>
            <ul>
              <li v-for="(x, i) in project.extra.slice(1)" :key="'x' + i">
                <span class="bullet">✦</span> {{ x }}
              </li>
            </ul>
          </div>

          <div class="tech">
            <span v-for="t in project.tech" :key="t" class="tech-box">{{ t }}</span>
          </div>

          <div class="links">
            <a v-if="project.repo" :href="project.repo" target="_blank" rel="noopener" class="btn-link">
              <i class="bx bxl-github"></i> View Repo
            </a>
            <a v-if="project.live" :href="project.live" target="_blank" rel="noopener" class="btn-link">
              <i class="bx bx-play"></i> Live Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5, 4, 2, 0.82);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 20px;
  animation: fade-in 0.25s ease both;
}

.modal {
  width: min(880px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: rise-in 0.3s ease both;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: var(--panel-solid);
  color: var(--text-dim);
  font-size: 16px;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
}
.close-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: rotate(90deg);
}

.video-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  flex: none;
}
.video-box iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.vid-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-dim);
  font-size: 30px;
}

.modal-body {
  padding: 22px 26px 26px;
  overflow-y: auto;
}

.mb-head { margin-bottom: 16px; }
.mb-head h2 { font-size: clamp(19px, 2.4vw, 26px); }
.mb-title {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  letter-spacing: 2px;
  padding-top: 10px;
  color: var(--accent);
  text-shadow: 0 0 18px var(--glow);
}

.mb-desc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--text-dim);
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.7;
}
.mb-desc p {
  padding-left: 14px;
}
.mb-desc .desc-h2 {
  margin: 12px 0 4px;
  font-size: 22px;
  letter-spacing: 1.5px;
  color: var(--accent);
}
.mb-desc .desc-h3 {
  margin: 10px 0 4px;
  font-size: 18px;
  letter-spacing: 1px;
  color: var(--accent);
}
.mb-desc .desc-line {
  display: flexbox;
  align-items: baseline;
  gap: 4px;
  padding-left: 16px;
  margin-left: 4px;
}
.mb-desc .desc-sub {
  margin-left: 22px;
}
.mb-desc .desc-sub .bullet { color: var(--muted); }
.mb-desc .desc-hybrid {
  align-items: baseline;
  gap: 6px;
}
.mb-desc .desc-seg.desc-head.is-h2 {
  font-size: 18px;
  letter-spacing: 1.2px;
  color: var(--accent);
  font-weight: 700;
}
.mb-desc .desc-seg.desc-head.is-h3 {
  font-size: 16px;
  letter-spacing: 1px;
  color: var(--accent);
  font-weight: 700;
}
.bullet {
  color: var(--accent);
  margin-right: 6px;
  font-size: 10px;
  flex-shrink: 0;
  text-shadow: 0 0 8px var(--glow);
}

.mb-extra {
  margin-top: 20px;
  padding: 16px;
  border: 1px dashed var(--line-strong);
  font-family: var(--font-display);
  border-radius: 10px;
  background: var(--glow-soft);
}
.extra-head {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
}
.mb-extra ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mb-extra li { font-size: 18px; color: var(--text-dim); line-height: 1.6; }

.tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.tech-box {
  font-family: var(--font-hud);
  font-size: 12px;
  letter-spacing: 0.5px;
  padding: 5px 11px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  color: var(--accent);
  background: var(--glow-soft);
}

.links {
  display: flex;
  gap: 12px;
  margin-top: 22px;
  flex-wrap: wrap;
}
.btn-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  font-family: var(--font-hud);
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--accent);
  transition: all 0.2s ease;
}
.btn-link:hover {
  background: var(--accent);
  color: var(--bg-0);
  box-shadow: 0 0 20px var(--glow);
}

@media (max-width: 760px) {
  .modal-mask {
    padding: 10px;
  }
  .modal {
    max-height: 90vh;
  }
  .video-box iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .mb-desc .desc-h2 {
    margin: 12px 0 4px;
    font-size: 16px;
    letter-spacing: 1.4px;
    color: var(--accent);
  }
  .mb-desc .desc-h3 {
    margin: 10px 0 4px;
    font-size: 15px;
    letter-spacing: 1px;
    color: var(--accent);
  }

  .mb-desc {
    display: flex;
    flex-direction: column;
    gap: 1px;
    color: var(--text-dim);
    font-family: var(--font-display);
    font-size: 15px;
    letter-spacing: 0.5px;
    line-height: 1.4;
  }

  .mb-desc .desc-seg.desc-head.is-h2 {
    font-size: 16px;
    letter-spacing: 1px;
    color: var(--accent);
    font-weight: 500;
  }
  .mb-desc .desc-seg.desc-head.is-h3 {
    font-size: 15px;
    letter-spacing: 1px;
    color: var(--accent);
    font-weight: 500;
  }
}

</style>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import InventoryItem from '../project/InventoryItem.vue'
import ProjectDetailModal from '../project/ProjectDetailModal.vue'
import { tell } from '../../stores/companion'

const props = defineProps({
  data: { type: Object, required: true }
})

const RARITY = {
  legendary: { label: 'Legendary', color: '#d4af37', shell: '#4a3c12', tint: 'rgba(212,175,55,0.18)', glow: 'rgba(212,175,55,0.5)', frameGlow: 'rgba(212,175,55,0.4)', weight: '64 MB', cat: 'Completed' },
  epic: { label: 'Epic', color: '#b07bff', shell: '#3a2a55', tint: 'rgba(176,123,255,0.18)', glow: 'rgba(176,123,255,0.5)', frameGlow: 'rgba(176,123,255,0.4)', weight: '32 MB', cat: 'Tech Demos' },
  uncommon: { label: 'Uncommon', color: '#3dce8a', shell: '#1c3f31', tint: 'rgba(61,206,138,0.18)', glow: 'rgba(61,206,138,0.45)', frameGlow: 'rgba(61,206,138,0.35)', weight: '16 MB', cat: 'Experiments' },
  worn: { label: 'Worn', color: '#8a8f98', shell: '#3a3d42', tint: 'rgba(138,143,152,0.18)', glow: 'rgba(138,143,152,0.4)', frameGlow: 'rgba(138,143,152,0.3)', weight: '0KB', cat: 'Failures' }
}

const FILTERS = [
  { id: 'all', label: 'All', icon: 'bx-grid-alt' },
  { id: 'legendary', label: 'Legendary', icon: 'bx-trophy' },
  { id: 'epic', label: 'Epic', icon: 'bx-star' },
  { id: 'uncommon', label: 'Uncommon', icon: 'bx-cube' },
  { id: 'worn', label: 'Worn', icon: 'bx-shield-alt' }
]

const filter = ref('all')
const items = ref([])
const selected = ref(null)
const open = ref(false)

function flatten() {
  const out = []
  const push = (list, rarity) => {
    for (const p of list || []) out.push({ ...p, rarity, rarityMeta: RARITY[rarity] })
  }
  push(props.data?.projects?.['completed-games'], 'legendary')
  push(props.data?.projects?.['tech-demos'], 'epic')
  push(props.data?.projects?.['personal-projects']?.experimental, 'uncommon')
  push(props.data?.projects?.['personal-projects']?.failure, 'worn')
  items.value = out
}

const filtered = computed(() =>
  filter.value === 'all' ? items.value : items.value.filter((i) => i.rarity === filter.value)
)

const counts = computed(() => {
  const c = { all: items.value.length }
  for (const r of ['legendary', 'epic', 'uncommon', 'worn']) c[r] = items.value.filter((i) => i.rarity === r).length
  return c
})

function openItem(item) {
  selected.value = item
  open.value = true
  tell('artifact_' + item.rarity, item.title)
}
function closeModal() {
  open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') closeModal()
}
onMounted(() => {
  flatten()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="inv panel">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>

    <header class="inv-head">
      <div class="inv-title">
        <div class="inv-kicker">
          <span class="inv-prompt">&gt;</span>
          <span class="eyebrow">INVENTORY</span>
        </div>
        <h2 class="head-name">RESOURCES</h2>
        <p class="inv-sub">// Every realm you've forged, catalogued as artifacts · click to inspect</p>
      </div>

      <div class="inv-controls">
        <div class="seg">
          <button
            v-for="f in FILTERS"
            :key="f.id"
            :class="{ active: filter === f.id }"
            @click="filter = f.id"
          >
            <i class="bx filter-ic" :class="f.icon"></i>
            <span class="lbl">{{ f.label }}</span>
            <span class="cnt">{{ counts[f.id] }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="grid">
      <InventoryItem
        v-for="(item, i) in filtered"
        :key="item.id"
        :item="item"
        :rarity="item.rarityMeta"
        :rarity-key="item.rarity"
        :index="i"
        @open="openItem"
      />
      <div v-if="!filtered.length" class="empty-slot">
        <i class="bx bx-search-alt"></i>
        <p>No resources found in the inventory.</p>
      </div>
    </div>

    <footer class="inv-foot">
      <span class="hud-label">
        {{ filtered.length }} / {{ items.length }} RESOURCES STORED · "Every craftsman keeps their failures."
      </span>
      <span class="hud-label gold"> CLICK TO INSPECT</span>
    </footer>

    <ProjectDetailModal :project="open ? selected : null" @close="closeModal" />
  </div>
</template>

<style scoped>

.root, .inv {
  --mono: 'Consolas', 'Cascadia Mono', 'JetBrains Mono', 'SF Mono', monospace;
}

.inv {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, var(--panel-solid), var(--panel));
}

.corner { position: absolute; width: 16px; height: 16px; z-index: 6; pointer-events: none; opacity: 0.9; }
.corner.tl { top: 8px; left: 8px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.tr { top: 8px; right: 8px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); }
.corner.bl { bottom: 8px; left: 8px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); }
.corner.br { bottom: 8px; right: 8px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }

.inv-kicker { display: flex; align-items: center; gap: 8px; }
.inv-prompt { font-family: var(--mono); color: var(--accent); font-size: 16px;}
.eyebrow { font-family: var(--font-orbitron); font-size: 10px; letter-spacing: 3px; color: var(--text-dim); }

.inv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(16px, 2.4vw, 26px) clamp(18px, 3vw, 28px);
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, var(--bg-1), transparent);
}

.head-name {
  font-family: var(--font-display);
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--accent);
  text-shadow: 0 0 18px var(--glow);
}

.inv-title { display: flex; flex-direction: column; gap: 2px; min-width: 0;  }
.inv-sub { width: 100%; margin-top: 4px; color: var(--text-dim); font-family: var(--mono); font-size: 12px; opacity: 0.8; }

.cnt {
  font-family: var(--font-orbitron);
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 8px;
  background: var(--bg-2);
  margin-left: 8px;
}
.seg button.active .cnt { background: var(--accent); color: var(--bg-0); }

.filter-ic { display: none; }

.grid {
  flex: 1;
  overflow-y: auto;
  padding: 22px clamp(16px, 2.4vw, 26px) 28px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-auto-rows: max-content;
  gap: 20px;
  align-content: start;
}

.empty-slot {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-dim);
  font-size: 30px;
}
.empty-slot p { margin-top: 12px; font-family: var(--font-hud); font-size: 14px; }

.inv-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 22px;
  border-top: 1px solid var(--line);
}
.inv-foot .hud-label { color: var(--text-dim); font-size: 10px; }
.inv-foot .gold { color: var(--accent); }

@media (max-width: 760px) {
  .inv { position: relative; }
  .inv-title .eyebrow, .inv-sub { display: none; }
  .inv-prompt {display: none;}
  .inv-title h2 { font-size: 25px; letter-spacing: 1px; padding-top: 6px;}
  .inv-controls { width: 50%; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .inv-foot { display: none; }
  .seg {
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    padding: 4px;
  }
  .seg button {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 0;
  }
  .seg button .lbl,
  .seg button .cnt { display: none; }
  .seg button .filter-ic { display: inline-flex; font-size: 19px; }

  .corner { display: none; position: absolute; width: 16px; height: 16px; z-index: 6; pointer-events: none; opacity: 0.9; }
}

@media (max-width: 560px) {
  .inv-foot { flex-wrap: wrap; }
  .inv-foot .hud-label { line-height: 1.5; }
}
</style>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import TabNav from './TabNav.vue'
import OutfitPanel from './panels/OutfitPanel.vue'
import InnerRaisePanel from './panels/InnerRaisePanel.vue'
import InventoryPanel from './panels/InventoryPanel.vue'
import JournalPanel from './panels/JournalPanel.vue'
import SettingsPanel from './panels/SettingsPanel.vue'
import CardModal from './card/CardModal.vue'
import { applyMusicSettings } from '../stores/sound'
import { useSettings } from '../composables/useSettings'
import { questlog, QUESTS, markTabQuest } from '../stores/questlog'
import { tell } from '../stores/companion'
import { playUnlock } from '../utils/sfx'

const props = defineProps({
  data: { type: Object, default: null },
  tab: { type: String, default: 'outfit' }
})
const emit = defineEmits(['update:tab'])

const { settings } = useSettings()
const tabs = computed(() => props.data?.menu?.tabs || [])

const cardOpen = ref(false)
function openCard() {
  cardOpen.value = true
  playUnlock()
  tell('card')
  questlog.mark('card')
}

const activeTab = computed({
  get: () => props.tab,
  set: (v) => emit('update:tab', v)
})

const questsDone = computed(() => QUESTS.filter((q) => questlog.isDone(q.id)).length)
const questsTotal = QUESTS.length
const allQuestDone = computed(() => questsDone.value === questsTotal)

const PANELS = {
  outfit: OutfitPanel,
  innerraise: InnerRaisePanel,
  inventory: InventoryPanel,
  journal: JournalPanel,
  settings: SettingsPanel
}

function onKeydown(e) {
  if (document.querySelector('.modal-mask')) return
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
  const idx = tabs.value.findIndex((t) => t.id === activeTab.value)
  if (idx === -1) return
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    activeTab.value = tabs.value[(idx + 1) % tabs.value.length].id
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    activeTab.value = tabs.value[(idx - 1 + tabs.value.length) % tabs.value.length].id
  }
}

function toggleMusic() {
  settings.music = !settings.music
  applyMusicSettings()
  questlog.mark('music')
  tell('music')
}

watch(
  () => activeTab.value,
  (t) => markTabQuest(t),
  { immediate: true }
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="menu-shell" :class="{ loading: !data }">
    <header class="menu-header">
      <div class="hud-left">
        <span class="hud-dot"></span>
        <span class="brand">{{ data?.menu?.title || 'progmanish' }}</span>
      </div>

      <div class="hud-center">
        <button
          class="card-btn"
          type="button"
          @click="openCard"
          title="The Wanderer's Calling Card"
        >
          <i class="bx bxs-id-card"></i>
          <span>LEGENDARY CARD</span>
        </button>
      </div>

      <div class="hud-right" v-if="data">
        <a
          class="q-chip"
          :class="{ done: allQuestDone }"
          :title="allQuestDone ? 'All quests complete - world cleared' : questsDone + '/' + questsTotal + ' quests done'"
        >
          <i class="bx" :class="allQuestDone ? 'bxs-trophy' : 'bxs-flag-alt'"></i>
          <span>{{ questsDone }}/{{ questsTotal }}</span>
        </a>

        <button
          class="music-btn"
          :class="{ muted: !settings.music }"
          :title="settings.music ? 'Mute music' : 'Unmute music'"
          @click="toggleMusic"
        >
          <i class="bx" :class="settings.music ? 'bxs-music' : 'bxs-music bx-flip-horizontal'"></i>
        </button>
      </div>
    </header>

    <nav class="tab-bar">
      <TabNav
        :tabs="tabs"
        :active="activeTab"
        @select="(id) => (activeTab = id)"
      />
    </nav>

    <main class="content-area">
      <Transition name="panel" mode="out-in">
        <div v-if="!data" key="loading" class="panel loading-panel">
          <span class="spinner"></span>
          <p class="hud-label">LOADING WORLD…</p>
        </div>

        <KeepAlive v-else>
          <component
            :is="PANELS[activeTab]"
            :data="data"
          />
        </KeepAlive>
      </Transition>
    </main>

    <footer class="menu-footer">
      <span class="hud-label">X: 17.42 · Y: 88.19 · Z: 2049</span>
      <span class="hud-label mid">PROGMANISH © {{ new Date().getFullYear() }}</span>
      <span class="hud-label">THE WANDERER</span>
    </footer>

    <CardModal
      :open="cardOpen"
      :user="data?.user"
      :appearance="data?.appearance"
      :contact="data?.contact"
      @close="cardOpen = false"
    />
  </div>
</template>

<style scoped>
.menu-shell {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: clamp(10px, 1.8vh, 20px) clamp(12px, 2vw, 28px);
  gap: 12px;
  animation: fade-in 0.6s ease both;
}

/* ---------- Header ---------- */
.menu-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--panel), var(--panel-solid));
  box-shadow: inset 0 0 34px var(--glow-soft);
}

.menu-header::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 8%;
  right: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-bright), transparent);
  box-shadow: 0 0 12px var(--glow);
}

.hud-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}

.hud-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--glow);
  animation: blink 2s infinite;
}

.brand {
  font-family: var(--font-display);
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 600;
  letter-spacing: 3px;
  color: var(--text);
  text-shadow: 0 0 16px var(--glow);
}

/* Center: card button */
.hud-center {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.card-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid rgba(212, 175, 55, 0.55);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--glow-soft), transparent);
  font-family: var(--font-orbitron);
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--accent-bright);
  text-shadow: 0 0 10px var(--glow);
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: inset 0 0 14px rgba(212, 175, 55, 0.1);
}
.card-btn i { font-size: 15px; }
.card-btn:hover {
  border-color: var(--accent);
  box-shadow: 0 0 16px var(--glow-soft), inset 0 0 16px rgba(212, 175, 55, 0.16);
  transform: translateY(-1px);
}

/* Right: quest + music */
.hud-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  min-width: 0;
}

.music-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 18px;
  color: var(--accent);
  transition: all 0.22s ease;
  flex: none;
}
.music-btn:hover { box-shadow: 0 0 12px var(--glow-soft); }
.music-btn.muted { color: var(--text-dim); }

.q-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--glow-soft);
  font-family: var(--font-orbitron);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--accent);
  transition: all 0.22s ease;
  flex: none;
}
.q-chip:hover { border-color: var(--accent); box-shadow: 0 0 12px var(--glow-soft); transform: translateY(-1px); }
.q-chip.done {
  color: var(--accent-bright);
  border-color: var(--accent);
  box-shadow: 0 0 12px var(--glow-soft);
}
.q-chip.done i { animation: q-chip-pop 1.8s ease-in-out infinite; }
@keyframes q-chip-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}

/* ---------- Tab bar ---------- */
.tab-bar { flex: none; }

/* ---------- Content ---------- */
.content-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.content-area > * { height: 100%; }

.loading-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin-slow 0.9s linear infinite;
}

/* ---------- Footer ---------- */
.menu-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.menu-footer .mid { color: var(--text-dim); }

@media (max-width: 760px) {
  .menu-shell { padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)); }
  .menu-footer { display: none; }
  .menu-header { flex-wrap: nowrap; gap: 8px; padding: 8px 10px; }
  .hud-left { order: 1; gap: 8px; min-width: 0; }
  .hud-right { order: 2; margin-left: auto; }
  .hud-center { display: none; }
  .brand { font-size: 15px; letter-spacing: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-btn { width: 36px; height: 36px; padding: 0; justify-content: center; }
  .card-btn span { display: none; }
  .tab-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
  }
  @media (max-width: 360px) {
    .hud-dot { display: none; }
    .q-chip span { display: none; }
    .q-chip { padding: 8px 9px; }
  }
}
</style>

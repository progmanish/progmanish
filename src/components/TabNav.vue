<script setup>
defineProps({
  tabs: { type: Array, default: () => [] },
  active: { type: String, default: '' }
})
defineEmits(['select'])
</script>

<template>
  <div class="tabnav">
    <button
      v-for="(tab, i) in tabs"
      :key="tab.id"
      class="tab-item"
      :class="{ active: tab.id === active }"
      @click="$emit('select', tab.id)"
    >
      <i class="tab-icon" :class="tab.icon"></i>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabnav {
  display: flex;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 0 30px var(--glow-soft);
}

.tab-item {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  color: var(--text-dim);
  transition: all 0.25s ease;
  overflow: hidden;
  min-width: 0;
}

.tab-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--glow-soft), transparent 70%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.tab-item::after {
  content: '';
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 4px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-bright), transparent);
  box-shadow: 0 0 12px var(--glow);
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tab-item:hover {
  color: var(--accent);
  background: var(--panel-hi);
  border-color: var(--line);
}

.tab-item.active {
  color: var(--accent);
  border-color: var(--line-strong);
  box-shadow: 0 0 18px var(--glow-soft), inset 0 0 20px var(--glow-soft);
}
.tab-item.active::before { opacity: 1; }
.tab-item.active::after { transform: scaleX(1); }

.tab-icon {
  font-size: 20px;
  line-height: 1;
  transition: text-shadow 0.25s ease;
}
.tab-item.active .tab-icon { text-shadow: 0 0 14px var(--glow); }

.tab-label {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 550;
  letter-spacing: 1px;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .tabnav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0px));
    gap: 4px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    background: var(--panel-solid);
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.35);
  }
  .tabnav::-webkit-scrollbar { display: none; }
  .tab-item {
    flex: 1 1 0;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
    padding: 7px 2px;
    border-radius: 10px;
  }
  .tab-num { display: none; }
  .tab-icon { font-size: 20px; }
  .tab-label { display: none; }
}
</style>

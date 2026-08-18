import { ref } from 'vue'

const STORAGE_KEY = 'progmanish-skilltree-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

const unlocked = ref(load())

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked.value]))
  } catch {
    /* storage unavailable */
  }
}

export function useSkillTree() {
  return {
    unlocked,
    isUnlocked(name) {
      return unlocked.value.has(name)
    },
    isReady(branchNodes, name) {
      if (unlocked.value.has(name)) return false
      const i = branchNodes.findIndex((n) => n.name === name)
      if (i < 0) return false
      if (i === 0) return true
      return unlocked.value.has(branchNodes[i - 1].name)
    },
    unlock(name) {
      if (unlocked.value.has(name)) return false
      unlocked.value = new Set(unlocked.value)
      unlocked.value.add(name)
      save()
      return true
    },
    reset() {
      unlocked.value = new Set()
      save()
    }
  }
}

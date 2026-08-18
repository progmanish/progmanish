import { ref, computed } from 'vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchData() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/devlog.json')
    if (!res.ok) throw new Error('devlog.json load failed')
    data.value = await res.json()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

fetchData()

export function useDevlog() {
  const entries = computed(() => {
    if (!data.value) return []
    return [...(data.value.entries || [])].sort(
      (a, b) => (b.id || 0) - (a.id || 0)
    )
  })
  return { data, entries, loading, error }
}

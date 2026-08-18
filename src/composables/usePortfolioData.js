import { ref } from 'vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchData() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/portfolio.json')
    if (!res.ok) throw new Error('portfolio.json load failed')
    data.value = await res.json()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

fetchData()

export function usePortfolioData() {
  return { data, loading, error }
}

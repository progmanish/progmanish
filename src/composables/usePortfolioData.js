import { ref } from 'vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)
const fetched = ref(false)

async function fetchData() {
  if (fetched.value) return
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/portfolio.json', {
      cache: 'force-cache'
    })
    if (!res.ok) throw new Error('portfolio.json load failed')
    data.value = await res.json()
    fetched.value = true
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

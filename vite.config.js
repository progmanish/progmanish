import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' ensures assets resolve under any GitHub Pages sub-path
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})

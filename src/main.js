import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { installSecurity } from './utils/security'

installSecurity()

createApp(App).mount('#app')

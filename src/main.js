import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import UserrankBadge from './components/UserrankBadge.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.component('userrankBadge', UserrankBadge)
app.mount('#app')

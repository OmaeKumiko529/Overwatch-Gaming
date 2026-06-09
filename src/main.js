import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import UserrankBadge from './components/UserrankBadge.vue'

// 🥚 开发者彩蛋 - 咕咕嘎嘎
import './utils/easterEgg.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.component('userrankBadge', UserrankBadge)
app.mount('#app')

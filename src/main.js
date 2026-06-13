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

// 所有资源加载完毕，移除加载动画
const loadingEl = document.getElementById('app-loading')
if (loadingEl) {
  loadingEl.classList.add('fade-out')
  // 过渡完成后从 DOM 中移除
  loadingEl.addEventListener('transitionend', () => loadingEl.remove())
}

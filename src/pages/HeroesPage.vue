<script setup>
import { ref, onMounted, computed } from 'vue'
import { heroesApi } from '../services/api.js'

const heroes = ref([])
const loading = ref(true)
const error = ref('')
const activeRole = ref('')
const selectedHero = ref(null)

const roles = [
  { key: '', label: '全部', icon: '⭐' },
  { key: 'tank', label: '重装', icon: '🛡️' },
  { key: 'damage', label: '输出', icon: '⚔️' },
  { key: 'support', label: '支援', icon: '💚' }
]

const filteredHeroes = computed(() => {
  if (!activeRole.value) return heroes.value
  return heroes.value.filter(h => h.role === activeRole.value)
})

async function loadHeroes() {
  loading.value = true
  error.value = ''
  try {
    const res = await heroesApi.getAllHeroes()
    if (res.success) {
      heroes.value = res.heroes
    } else {
      error.value = res.message || '请先由管理员同步英雄数据'
    }
  } catch {
    error.value = '加载失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

async function selectHero(hero) {
  if (selectedHero.value?.hero_key === hero.hero_key) {
    selectedHero.value = null
    return
  }
  selectedHero.value = null
  try {
    const res = await heroesApi.getHeroDetail(hero.hero_key)
    if (res.success) {
      selectedHero.value = res.hero
    }
  } catch {
    selectedHero.value = null
  }
}

function onRoleChange(role) {
  activeRole.value = role
  selectedHero.value = null
  // 客户端过滤，无需重新请求 API
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

onMounted(() => {
  loadHeroes()
})
</script>

<template>
  <div class="heroes-page">
    <div class="page-header">
      <h1 class="page-title">🦸 Overwatch 英雄图鉴</h1>
      <p class="page-desc">浏览全部守望先锋英雄，查看详细信息</p>
    </div>

    <!-- 角色筛选栏 -->
    <div class="role-filter-bar">
      <button
        v-for="role in roles"
        :key="role.key"
        class="role-btn"
        :class="{ active: activeRole === role.key }"
        @click="onRoleChange(role.key)"
      >
        <span class="role-icon">{{ role.icon }}</span>
        <span class="role-label">{{ role.label }}</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载英雄数据...</p>
    </div>

    <!-- 错误/空数据 -->
    <div v-else-if="error" class="empty-state">
      <p class="error-icon">⚠️</p>
      <p>{{ error }}</p>
    </div>

    <div v-else class="heroes-layout">
      <!-- 英雄列表（左） -->
      <div class="heroes-grid" :class="{ 'with-detail': selectedHero }">
        <div
          v-for="hero in filteredHeroes"
          :key="hero.hero_key"
          class="hero-card"
          :class="{
            selected: selectedHero?.hero_key === hero.hero_key,
            ['role-' + hero.role]: true
          }"
          @click="selectHero(hero)"
        >
          <div class="hero-portrait-wrap">
            <img
              v-if="hero.portrait"
              :src="hero.portrait"
              :alt="hero.name"
              class="hero-portrait"
              loading="lazy"
            />
            <div v-else class="hero-portrait-placeholder">?</div>
          </div>
          <div class="hero-info">
            <div class="hero-name">{{ hero.name }}</div>
            <div class="hero-subrole">{{ hero.subrole || '' }}</div>
          </div>
        </div>
      </div>

      <!-- 英雄详情（右） -->
      <Transition name="slide">
        <div v-if="selectedHero && selectedHero.detail" class="hero-detail-panel">
          <div class="detail-header">
            <h2 class="detail-title">{{ selectedHero.name }}</h2>
            <button class="close-btn" @click="selectedHero = null">✕</button>
          </div>

          <div class="detail-body">
            <!-- 角色标识 -->
            <div class="detail-role" :class="'role-' + selectedHero.role">
              {{ selectedHero.role === 'tank' ? '🛡️ 重装' : selectedHero.role === 'damage' ? '⚔️ 输出' : '💚 支援' }}
              <span v-if="selectedHero.subrole" class="subrole-tag">{{ selectedHero.subrole }}</span>
            </div>

            <!-- 简介 -->
            <p v-if="selectedHero.detail.description" class="detail-desc">
              {{ selectedHero.detail.description }}
            </p>

            <!-- 基本信息 -->
            <div class="detail-stats">
              <div v-if="selectedHero.detail.hitpoints" class="stat-box">
                <span class="stat-label">生命值</span>
                <span class="stat-val">{{ selectedHero.detail.hitpoints.health || 0 }}</span>
                <span v-if="(selectedHero.detail.hitpoints.armor || 0) > 0" class="stat-sub">+{{ selectedHero.detail.hitpoints.armor }} 护甲</span>
                <span v-if="(selectedHero.detail.hitpoints.shields || 0) > 0" class="stat-sub">+{{ selectedHero.detail.hitpoints.shields }} 护盾</span>
              </div>
              <div v-if="selectedHero.detail.location" class="stat-box">
                <span class="stat-label">所在地区</span>
                <span class="stat-val">{{ selectedHero.detail.location }}</span>
              </div>
              <div v-if="selectedHero.detail.age" class="stat-box">
                <span class="stat-label">年龄</span>
                <span class="stat-val">{{ selectedHero.detail.age }}</span>
              </div>
              <div v-if="selectedHero.detail.birthday" class="stat-box">
                <span class="stat-label">生日</span>
                <span class="stat-val">{{ selectedHero.detail.birthday }}</span>
              </div>
            </div>

            <!-- 背景故事 -->
            <div v-if="selectedHero.detail.story" class="detail-section">
              <h3 class="section-title">📖 背景故事</h3>
              <p class="story-summary">{{ selectedHero.detail.story.summary }}</p>
            </div>

            <!-- 技能列表 -->
            <div v-if="selectedHero.detail.abilities && selectedHero.detail.abilities.length" class="detail-section">
              <h3 class="section-title">🎯 技能</h3>
              <div class="abilities-list">
                <div v-for="(ability, idx) in selectedHero.detail.abilities" :key="idx" class="ability-item">
                  <img
                    v-if="ability.icon"
                    :src="ability.icon"
                    :alt="ability.name"
                    class="ability-icon"
                  />
                  <div class="ability-info">
                    <div class="ability-name">{{ ability.name }}</div>
                    <div class="ability-desc">{{ ability.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 同步时间 -->
            <div class="detail-footer">
              <span class="sync-info">数据同步于: {{ selectedHero.last_synced }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.heroes-page {
  min-height: 100vh;
  padding-top: 60px;
  background: #0f0f1a;
  font-family: 'MapleMono CN Regular', monospace;
}

.page-header {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 20px 0;
  text-align: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 1rem;
  color: #888;
  margin-bottom: 0;
}

/* 角色筛选 */
.role-filter-bar {
  max-width: 1000px;
  margin: 20px auto 0;
  padding: 0 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.role-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 2px solid #2a2a4a;
  border-radius: 12px;
  background: #1a1a2e;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.role-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #222248;
}

.role-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: #fff;
}

.role-icon {
  font-size: 1.2rem;
}

/* 加载 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #2a2a4a;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #888;
  font-size: 1.1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

/* 主布局 */
.heroes-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.heroes-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  transition: all 0.3s;
}

.heroes-grid.with-detail {
  flex: 0 0 60%;
  max-width: 60%;
}

/* 英雄卡片 */
.hero-card {
  background: #1a1a2e;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  border: 2px solid #2a2a4a;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  opacity: 0;
  transition: opacity 0.25s;
}

.hero-card.role-tank::before { background: #faa61a; }
.hero-card.role-damage::before { background: #ed3e2f; }
.hero-card.role-support::before { background: #4f9d58; }

.hero-card:hover::before,
.hero-card.selected::before { opacity: 1; }

.hero-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border-color: transparent;
}

.hero-card.selected {
  border-color: #667eea;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
  transform: translateY(-2px);
}

.hero-portrait-wrap {
  width: 100px;
  height: 100px;
  margin: 0 auto 12px;
  border-radius: 50%;
  overflow: hidden;
  background: #0f0f1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-portrait-placeholder {
  font-size: 2rem;
  color: #555;
}

.hero-name {
  font-size: 1rem;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.hero-subrole {
  font-size: 0.85rem;
  color: #666;
}

/* 详情面板 */
.hero-detail-panel {
  flex: 0 0 38%;
  max-width: 38%;
  background: #1a1a2e;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid #2a2a4a;
  overflow: hidden;
  position: sticky;
  top: 80px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #2a2a4a;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e0e0e0;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: #2a2a4a;
  font-size: 1rem;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #3a3a5a;
  color: #e0e0e0;
}

.detail-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-role {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.detail-role.role-tank { background: #3a2a0a; color: #faa61a; }
.detail-role.role-damage { background: #3a0a0a; color: #ed3e2f; }
.detail-role.role-support { background: #0a2a0a; color: #4f9d58; }

.subrole-tag {
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  font-size: 0.8rem;
}

.detail-desc {
  font-size: 0.95rem;
  color: #aaa;
  line-height: 1.6;
  margin-bottom: 20px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-box {
  background: #0f0f1a;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.stat-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e0e0e0;
}

.stat-sub {
  font-size: 0.8rem;
  color: #667eea;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.story-summary {
  font-size: 0.9rem;
  color: #aaa;
  line-height: 1.6;
}

.abilities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ability-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 10px;
  background: #0f0f1a;
}

.ability-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
  background: #0a0a14;
  object-fit: contain;
}

.ability-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.ability-desc {
  font-size: 0.85rem;
  color: #888;
  line-height: 1.4;
}

.detail-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #2a2a4a;
}

.sync-info {
  font-size: 0.8rem;
  color: #555;
}

/* 滑动过渡 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 响应式 */
@media (max-width: 768px) {
  .heroes-layout {
    flex-direction: column;
  }

  .heroes-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }

  .heroes-grid.with-detail {
    flex: none;
    max-width: 100%;
  }

  .hero-detail-panel {
    flex: none;
    max-width: 100%;
    position: static;
  }

  .detail-body {
    max-height: none;
  }
}
</style>

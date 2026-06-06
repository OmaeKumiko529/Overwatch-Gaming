<template>
  <div class="admin-panel">
    <!-- 顶部导航栏 -->
    <div class="admin-header">
      <div class="header-left">
        <h1>🔧 管理后台</h1>
        <span class="header-subtitle">数据库管理面板</span>
      </div>
      <div class="header-right">
        <button class="btn btn-refresh" @click="refreshAll" :disabled="loading">
          {{ loading ? '加载中...' : '🔄 刷新' }}
        </button>
        <button class="btn btn-close" @click="goBack">✕ 返回</button>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-cards" v-if="stats">
      <div class="stat-card" v-for="(count, table) in stats" :key="table">
        <div class="stat-label">{{ tableLabels[table] || table }}</div>
        <div class="stat-count">{{ count }}</div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="admin-body">
      <!-- 左侧：表选择器 + SQL控制台 -->
      <div class="admin-sidebar">
        <div class="sidebar-section">
          <h3>📋 数据表</h3>
          <div class="table-list">
            <div
              v-for="t in tables"
              :key="t.name"
              class="table-item"
              :class="{ active: currentTable === t.name }"
              @click="selectTable(t.name)"
            >
              <span class="table-name">{{ t.name }}</span>
              <span class="table-count">{{ t.rowCount }} 行</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>🔍 SQL 控制台</h3>
          <div class="sql-console">
            <textarea
              v-model="sqlQuery"
              placeholder="输入 SELECT 查询语句..."
              rows="4"
              class="sql-input"
            ></textarea>
            <button class="btn btn-sql" @click="executeSql" :disabled="sqlLoading">
              {{ sqlLoading ? '执行中...' : '▶ 执行' }}
            </button>
          </div>
          <div v-if="sqlResult" class="sql-result">
            <div class="sql-result-info">返回 {{ sqlResult.rowCount }} 行</div>
            <table v-if="sqlResult.rows && sqlResult.rows.length > 0" class="data-table sql-table">
              <thead>
                <tr>
                  <th v-for="col in sqlResult.columns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in sqlResult.rows" :key="idx">
                  <td v-for="col in sqlResult.columns" :key="col" :title="formatCell(row[col])">
                    {{ truncateCell(row[col]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 右侧：数据表格 -->
      <div class="admin-content">
        <div class="content-toolbar" v-if="currentTable">
          <div class="toolbar-left">
            <h3>表: {{ currentTable }}</h3>
          </div>
          <div class="toolbar-right">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索..."
              class="search-input"
              @input="debouncedSearch"
            />
            <button
              v-if="currentTable === 'ow_heroes'"
              class="btn btn-sync"
              @click="syncHeroesFromAPI"
              :disabled="syncing"
            >
              {{ syncing ? '同步中...' : '⬇ 从 OverFast 同步' }}
            </button>
            <button class="btn btn-add" @click="openAddModal">+ 新增行</button>
          </div>
        </div>

        <!-- 数据表 -->
        <div class="table-wrapper" v-if="currentTable">
          <table class="data-table">
            <thead>
              <tr>
                <th
                  v-for="col in currentColumns"
                  :key="col.name"
                  class="sortable"
                  @click="toggleSort(col.name)"
                >
                  {{ col.name }}
                  <span class="col-type">{{ col.type }}</span>
                  <span v-if="sortBy === col.name" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </th>
                <th class="actions-col">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tableData" :key="row.id || row[primaryKey]">
                <td v-for="col in currentColumns" :key="col.name" :title="formatCell(row[col.name])">
                  <div class="cell-content">{{ truncateCell(row[col.name]) }}</div>
                </td>
                <td class="actions-cell">
                  <button class="btn btn-sm btn-edit" @click="openEditModal(row)">编辑</button>
                  <button class="btn btn-sm btn-delete" @click="confirmDelete(row)">删除</button>
                </td>
              </tr>
              <tr v-if="tableData.length === 0">
                <td :colspan="currentColumns.length + 1" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="currentTable && totalPages > 1">
          <button class="btn btn-page" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">‹ 上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页 (共 {{ totalRows }} 条)</span>
          <button class="btn btn-page" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页 ›</button>
        </div>
      </div>
    </div>

    <!-- 编辑/新增模态框 -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingRow ? '编辑行' : '新增行' }} - {{ currentTable }}</h3>
          <button class="btn btn-close-modal" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-field" v-for="col in editableColumns" :key="col.name">
            <label :for="'field-' + col.name">
              {{ col.name }}
              <span class="field-type">({{ col.type }})</span>
            </label>
            <input
              v-if="!isLongTextField(col)"
              :id="'field-' + col.name"
              v-model="formData[col.name]"
              :type="getInputType(col)"
              :placeholder="'默认: ' + (col.dflt_value || 'null')"
              class="form-input"
            />
            <textarea
              v-else
              :id="'field-' + col.name"
              v-model="formData[col.name]"
              :placeholder="'默认: ' + (col.dflt_value || 'null')"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="closeModal">取消</button>
          <button class="btn btn-save" @click="saveRow" :disabled="saving">
            {{ saving ? '保存中...' : '💾 保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi, heroesApi } from '../services/api.js'

const router = useRouter()

// 表名中文标签
const tableLabels = {
  users: '用户',
  posts: '帖子',
  teams: '队伍',
  team_members: '队伍成员',
  notifications: '通知',
  announcements: '公告',
  post_likes: '点赞记录',
  ow_heroes: 'OW英雄数据',
  adminUsers: '管理员'
}

// 状态
const loading = ref(false)
const tables = ref([])
const currentTable = ref('')
const tableData = ref([])
const currentColumns = ref([])
const stats = ref(null)
const searchQuery = ref('')
const sortBy = ref('id')
const sortOrder = ref('desc')
const currentPage = ref(1)
const pageSize = ref(50)
const totalRows = ref(0)
const totalPages = ref(0)

// 预缓存所有表数据：{ tableName: { rows, pagination, columns } }
const dataCache = ref({})
const preloading = ref(false)
const preloadProgress = ref('')

// Modal 状态
const showModal = ref(false)
const editingRow = ref(null)
const formData = ref({})
const saving = ref(false)

// OW 英雄同步
const syncing = ref(false)
const syncMessage = ref('')

// SQL 控制台
const sqlQuery = ref('')
const sqlResult = ref(null)
const sqlLoading = ref(false)

// 计算属性
const primaryKey = computed(() => 'id')

const editableColumns = computed(() => {
  if (!currentColumns.value) return []
  return currentColumns.value.filter(c => c.name !== 'id' && c.name !== primaryKey.value)
})

// 方法
function isLongTextField(col) {
  if (!col || !col.type) return false
  const type = col.type.toUpperCase()
  return type.includes('TEXT') || type.includes('CHAR') || type === 'BLOB'
}

function getInputType(col) {
  if (!col || !col.type) return 'text'
  const type = col.type.toUpperCase()
  if (type.includes('INT')) return 'number'
  if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) return 'number'
  return 'text'
}

function formatCell(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function truncateCell(value) {
  const str = formatCell(value)
  if (str.length > 40) return str.substring(0, 40) + '...'
  return str
}

let searchTimer = null
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadTableData()
  }, 300)
}

function toggleSort(colName) {
  if (sortBy.value === colName) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = colName
    sortOrder.value = 'desc'
  }
  currentPage.value = 1
  loadTableData()
}

function goPage(page) {
  currentPage.value = page
  loadTableData()
}

async function loadTables() {
  try {
    const res = await adminApi.getTables()
    if (res.success) {
      tables.value = res.tables
      if (!currentTable.value && res.tables.length > 0) {
        selectTable(res.tables[0].name)
      }
    }
  } catch (e) {
    console.error('加载表列表失败:', e)
  }
}

async function loadTableData() {
  if (!currentTable.value) return
  loading.value = true
  try {
    const res = await adminApi.getTableData(currentTable.value, {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    if (res.success) {
      tableData.value = res.data
      totalRows.value = res.pagination.total
      totalPages.value = res.pagination.totalPages
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await adminApi.getStats()
    if (res.success) {
      stats.value = res.stats
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

function selectTable(name) {
  currentTable.value = name
  currentPage.value = 1
  searchQuery.value = ''
  // 查找列信息
  const table = tables.value.find(t => t.name === name)
  currentColumns.value = table ? table.columns : []
  // 优先从缓存读取
  const cache = dataCache.value[name]
  if (cache) {
    tableData.value = cache.rows
    totalRows.value = cache.pagination.total
    totalPages.value = cache.pagination.totalPages
  } else {
    loadTableData()
  }
}

function openAddModal() {
  editingRow.value = null
  formData.value = {}
  // 预设默认值
  for (const col of editableColumns.value) {
    if (col.dflt_value) {
      formData.value[col.name] = col.dflt_value
    } else {
      formData.value[col.name] = ''
    }
  }
  showModal.value = true
}

function openEditModal(row) {
  editingRow.value = row
  formData.value = {}
  for (const col of currentColumns.value) {
    if (col.name === 'id') continue
    // 尝试解析 JSON
    const val = row[col.name]
    if (typeof val === 'object' && val !== null) {
      formData.value[col.name] = JSON.stringify(val)
    } else if (val !== null && val !== undefined) {
      formData.value[col.name] = val
    } else {
      formData.value[col.name] = ''
    }
  }
  showModal.value = true
}

async function saveRow() {
  saving.value = true
  try {
    // 清理数据：空字符串转为 null 以便数据库使用默认值
    const cleanData = {}
    for (const [key, val] of Object.entries(formData.value)) {
      if (val === '' || val === null || val === undefined) {
        continue
      }
      // 尝试将数字字符串转为数字
      if (typeof val === 'string' && !isNaN(val) && val.trim() !== '') {
        cleanData[key] = Number(val)
      } else {
        cleanData[key] = val
      }
    }

    let res
    if (editingRow.value) {
      const rowId = editingRow.value.id || editingRow.value[primaryKey.value]
      res = await adminApi.updateRow(currentTable.value, rowId, cleanData)
    } else {
      res = await adminApi.insertRow(currentTable.value, cleanData)
    }

    if (res.success) {
      closeModal()
      loadTableData()
      loadStats()
    } else {
      alert('操作失败: ' + (res.message || '未知错误'))
    }
  } catch (e) {
    alert('操作失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function confirmDelete(row) {
  const rowId = row.id || row[primaryKey.value]
  const confirmMsg = `确定要删除 ${currentTable.value} 中 id=${rowId} 的行吗？此操作不可撤销！`
  if (!confirm(confirmMsg)) return

  try {
    const res = await adminApi.deleteRow(currentTable.value, rowId)
    if (res.success) {
      loadTableData()
      loadStats()
    } else {
      alert('删除失败: ' + (res.message || '未知错误'))
    }
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

function closeModal() {
  showModal.value = false
  editingRow.value = null
  formData.value = {}
}

async function executeSql() {
  if (!sqlQuery.value.trim()) return
  sqlLoading.value = true
  sqlResult.value = null
  try {
    const res = await adminApi.executeSql(sqlQuery.value)
    if (res.success) {
      sqlResult.value = res
    } else {
      alert('SQL 执行失败: ' + (res.message || '未知错误'))
    }
  } catch (e) {
    alert('SQL 执行失败: ' + e.message)
  } finally {
    sqlLoading.value = false
  }
}

// 预加载所有表数据到缓存
async function preloadAllData() {
  if (preloading.value) return
  preloading.value = true
  preloadProgress.value = ''
  try {
    const tableNames = tables.value.map(t => t.name)
    for (let i = 0; i < tableNames.length; i++) {
      const name = tableNames[i]
      preloadProgress.value = `预加载 ${name}... (${i + 1}/${tableNames.length})`
      const res = await adminApi.getTableData(name, {
        page: 1,
        pageSize: 200,
        search: '',
        sortBy: 'id',
        sortOrder: 'desc'
      })
      if (res.success) {
        dataCache.value[name] = {
          rows: res.data,
          pagination: res.pagination
        }
        // 如果是当前选中的表，同步显示
        if (name === currentTable.value) {
          const table = tables.value.find(t => t.name === name)
          currentColumns.value = table ? table.columns : []
          tableData.value = res.data
          totalRows.value = res.pagination.total
          totalPages.value = res.pagination.totalPages
        }
      }
    }
    preloadProgress.value = `✅ 全部已预加载 (${tableNames.length} 张表)`
  } catch (e) {
    console.error('预加载失败:', e)
    preloadProgress.value = '⚠️ 预加载部分失败'
  } finally {
    preloading.value = false
  }
}

async function syncHeroesFromAPI() {
  if (!confirm('将从 OverFast API 拉取全部英雄数据并写入数据库。继续吗？')) return
  syncing.value = true
  syncMessage.value = ''
  try {
    const res = await heroesApi.syncHeroes()
    if (res.success) {
      syncMessage.value = res.message
      alert(`✅ ${res.message}`)
      // 刷新数据
      dataCache.value = {}
      await loadTables()
      await loadStats()
      if (currentTable.value === 'ow_heroes') {
        await loadTableData()
      }
    } else {
      alert('同步失败: ' + (res.message || '未知错误'))
    }
  } catch (e) {
    alert('同步失败: ' + e.message)
  } finally {
    syncing.value = false
  }
}

function refreshAll() {
  dataCache.value = {}
  loadTables()
  loadStats()
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadTables()
  loadStats()
  // 等 tables 加载完成后预取所有表数据
  const unwatch = watch(tables, (newTables) => {
    if (newTables.length > 0) {
      preloadAllData()
      unwatch()
    }
  })
})
</script>

<style scoped>
/* 全局布局 */
.admin-panel {
  min-height: 100vh;
  background: #0f0f1a;
  color: #e0e0e0;
  font-family: 'Segoe UI', sans-serif;
}

/* 顶部导航 */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #1a1a2e;
  border-bottom: 1px solid #2a2a4a;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.header-subtitle {
  color: #888;
  font-size: 13px;
}

.header-right {
  display: flex;
  gap: 8px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 12px 24px;
}

.stat-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 10px 14px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-count {
  font-size: 22px;
  font-weight: bold;
  color: #ffd700;
}

/* 主体布局 */
.admin-body {
  display: flex;
  gap: 0;
  padding: 0 24px 24px;
  min-height: calc(100vh - 180px);
}

.admin-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-section {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 14px;
}

.sidebar-section h3 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #aaa;
}

.table-list {
  max-height: 400px;
  overflow-y: auto;
}

.table-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 2px;
  transition: background 0.2s;
}

.table-item:hover {
  background: #2a2a4a;
}

.table-item.active {
  background: #3a3a6a;
  color: #ffd700;
}

.table-name {
  font-weight: 500;
  font-size: 13px;
}

.table-count {
  font-size: 11px;
  color: #888;
}

/* SQL 控制台 */
.sql-console {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sql-input {
  width: 100%;
  background: #0a0a18;
  border: 1px solid #333;
  border-radius: 4px;
  color: #e0e0e0;
  padding: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  resize: vertical;
}

.sql-input:focus {
  outline: none;
  border-color: #ffd700;
}

.sql-result {
  margin-top: 8px;
  max-height: 300px;
  overflow: auto;
}

.sql-result-info {
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

/* 右侧内容 */
.admin-content {
  flex: 1;
  margin-left: 16px;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #2a2a4a;
  flex-wrap: wrap;
  gap: 8px;
}

.content-toolbar h3 {
  margin: 0;
  font-size: 15px;
  color: #fff;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  background: #0a0a18;
  border: 1px solid #333;
  border-radius: 4px;
  color: #e0e0e0;
  padding: 6px 10px;
  font-size: 13px;
  width: 180px;
}

.search-input:focus {
  outline: none;
  border-color: #ffd700;
}

/* 数据表 */
.table-wrapper {
  overflow-x: auto;
  flex: 1;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table thead th {
  background: #252545;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #ccc;
  border-bottom: 1px solid #333;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table thead th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table thead th.sortable:hover {
  background: #303060;
}

.col-type {
  font-weight: normal;
  font-size: 10px;
  color: #888;
  margin-left: 4px;
}

.sort-indicator {
  margin-left: 4px;
  color: #ffd700;
}

.data-table tbody td {
  padding: 6px 10px;
  border-bottom: 1px solid #222;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-content {
  max-height: 40px;
  overflow: hidden;
}

.data-table tbody tr:hover {
  background: #222240;
}

.actions-col {
  width: 120px;
  text-align: center;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.empty-row {
  text-align: center;
  padding: 30px;
  color: #666;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid #2a2a4a;
}

.page-info {
  font-size: 13px;
  color: #888;
}

/* 按钮通用 */
.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-refresh {
  background: #2a6a2a;
  color: #fff;
}

.btn-refresh:hover:not(:disabled) {
  background: #3a8a3a;
}

.btn-close {
  background: #5a2a2a;
  color: #fff;
}

.btn-close:hover {
  background: #7a3a3a;
}

.btn-sync {
  background: #8a6a2a;
  color: #ffd700;
}

.btn-sync:hover:not(:disabled) {
  background: #aa8a3a;
}

.btn-add {
  background: #2a5a8a;
  color: #fff;
}

.btn-add:hover {
  background: #3a7aaa;
}

.btn-sql {
  background: #5a4a2a;
  color: #ffd700;
}

.btn-sql:hover:not(:disabled) {
  background: #7a6a3a;
}

.btn-sm {
  padding: 3px 8px;
  font-size: 11px;
}

.btn-edit {
  background: #2a5a8a;
  color: #fff;
}

.btn-edit:hover {
  background: #3a7aaa;
}

.btn-delete {
  background: #6a2a2a;
  color: #fff;
}

.btn-delete:hover {
  background: #8a3a3a;
}

.btn-page {
  background: #2a2a4a;
  color: #ccc;
}

.btn-page:hover:not(:disabled) {
  background: #3a3a6a;
}

.btn-cancel {
  background: #444;
  color: #ccc;
}

.btn-cancel:hover {
  background: #555;
}

.btn-save {
  background: #2a6a2a;
  color: #fff;
}

.btn-save:hover:not(:disabled) {
  background: #3a8a3a;
}

.btn-close-modal {
  background: transparent;
  color: #aaa;
  font-size: 18px;
  padding: 4px 8px;
}

.btn-close-modal:hover {
  color: #fff;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border: 1px solid #3a3a6a;
  border-radius: 10px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #2a2a4a;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
}

.modal-body {
  padding: 14px 18px;
  overflow-y: auto;
  flex: 1;
}

.form-field {
  margin-bottom: 12px;
}

.form-field label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #ccc;
}

.field-type {
  color: #888;
  font-size: 11px;
}

.form-input {
  width: 100%;
  background: #0a0a18;
  border: 1px solid #333;
  border-radius: 4px;
  color: #e0e0e0;
  padding: 7px 10px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #ffd700;
}

.form-textarea {
  width: 100%;
  background: #0a0a18;
  border: 1px solid #333;
  border-radius: 4px;
  color: #e0e0e0;
  padding: 7px 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: #ffd700;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #2a2a4a;
}

/* SQL 表格 */
.sql-table {
  font-size: 11px;
}

.sql-table td {
  max-width: 150px;
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-body {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
  }

  .admin-content {
    margin-left: 0;
  }

  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
import { Router } from 'express'
import { getDb, getOne, getAll, run, insert } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// ============================================================
// 公开接口：获取全部英雄（支持 role 筛选）
// ============================================================
router.get('/', (req, res) => {
  try {
    const { role } = req.query
    let sql = 'SELECT hero_key, name, portrait, role, subrole, last_synced FROM ow_heroes'
    const params = []
    if (role && ['tank', 'damage', 'support'].includes(role)) {
      sql += ' WHERE role = ?'
      params.push(role)
    }
    sql += ' ORDER BY hero_key ASC'
    const heroes = getAll(sql, params)
    res.json({ success: true, heroes })
  } catch (error) {
    console.error('获取英雄列表失败:', error)
    res.status(500).json({ success: false, message: '获取英雄列表失败' })
  }
})

// ============================================================
// 公开接口：获取单个英雄详情
// ============================================================
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params
    const row = getOne('SELECT * FROM ow_heroes WHERE hero_key = ?', [key])
    if (!row) {
      return res.json({ success: false, message: '英雄不存在' })
    }
    // 解析 data_json
    let detail = null
    try {
      detail = JSON.parse(row.data_json)
    } catch {
      detail = {}
    }
    res.json({
      success: true,
      hero: {
        hero_key: row.hero_key,
        name: row.name,
        portrait: row.portrait,
        role: row.role,
        subrole: row.subrole,
        last_synced: row.last_synced,
        detail
      }
    })
  } catch (error) {
    console.error('获取英雄详情失败:', error)
    res.status(500).json({ success: false, message: '获取英雄详情失败' })
  }
})

// ============================================================
// 管理员接口：从 OverFast API 同步数据
// ============================================================
router.post('/sync', adminMiddleware, async (req, res) => {
  try {
    const OVERFAST_BASE = 'https://overfast-api.tekrop.fr'
    const LOCALE = 'zh-tw'

    // 1) 获取英雄列表
    console.log('[Heroes Sync] Fetching hero list from OverFast API...')
    const listRes = await fetch(`${OVERFAST_BASE}/heroes?locale=${LOCALE}`)
    if (!listRes.ok) {
      console.error('[Heroes Sync] Failed to fetch hero list:', listRes.status)
      return res.json({ success: false, message: `无法获取英雄列表 (HTTP ${listRes.status})` })
    }
    const heroList = await listRes.json()
    console.log(`[Heroes Sync] Got ${heroList.length} heroes from API`)

    // 2) 逐个获取详情
    let successCount = 0
    let failCount = 0
    const errors = []

    for (const h of heroList) {
      try {
        const { key, name, portrait, role, subrole } = h

        // 获取该英雄的完整详情
        const detailRes = await fetch(`${OVERFAST_BASE}/heroes/${key}?locale=${LOCALE}`)
        if (!detailRes.ok) {
          console.warn(`[Heroes Sync] Failed to fetch detail for ${key}: ${detailRes.status}`)
          // 仍然保存，但 data_json 用简略数据
          const dataJson = JSON.stringify(h)
          // Upsert
          const existing = getOne('SELECT id FROM ow_heroes WHERE hero_key = ?', [key])
          if (existing) {
            run('UPDATE ow_heroes SET name=?, portrait=?, role=?, subrole=?, data_json=?, last_synced=datetime(\'now\',\'localtime\') WHERE hero_key=?',
              [name, portrait, role, subrole, dataJson, key])
          } else {
            insert('INSERT INTO ow_heroes (hero_key, name, portrait, role, subrole, data_json) VALUES (?,?,?,?,?,?)',
              [key, name, portrait, role, subrole, dataJson])
          }
          successCount++
          continue
        }

        const detailData = await detailRes.json()
        const dataJson = JSON.stringify(detailData)

        // Upsert
        const existing = getOne('SELECT id FROM ow_heroes WHERE hero_key = ?', [key])
        if (existing) {
          run('UPDATE ow_heroes SET name=?, portrait=?, role=?, subrole=?, data_json=?, last_synced=datetime(\'now\',\'localtime\') WHERE hero_key=?',
            [name, portrait, role, subrole, dataJson, key])
        } else {
          insert('INSERT INTO ow_heroes (hero_key, name, portrait, role, subrole, data_json) VALUES (?,?,?,?,?,?)',
            [key, name, portrait, role, subrole, dataJson])
        }
        successCount++
        console.log(`[Heroes Sync] Synced: ${name} (${key})`)

        // 小延迟避免触发 OverFast 限流
        await new Promise(r => setTimeout(r, 100))
      } catch (err) {
        console.error(`[Heroes Sync] Error syncing hero ${h.key}:`, err.message)
        failCount++
        errors.push({ key: h.key, error: err.message })
      }
    }

    console.log(`[Heroes Sync] Complete: ${successCount} success, ${failCount} failed`)
    res.json({
      success: true,
      message: `同步完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      stats: { total: heroList.length, successCount, failCount },
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[Heroes Sync] Fatal error:', error)
    res.status(500).json({ success: false, message: `同步失败: ${error.message}` })
  }
})

export default router
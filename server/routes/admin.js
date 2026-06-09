import { Router } from 'express'
import { getDb, getOne, getAll, run, insert } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = Router()

// 所有路由需要管理员权限
router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 允许操作的表名白名单
const ALLOWED_TABLES = [
  'users', 'posts', 'teams', 'team_members',
  'notifications', 'announcements', 'post_likes',
  'ow_heroes'
]

// 获取表的主键列名（假设第一列是主键）
function getPrimaryKey(tableName) {
  const tablePrimaryKeys = {
    users: 'id',
    posts: 'id',
    teams: 'id',
    team_members: 'id',
    notifications: 'id',
    announcements: 'id',
    post_likes: 'id'
  }
  return tablePrimaryKeys[tableName] || 'id'
}

// 获取表的所有列信息（tableName 必须经过白名单校验）
function getTableInfo(tableName) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    return null
  }
  try {
    const result = getAll(`PRAGMA table_info('${tableName}')`)
    return result.map(r => ({
      cid: r.cid,
      name: r.name,
      type: r.type,
      notnull: r.notnull,
      dflt_value: r.dflt_value,
      pk: r.pk
    }))
  } catch (error) {
    return null
  }
}

// 获取所有表名
router.get('/tables', adminMiddleware, (req, res) => {
  try {
    const tables = getAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    const result = tables.map(t => {
      const cols = getTableInfo(t.name)
      const countResult = getOne(`SELECT COUNT(*) as count FROM \`${t.name}\``)
      return {
        name: t.name,
        columns: cols,
        rowCount: countResult ? countResult.count : 0
      }
    })
    res.json({ success: true, tables: result })
  } catch (error) {
    console.error('获取表列表失败:', error)
    res.status(500).json({ success: false, message: '获取表列表失败' })
  }
})

// 获取表数据（分页）
router.get('/table/:tableName', adminMiddleware, (req, res) => {
  try {
    const { tableName } = req.params
    if (!ALLOWED_TABLES.includes(tableName)) {
      return res.json({ success: false, message: '不允许操作该表' })
    }

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(Math.max(1, parseInt(req.query.pageSize) || 50), 200)
    const offset = (page - 1) * pageSize
    const search = req.query.search || ''
    const sortBy = req.query.sortBy || 'id'
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC'

    // 获取总行数
    let countSql = `SELECT COUNT(*) as total FROM \`${tableName}\``
    const countParams = []
    if (search) {
      const cols = getTableInfo(tableName)
      if (cols && cols.length > 0) {
        const searchClauses = cols
          .filter(c => c.type && (c.type.toUpperCase().includes('CHAR') || c.type.toUpperCase().includes('TEXT')))
          .map(c => `\`${c.name}\` LIKE ?`)
        if (searchClauses.length > 0) {
          countSql += ' WHERE ' + searchClauses.join(' OR ')
          for (let i = 0; i < searchClauses.length; i++) {
            countParams.push(`%${search}%`)
          }
        }
      }
    }
    const countResult = getOne(countSql, countParams)
    const total = countResult ? countResult.total : 0

    // 获取当前页数据
    let dataSql = `SELECT * FROM \`${tableName}\``
    const dataParams = [...countParams]
    if (search && countParams.length > 0) {
      // search clause already in countParams
    }
    dataSql += ` ORDER BY \`${sortBy}\` ${sortOrder} LIMIT ? OFFSET ?`
    dataParams.push(pageSize, offset)

    const rows = getAll(dataSql, dataParams)

    // 对敏感字段脱敏
    const sanitizedRows = rows.map(row => {
      const sanitized = { ...row }
      if (tableName === 'users' && sanitized.password_hash) {
        sanitized.password_hash = sanitized.password_hash.substring(0, 8) + '...[已脱敏]'
      }
      return sanitized
    })

    res.json({
      success: true,
      data: sanitizedRows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('获取表数据失败:', error)
    res.status(500).json({ success: false, message: '获取表数据失败' })
  }
})

// 插入新行
router.post('/table/:tableName', adminMiddleware, (req, res) => {
  try {
    const { tableName } = req.params
    if (!ALLOWED_TABLES.includes(tableName)) {
      return res.json({ success: false, message: '不允许操作该表' })
    }

    const data = req.body
    if (!data || typeof data !== 'object') {
      return res.json({ success: false, message: '无效的数据' })
    }

    const cols = getTableInfo(tableName)
    if (!cols) {
      return res.json({ success: false, message: '表不存在' })
    }

    // 过滤只允许表中存在的列，排除自增主键
    const pk = getPrimaryKey(tableName)
    const allowedCols = cols.filter(c => c.name !== pk)

    const insertCols = []
    const insertParams = []

    for (const col of allowedCols) {
      if (data[col.name] !== undefined && data[col.name] !== null) {
        // 针对 JSON 字段做序列化
        if (col.name === 'role' || col.name === 'mentions') {
          if (typeof data[col.name] === 'object') {
            insertCols.push(`\`${col.name}\``)
            insertParams.push(JSON.stringify(data[col.name]))
            continue
          }
        }
        insertCols.push(`\`${col.name}\``)
        insertParams.push(data[col.name])
      }
    }

    if (insertCols.length === 0) {
      return res.json({ success: false, message: '没有提供有效的数据字段' })
    }

    const placeholders = insertCols.map(() => '?').join(', ')
    const sql = `INSERT INTO \`${tableName}\` (${insertCols.join(', ')}) VALUES (${placeholders})`
    const result = insert(sql, insertParams)

    res.json({
      success: true,
      message: '插入成功',
      lastInsertRowid: result.lastInsertRowid
    })
  } catch (error) {
    console.error('插入数据失败:', error)
    res.status(500).json({ success: false, message: `插入失败: ${error.message}` })
  }
})

// 更新一行
router.put('/table/:tableName/:id', adminMiddleware, (req, res) => {
  try {
    const { tableName, id } = req.params
    if (!ALLOWED_TABLES.includes(tableName)) {
      return res.json({ success: false, message: '不允许操作该表' })
    }

    const data = req.body
    if (!data || typeof data !== 'object') {
      return res.json({ success: false, message: '无效的数据' })
    }

    const cols = getTableInfo(tableName)
    if (!cols) {
      return res.json({ success: false, message: '表不存在' })
    }

    const pk = getPrimaryKey(tableName)
    const setClauses = []
    const setParams = []

    for (const col of cols) {
      if (col.name === pk) continue
      if (data[col.name] !== undefined) {
        // 针对 JSON 字段做序列化
        if (col.name === 'role' || col.name === 'mentions') {
          if (typeof data[col.name] === 'object') {
            setClauses.push(`\`${col.name}\` = ?`)
            setParams.push(JSON.stringify(data[col.name]))
            continue
          }
        }
        setClauses.push(`\`${col.name}\` = ?`)
        setParams.push(data[col.name])
      }
    }

    if (setClauses.length === 0) {
      return res.json({ success: false, message: '没有提供需要更新的字段' })
    }

    setParams.push(id)
    const sql = `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE \`${pk}\` = ?`
    run(sql, setParams)

    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('更新数据失败:', error)
    res.status(500).json({ success: false, message: `更新失败: ${error.message}` })
  }
})

// 删除一行
router.delete('/table/:tableName/:id', adminMiddleware, (req, res) => {
  try {
    const { tableName, id } = req.params
    if (!ALLOWED_TABLES.includes(tableName)) {
      return res.json({ success: false, message: '不允许操作该表' })
    }

    const pk = getPrimaryKey(tableName)
    const sql = `DELETE FROM \`${tableName}\` WHERE \`${pk}\` = ?`
    const result = run(sql, [id])

    res.json({ success: true, message: '删除成功', changes: result.changes })
  } catch (error) {
    console.error('删除数据失败:', error)
    res.status(500).json({ success: false, message: `删除失败: ${error.message}` })
  }
})

// 执行只读 SQL 查询（仅 SELECT）
router.post('/sql', adminMiddleware, (req, res) => {
  try {
    const { query } = req.body
    if (!query || typeof query !== 'string') {
      return res.json({ success: false, message: '请提供 SQL 查询语句' })
    }

    // 使用正则严格检查：只允许 SELECT 或 PRAGMA 开头
    if (!/^\s*(SELECT|PRAGMA)\b/i.test(query)) {
      return res.json({ success: false, message: '仅允许执行 SELECT 或 PRAGMA 查询' })
    }

    // 禁止危险关键字混入（防止 SELECT 语句中嵌入 DROP/INSERT/UPDATE/DELETE 等）
    const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'EXEC', 'ATTACH']
    const upperQuery = query.trim().toUpperCase()
    for (const keyword of dangerous) {
      if (upperQuery.includes(keyword)) {
        return res.json({ success: false, message: `查询中包含危险关键字: ${keyword}` })
      }
    }

    const result = getAll(query)

    // 获取列名
    let columns = []
    if (result.length > 0) {
      columns = Object.keys(result[0])
    }

    res.json({
      success: true,
      columns,
      rows: result,
      rowCount: result.length
    })
  } catch (error) {
    console.error('SQL 查询失败:', error)
    res.status(500).json({ success: false, message: `查询失败: ${error.message}` })
  }
})

// 数据库统计概览
router.get('/stats', adminMiddleware, (req, res) => {
  try {
    const stats = {}
    for (const tableName of ALLOWED_TABLES) {
      const result = getOne(`SELECT COUNT(*) as count FROM \`${tableName}\``)
      stats[tableName] = result ? result.count : 0
    }

    // 额外统计
    const adminCount = getOne("SELECT COUNT(*) as count FROM users WHERE userrank >= 3")
    stats.adminUsers = adminCount ? adminCount.count : 0

    res.json({ success: true, stats })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({ success: false, message: '获取统计失败' })
  }
})

export default router
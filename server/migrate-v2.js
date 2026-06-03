// V2 迁移脚本：为已有数据生成 UID/PID，转换 userrank 和 context
// 运行方式: node server/migrate-v2.js

import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data.db')

// 生成今日 YYYYMMDD 字符串
function getToday(dateStr) {
  if (dateStr) {
    return dateStr.substring(0, 10).replace(/-/g, '')
  }
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// 生成 UID: u/?=YYYYMMDDxxxx
function generateUid(db, today) {
  for (let i = 0; i < 100; i++) {
    const rand = String(Math.floor(1000 + Math.random() * 9000))
    const uid = `u/?=${today}${rand}`
    const stmt = db.prepare('SELECT 1 FROM users WHERE uid = ?')
    stmt.bind([uid])
    if (!stmt.step()) {
      stmt.free()
      return uid
    }
    stmt.free()
  }
  return null
}

// 生成 PID: p/?=YYYYMMDD{uid后4位}xx
function generatePid(db, today, uid) {
  const uidSuffix = uid.slice(-4)
  for (let i = 0; i < 100; i++) {
    const rand = String(Math.floor(10 + Math.random() * 90))
    const pid = `p/?=${today}${uidSuffix}${rand}`
    const stmt = db.prepare('SELECT 1 FROM posts WHERE pid = ?')
    stmt.bind([pid])
    if (!stmt.step()) {
      stmt.free()
      return pid
    }
    stmt.free()
  }
  return null
}

// 递归构建 context 链
function buildContext(db, postId, uidMap) {
  const stmt = db.prepare('SELECT pid, parent_id, user_id FROM posts WHERE id = ?')
  stmt.bind([postId])
  if (!stmt.step()) {
    stmt.free()
    return { context: '#', rootPid: null }
  }
  const row = stmt.getAsObject()
  stmt.free()

  if (row.parent_id === null || row.parent_id === undefined) {
    // 根帖子
    return { context: `#/${row.pid}`, rootPid: row.pid }
  }

  // 子帖：递归找父帖
  const parent = buildContext(db, row.parent_id, uidMap)
  const commenterUid = uidMap[row.user_id] || ''
  return {
    context: `${parent.context}/${commenterUid}`,
    rootPid: parent.rootPid
  }
}

async function main() {
  console.log('🔍 加载数据库...')
  const SQL = await initSqlJs()
  const buf = fs.readFileSync(dbPath)
  const db = new SQL.Database(buf)

  // 确认列存在
  console.log('📋 检查并添加新列...')
  try {
    const userCols = db.exec("PRAGMA table_info('users')")
    const userColNames = userCols[0].values.map(v => v[1])
    if (!userColNames.includes('uid')) db.run("ALTER TABLE users ADD COLUMN uid TEXT")
    if (!userColNames.includes('userrank')) db.run("ALTER TABLE users ADD COLUMN userrank INTEGER DEFAULT 0")
  } catch (e) { console.log('  users 列已存在或添加失败') }

  try {
    const postCols = db.exec("PRAGMA table_info('posts')")
    const postColNames = postCols[0].values.map(v => v[1])
    if (!postColNames.includes('pid')) db.run("ALTER TABLE posts ADD COLUMN pid TEXT")
    if (!postColNames.includes('postrank')) db.run("ALTER TABLE posts ADD COLUMN postrank TEXT DEFAULT '69'")
  } catch (e) { console.log('  posts 列已存在或添加失败') }

  // ============ 迁移用户 ============
  console.log('\n🔄 迁移用户...')
  const users = db.exec('SELECT id, is_admin, created_at FROM users ORDER BY id ASC')
  const uidMap = {}  // user_id -> uid

  if (users.length > 0) {
    for (const row of users[0].values) {
      const id = row[0]
      const isAdmin = row[1]
      const createdAt = row[2] || ''

      // 转换 userrank
      const userrank = isAdmin === 1 ? 3 : 1
      db.run('UPDATE users SET userrank = ? WHERE id = ?', [userrank, id])

      // 检查是否已有 UID
      const existing = db.exec('SELECT uid FROM users WHERE id = ?', [id])
      if (existing.length > 0 && existing[0].values.length > 0 && existing[0].values[0][0]) {
        uidMap[id] = existing[0].values[0][0]
        console.log(`  用户 #${id} 已有 UID: ${uidMap[id]}`)
        continue
      }

      const today = getToday(createdAt)
      const uid = generateUid(db, today)
      if (uid) {
        db.run('UPDATE users SET uid = ? WHERE id = ?', [uid, id])
        uidMap[id] = uid
        console.log(`  ✅ 用户 #${id} (is_admin=${isAdmin}) → userrank=${userrank}, uid=${uid}`)
      } else {
        console.log(`  ❌ 用户 #${id} UID 生成失败`)
      }
    }
  } else {
    console.log('  无用户数据')
  }

  // ============ 迁移帖子 ============
  console.log('\n🔄 迁移帖子...')
  const allPosts = db.exec('SELECT id, user_id, created_at FROM posts ORDER BY id ASC')

  // 第一遍：生成 PID
  if (allPosts.length > 0) {
    for (const row of allPosts[0].values) {
      const id = row[0]
      const userId = row[1]
      const createdAt = row[2] || ''

      const existingPid = db.exec('SELECT pid FROM posts WHERE id = ?', [id])
      if (existingPid.length > 0 && existingPid[0].values.length > 0 && existingPid[0].values[0][0]) {
        console.log(`  帖子 #${id} 已有 PID: ${existingPid[0].values[0][0]}`)
        continue
      }

      const userUid = uidMap[userId]
      if (!userUid) {
        console.log(`  ❌ 帖子 #${id} 作者 $#{userId} 无 UID，跳过`)
        continue
      }

      const today = getToday(createdAt)
      const pid = generatePid(db, today, userUid)
      if (pid) {
        db.run('UPDATE posts SET pid = ?, postrank = ? WHERE id = ?', [pid, '69', id])
        console.log(`  ✅ 帖子 #${id} → pid=${pid}`)
      } else {
        console.log(`  ❌ 帖子 #${id} PID 生成失败`)
      }
    }
  } else {
    console.log('  无帖子数据')
  }

  // ============ 迁移 context ============
  console.log('\n🔄 迁移 context 字段...')
  // 批量更新而非递归，用于修复
  const allPostsWithCtx = db.exec('SELECT id, parent_id, user_id, context FROM posts ORDER BY id ASC')

  if (allPostsWithCtx.length > 0) {
    // 先处理根帖子
    for (const row of allPostsWithCtx[0].values) {
      const id = row[0]
      const parentId = row[1]
      const userId = row[2]
      const oldContext = row[3]

      const pidResult = db.exec('SELECT pid FROM posts WHERE id = ?', [id])
      const pid = pidResult.length > 0 && pidResult[0].values.length > 0 ? pidResult[0].values[0][0] : null
      if (!pid) continue

      if (parentId === null || parentId === undefined) {
        const newContext = `#/${pid}`
        db.run('UPDATE posts SET context = ? WHERE id = ?', [newContext, id])
        console.log(`  📝 帖子 #${id} context: ${oldContext} → ${newContext}`)
      }
    }

    // 再处理子帖（多轮迭代直到全部更新）
    const totalPosts = allPostsWithCtx[0].values.length
    let done = 0
    for (let round = 0; round < 10; round++) {
      const remaining = db.exec(`SELECT p.id, p.parent_id, p.user_id, p.context, p2.context as parent_ctx 
        FROM posts p JOIN posts p2 ON p.parent_id = p2.id 
        WHERE p.context NOT LIKE '#/%' LIMIT 50`)
      if (remaining.length === 0 || remaining[0].values.length === 0) break

      for (const r of remaining[0].values) {
        const id = r[0]
        const parentId = r[1]
        const userId = r[2]
        const oldCtx = r[3]
        const parentCtx = r[4]

        const commenterUid = uidMap[userId] || ''
        const newContext = `${parentCtx}/${commenterUid}`
        db.run('UPDATE posts SET context = ? WHERE id = ?', [newContext, id])
        done++
        console.log(`  📝 子帖 #${id} context: ${oldCtx} → ${newContext}`)
      }
    }
    console.log(`  已更新 ${done} 个子帖 context`)
  }

  // ============ 迁移 notifications root ============
  console.log('\n🔄 迁移通知 root 字段...')
  const notifs = db.exec('SELECT id, root FROM notifications WHERE root IS NOT NULL')
  if (notifs.length > 0) {
    let notifUpdated = 0
    for (const row of notifs[0].values) {
      const notifId = row[0]
      const rootId = row[1] // 当前是数字 ID
      const pidResult = db.exec('SELECT pid FROM posts WHERE id = ?', [Number(rootId)])
      if (pidResult.length > 0 && pidResult[0].values.length > 0 && pidResult[0].values[0][0]) {
        const pid = pidResult[0].values[0][0]
        db.run('UPDATE notifications SET root = ? WHERE id = ?', [pid, notifId])
        notifUpdated++
      }
    }
    console.log(`  已更新 ${notifUpdated} 条通知`)
  } else {
    console.log('  无通知数据')
  }

  // ============ 保存 ============
  console.log('\n💾 保存数据库...')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)

  console.log('\n🎉 迁移完成！')
  console.log(`  - 已迁移 ${Object.keys(uidMap).length} 个用户`)
  console.log(`  - 已迁移 ${allPosts.length > 0 ? allPosts[0].values.length : 0} 个帖子`)
  db.close()
}

main().catch(e => {
  console.error('迁移失败:', e)
  process.exit(1)
})
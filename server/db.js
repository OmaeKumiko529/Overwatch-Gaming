import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data.db')

let db = null
let SQL = null
let saveTimer = null

// 保存数据库到文件（失败不抛异常）
function saveDb() {
  if (!db) return
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  } catch (e) {
    // 磁盘写入失败不抛异常——数据库内存状态已更新，下次写入会重试
    console.error('saveDb 写入磁盘失败:', e.message)
  }
}

// 防抖异步写入（避免高并发时频繁同步 I/O）
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveDb, 300)
}

// 初始化数据库
export async function getDb() {
  if (db) return db

  SQL = await initSqlJs()

  // 如果存在现有数据库文件，加载它
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // 启用 WAL 模式（通过 PRAGMA）
  db.run('PRAGMA foreign_keys = ON')

  // 创建表结构
  initSchema()

  // 确保 Admin 用户存在
  ensureAdminUser()

  return db
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '["flexible"]',
      is_admin INTEGER NOT NULL DEFAULT 0,
      uid TEXT UNIQUE,
      userrank INTEGER NOT NULL DEFAULT 0,
      avatar TEXT NOT NULL DEFAULT '/Head.png',
      team_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      likes INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      context TEXT DEFAULT '#',
      parent_id INTEGER,
      pid TEXT UNIQUE,
      postrank TEXT NOT NULL DEFAULT '69',
      mentions TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      creator_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      author TEXT,
      root TEXT,
      to_user INTEGER NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // 检查并添加新列（用于迁移旧数据库）
  try {
    const userCols = db.exec("PRAGMA table_info('users')")
    if (userCols.length > 0) {
      const colNames = userCols[0].values.map(v => v[1])
      if (!colNames.includes('is_admin')) {
        db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
      }
      if (!colNames.includes('uid')) {
        db.run("ALTER TABLE users ADD COLUMN uid TEXT UNIQUE")
      }
      if (!colNames.includes('userrank')) {
        db.run("ALTER TABLE users ADD COLUMN userrank INTEGER NOT NULL DEFAULT 0")
      }
      if (!colNames.includes('preference')) {
        db.run("ALTER TABLE users ADD COLUMN preference TEXT NOT NULL DEFAULT '{\"total\":0}'")
      }
    }
  } catch {}

  try {
    const postCols = db.exec("PRAGMA table_info('posts')")
    if (postCols.length > 0) {
      const colNames = postCols[0].values.map(v => v[1])
      if (!colNames.includes('pid')) {
        db.run("ALTER TABLE posts ADD COLUMN pid TEXT UNIQUE")
      }
      if (!colNames.includes('postrank')) {
        db.run("ALTER TABLE posts ADD COLUMN postrank TEXT NOT NULL DEFAULT '69'")
      }
      if (!colNames.includes('views')) {
        db.run("ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0")
      }
      if (!colNames.includes('tags')) {
        db.run("ALTER TABLE posts ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'")
      }
    }
  } catch {}

  // 创建点赞记录表（用于去重）
  db.run(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Overwatch 英雄数据表（从 OverFast API 同步，管理员手动触发）
  db.run(`
    CREATE TABLE IF NOT EXISTS ow_heroes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hero_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      portrait TEXT,
      role TEXT NOT NULL,
      subrole TEXT,
      data_json TEXT NOT NULL,
      last_synced TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
  try { db.run('CREATE INDEX IF NOT EXISTS idx_ow_heroes_role ON ow_heroes(role)') } catch {}
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_ow_heroes_key ON ow_heroes(hero_key)') } catch {}

  // 创建索引
  try { db.run('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_notifications_to_user ON notifications(to_user)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(user_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)') } catch {}

  saveDb()
}

// 确保 Admin 管理员用户存在
function ensureAdminUser() {
  const adminPassword = process.env.ADMIN_PASSWORD || '88888888'
  const uid = 'u-20260101-0000'

  const existing = getOne('SELECT id, password_hash, uid, userrank FROM users WHERE username = ?', ['Admin'])

  if (!existing) {
    if (adminPassword === '88888888') {
      console.warn('⚠️  警告: 使用默认管理员密码 (88888888)。请在 server/.env 中更改 ADMIN_PASSWORD')
    }
    const passwordHash = bcrypt.hashSync(adminPassword, 10)
    insert(
      'INSERT INTO users (username, email, password_hash, is_admin, uid, userrank) VALUES (?, ?, ?, ?, ?, ?)',
      ['Admin', 'admin@omaekumiko.com', passwordHash, 1, uid, 3]
    )
    console.log('👑 Admin 用户已创建 (密码从环境变量读取)')
  } else {
    // Admin 已存在 → 只补充缺失字段，绝不覆盖密码（尊重前端改的密码）
    const needsUpdate = []
    const params = []

    // 补充 uid（只有旧数据迁移时需要）
    if (!existing.uid) {
      needsUpdate.push('uid = ?')
      params.push(uid)
    }

    // 补充 userrank（如果为 0 则设为 3）
    if (!existing.userrank || existing.userrank === 0) {
      needsUpdate.push('userrank = ?')
      params.push(3)
    }

    if (needsUpdate.length > 0) {
      params.push('Admin')
      run(`UPDATE users SET ${needsUpdate.join(', ')} WHERE username = ?`, params)
      console.log('🔄 Admin 账户已同步 (uid/userrank 已补充)')
    }
  }
}

// 工具函数：查询单行
export function getOne(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

// 工具函数：查询多行
export function getAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

// 工具函数：执行写操作
export function run(sql, params = []) {
  db.run(sql, params)
  scheduleSave()
  return { changes: db.getRowsModified() }
}

// 工具函数：执行写操作并返回 lastInsertRowid
export function insert(sql, params = []) {
  db.run(sql, params)
  const result = db.exec("SELECT last_insert_rowid() as id")
  scheduleSave()
  const lastId = result.length > 0 ? result[0].values[0][0] : null
  return { lastInsertRowid: lastId, changes: db.getRowsModified() }
}

// 工具函数：执行事务
export function transaction(fn) {
  try {
    db.run('BEGIN TRANSACTION')
    fn()
    db.run('COMMIT')
    scheduleSave()
    return true
  } catch (error) {
    db.run('ROLLBACK')
    throw error
  }
}

// 工具函数：获取单个值
export function getValue(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let value = null
  if (stmt.step()) {
    const row = stmt.getAsObject()
    const keys = Object.keys(row)
    value = row[keys[0]]
  }
  stmt.free()
  return value
}

export { saveDb }
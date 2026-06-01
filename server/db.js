import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data.db')

let db = null
let SQL = null

// 保存数据库到文件
function saveDb() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }
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
      context TEXT DEFAULT '#',
      parent_id INTEGER,
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
      root INTEGER,
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

  // 检查 users 表中是否有 is_admin 列（用于迁移旧数据库）
  try {
    const columns = db.exec("PRAGMA table_info('users')")
    if (columns.length > 0) {
      const colNames = columns[0].values.map(v => v[1])
      if (!colNames.includes('is_admin')) {
        db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
      }
    }
  } catch {}

  // 创建索引
  try { db.run('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_notifications_to_user ON notifications(to_user)') } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(user_id)') } catch {}

  saveDb()
}

// 确保 Admin 管理员用户存在
function ensureAdminUser() {
  const existing = getOne('SELECT id FROM users WHERE username = ?', ['Admin'])
  if (!existing) {
    const passwordHash = bcrypt.hashSync('HsbXsy2626', 10)
    insert(
      'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
      ['Admin', 'admin@omaekumiko.com', passwordHash, 1]
    )
    console.log('👑 Admin 用户已创建')
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
  saveDb()
  return { changes: db.getRowsModified() }
}

// 工具函数：执行写操作并返回 lastInsertRowid
export function insert(sql, params = []) {
  db.run(sql, params)
  const result = db.exec("SELECT last_insert_rowid() as id")
  saveDb()
  const lastId = result.length > 0 ? result[0].values[0][0] : null
  return { lastInsertRowid: lastId, changes: db.getRowsModified() }
}

// 工具函数：执行事务
export function transaction(fn) {
  try {
    db.run('BEGIN TRANSACTION')
    fn()
    db.run('COMMIT')
    saveDb()
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
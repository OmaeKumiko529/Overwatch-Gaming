import fs from 'fs'
import initSqlJs from 'sql.js'
import bcrypt from 'bcryptjs'

const __dirname = import.meta.dirname
const dbPath = __dirname + '/data.db'

async function check() {
  const SQL = await initSqlJs()
  const buf = fs.readFileSync(dbPath)
  const db = new SQL.Database(buf)
  
  console.log('=== 数据库用户列表 ===')
  const stmt = db.prepare('SELECT id, username, uid, userrank, password_hash FROM users')
  while (stmt.step()) {
    const row = stmt.getAsObject()
    console.log(`id: ${row.id} | username: ${row.username} | uid: ${row.uid} | userrank: ${row.userrank} | pw_hash: ${row.password_hash ? row.password_hash.substring(0,25)+'...' : 'NULL'}`)
    
    // 测试默认密码
    if (row.username === 'Admin') {
      const match = bcrypt.compareSync('88888888', row.password_hash)
      console.log(`   -> 默认密码(88888888)验证: ${match ? '✅ 正确' : '❌ 错误'}`)
    }
  }
  stmt.free()
  
  console.log('\n=== 表列表 ===')
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  if (tables.length > 0) {
    tables[0].values.forEach(v => {
      const count = db.exec(`SELECT COUNT(*) as c FROM \`${v[0]}\``)
      const cnt = count.length > 0 ? count[0].values[0][0] : 0
      console.log(`  ${v[0]}: ${cnt} 行`)
    })
  }
  
  db.close()
}

check().catch(console.error)
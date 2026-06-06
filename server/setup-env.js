import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, '.env')

// 创建一个独立的 readline 接口供隐藏输入使用（避免冲突）
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

// 普通提问
function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const rl = createRL()
    const defaultStr = defaultValue ? ` (默认: ${defaultValue})` : ''
    rl.question(`${question}${defaultStr}: `, (answer) => {
      rl.close()
      resolve(answer.trim() || defaultValue)
    })
  })
}

// 隐藏输入提问（密码用）
function askPassword(question, defaultValue = '') {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout

    const defaultStr = defaultValue ? ` (DEFAULT ${defaultValue})` : ''
    stdout.write(`${question}${defaultStr}: `)

    // 检查是否 TTY，非 TTY 回退到普通 readline
    if (!stdin.isTTY) {
      const rl = createRL()
      rl.question(`${question}${defaultStr}: `, (answer) => {
        rl.close()
        resolve(answer.trim() || defaultValue)
      })
      return
    }

    // TTY 模式：手动处理输入，隐藏回显
    const wasRaw = stdin.isRaw
    stdin.setRawMode(true)
    stdin.resume()

    let password = ''

    const onData = (char) => {
      char = String(char)

      // Enter
      if (char === '\r' || char === '\n' || char === '\u000d' || char === '\u000a') {
        stdin.removeListener('data', onData)
        stdin.setRawMode(wasRaw || false)
        stdin.pause()
        stdout.write('\n')
        resolve(password || defaultValue)
        return
      }

      // Ctrl+C
      if (char === '\u0003') {
        stdin.removeListener('data', onData)
        stdin.setRawMode(wasRaw || false)
        stdin.pause()
        stdout.write('\n')
        process.exit(0)
        return
      }

      // Backspace
      if (char === '\b' || char === '\x7f' || char === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1)
          stdout.write('\b \b')
        }
        return
      }

      // 普通字符
      password += char
      stdout.write('*')
    }

    stdin.on('data', onData)
  })
}

/**
 * 交互式配置环境变量
 * 当 server/.env 文件不存在时由 index.js 调用
 */
export async function setupEnv() {
  console.log('')
  console.log('    ___       ___       ___       ___       ___       ___            ___       ___       ___   ')
  console.log('   /\\__\\     /\\__\\     /\\__\\     /\\  \\     /\\__\\     /\\  \\          /\\  \\     /\\  \\     /\\  \\  ')
  console.log('  /:/ _/_   /:/ _/_   /::L_L_   _\\:\\  \\   /:/ _/_   /::\\  \\        /::\\  \\   /::\\  \\   _\\:\\  \\ ')
  console.log(' /::-"\\__\\ /:/_/\\__\\ /:/L:\\__\\ /\\/::\\__\\ /::-"\\__\\ /:/\\:\\__\\      /::\\:\\__\\ /::\\:\\__\\ /\\/::\\__\\')
  console.log(' \\;:;-",-" \\:\\/:/  / \\/_/:/  / \\::/\\/__/ \\;:;-",-" \\:\\/:/  /      \\/\\::/  / \\/\\::/  / \\::/\\/__/')
  console.log('  |:|  |    \\::/  /    /:/  /   \\:\\__\\    |:|  |    \\::/  /         /:/  /     \\/__/   \\:\\__\\  ')
  console.log('   \\|__|     \\/__/     \\/__/     \\/__/     \\|__|     \\/__/          \\/__/               \\/__/')
  console.log('')
  console.log('')
  console.log('欢迎使用KUMIKO API服务接口')
  console.log('回车以使用默认配置')
  console.log('')

  // 1. ADMIN_PASSWORD管理员密码/默认88888888
  console.log('> Admin Password:')
  const adminPassword = await askPassword('  ADMIN_PASSWORD', '88888888')
  console.log('')

  // 2. JWT_SECRET/自动生成随机密钥
  console.log('> JWT 签名密钥')
  const randomSecret = crypto.randomBytes(32).toString('hex')
  const jwtSecret = await ask('  请输入密钥 | 或回车使用自动生成', randomSecret)
  console.log('')

  // 3. PORT/服务器端口
  console.log('▶ 服务器端口')
  const port = await ask('  请输入端口号', '3001')
  console.log('')

  // 4. CORS_ORIGINS/跨域白名单
  console.log('▶ CORS 允许的源（多个地址用逗号分隔）')
  const corsOrigins = await ask('  请输入允许的来源', 'http://localhost:5173,http://localhost:3000')
  console.log('')

  // 写入.env文件
  const envContent = `# =============================================
# Overwatch-Gaming 服务端环境配置
# 自动生成于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
# =============================================

# 管理员密码（默认: 8888）
ADMIN_PASSWORD=${adminPassword}

# JWT 签名密钥（重要！请勿泄露）
JWT_SECRET=${jwtSecret}

# 服务器端口（默认: 3001）
PORT=${port}

# CORS 允许的源（逗号分隔）
CORS_ORIGINS=${corsOrigins}
`

  fs.writeFileSync(ENV_PATH, envContent, 'utf-8')
  console.log('')
  console.log('环境文件已创建 server/.env')
  console.log('')
  console.log(`  配置摘要:`)
  console.log(`  ┌─────────────────────────────────────────────────────`)
  console.log(`  │  ADMIN_PASSWORD  = ${adminPassword}`)
  console.log(`  │  JWT_SECRET      = ${jwtSecret.substring(0, 16)}...`)
  console.log(`  │  PORT            = ${port}`)
  console.log(`  │  CORS_ORIGINS    = ${corsOrigins}`)
  console.log(`  └─────────────────────────────────────────────────────`)
  console.log('')
}

// 独立运行支持（直接 node server/setup-env.js）
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMainModule) {
  setupEnv().catch((err) => {
    console.error('配置出错 | ', err)
    process.exit(1)
  })
}
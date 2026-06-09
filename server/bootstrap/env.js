/**
 * 环境变量引导模块
 * 第一次运行时交互式创建 .env 文件
 */
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')

/**
 * 确保 .env 文件存在，如果不存在则引导用户创建
 * @returns {Promise<boolean>} 是否成功加载环境变量
 */
export async function ensureEnv() {
  if (!fs.existsSync(envPath)) {
    const { setupEnv } = await import('../setup-env.js')
    await setupEnv()
    dotenv.config({ path: envPath, override: true })
    console.log('环境变量已重新加载')
    console.log('')
  } else {
    dotenv.config({ path: envPath })
  }
  return true
}
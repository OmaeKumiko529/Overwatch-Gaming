// UID/PID 生成工具
// 使用: import { generateUid, generatePid } from './utils/identifiers.js'

// 从日期字符串提取 YYYYMMDD
export function extractDateStr(dateStr) {
  if (!dateStr) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}${m}${d}`
  }
  // 支持 "2026-06-01" 或 "2026-06-01T12:00:00" 格式
  return dateStr.substring(0, 10).replace(/-/g, '')
}

// 生成 UID: u-YYYYMMDD-xxxx
export function generateUid(getOne, dateStr) {
  const today = extractDateStr(dateStr)
  for (let i = 0; i < 100; i++) {
    const rand = String(Math.floor(1000 + Math.random() * 9000))
    const uid = `u-${today}-${rand}`
    const exists = getOne('SELECT 1 FROM users WHERE uid = ?', [uid])
    if (!exists) return uid
  }
  throw new Error('UID生成失败：当日注册量过大（超过100次冲突）')
}

// 生成 PID: p-YYYYMMDD-{uid后4位}-xx
export function generatePid(getOne, userUid, dateStr) {
  const today = extractDateStr(dateStr)
  const uidSuffix = userUid.slice(-4)
  for (let i = 0; i < 100; i++) {
    const rand = String(Math.floor(10 + Math.random() * 90))
    const pid = `p-${today}-${uidSuffix}-${rand}`
    const exists = getOne('SELECT 1 FROM posts WHERE pid = ?', [pid])
    if (!exists) return pid
  }
  throw new Error('PID生成失败：当日发帖量过大（超过100次冲突）')
}

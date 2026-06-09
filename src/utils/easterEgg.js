/**
 * 🥚 开发者彩蛋 - 咕咕嘎嘎
 * 
 * 按下 F12 打开控制台即可看到
 */

// 凸版风格的咕咕嘎嘎字符画
const asciiArt = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ██████      ██    ██     ██████      ██    ██            ║
║    ██           ██    ██    ██           ██    ██            ║
║    ██   ███     ██    ██    ██   ███     ██    ██            ║
║    ██    ██     ██    ██    ██    ██     ██    ██            ║
║     ██████       ██████      ██████       ██████             ║
║                                                              ║
║     ██████      ██████       ██████      ██████              ║
║    ██          ██    ██     ██          ██    ██             ║
║    ██   ███    ████████     ██   ███    ████████             ║
║    ██    ██    ██    ██     ██    ██    ██    ██             ║
║     ██████     ██    ██      ██████     ██    ██             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  ╔═══════════════════════════════════════════════════════════╗
  ║   🐔  咕咕嘎嘎 · 开发者彩蛋 · E426 Overwatch Platform      ║
  ║                                                           ║
  ║    "咕咕嘎嘎咕咕嘎嘎咕咕嘎嘎咕咕嘎嘎咕咕嘎嘎咕咕嘎嘎"          ║
  ║              —— 来自开发团队的小小惊喜 🎮                   ║
  ╚═══════════════════════════════════════════════════════════╝
`

// 凸版风格样式 - 加大加亮让控制台更清晰
const styleTitle = [
  'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'color: #fff',
  'font-family: "Courier New", monospace',
  'font-size: 14px',
  'font-weight: bold',
  'padding: 12px 24px',
  'line-height: 1.6',
  'border: 3px solid #fff',
  'box-shadow: 0 0 30px rgba(102, 126, 234, 0.7)',
  'text-shadow: 2px 2px 4px rgba(0,0,0,0.6)',
  'border-radius: 8px',
  'white-space: pre'
].join(';')

const styleBody = [
  'color: #00ff88',
  'font-family: "Courier New", monospace',
  'font-size: 13px',
  'font-weight: bold',
  'line-height: 1.5',
  'text-shadow: 0 0 4px rgba(0,255,136,0.3)',
  'white-space: pre'
].join(';')

// 直接输出彩蛋
console.clear()
const lines = asciiArt.split('\n')
lines.forEach((line, index) => {
  if (index === 0) {
    console.log(`%c${line}`, styleTitle)
  } else {
    console.log(`%c${line}`, styleBody)
  }
})

console.log(
  '%c 🐔 咕咕嘎嘎 ',
  'background: #ff6b6b; color: #fff; font-size: 18px; font-weight: bold; padding: 10px 20px; border-radius: 6px; text-shadow: 2px 2px 0 #c0392b; border: 2px solid #fff;'
)

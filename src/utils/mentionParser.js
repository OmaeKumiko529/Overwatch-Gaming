// 从HTML内容中提取提及的用户
export function extractMentionsFromHTML(htmlContent) {
  if (!htmlContent) return []
  
  const mentions = []
  
  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  
  // 查找所有用户提及元素
  const mentionElements = tempDiv.querySelectorAll('.user-mention[data-id], span[data-type="mention"]')
  
  mentionElements.forEach(element => {
    const userId = element.getAttribute('data-id') || element.getAttribute('data-user-id')
    const username = element.getAttribute('data-username') || element.getAttribute('data-label') || element.textContent.replace('@', '')
    
    if (userId && username) {
      // 避免重复
      if (!mentions.some(m => String(m.id) === String(userId))) {
        mentions.push({
          id: String(userId), // 统一使用字符串
          username: username
        })
      }
    }
  })
  
  return mentions
}

// 从纯文本中提取提及（@username格式）
export function extractMentionsFromText(textContent) {
  if (!textContent) return []
  
  const mentions = []
  const mentionRegex = /@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  let match
  
  while ((match = mentionRegex.exec(textContent)) !== null) {
    const username = match[1]
    // 不要重复
    if (!mentions.some(m => m.username === username)) {
      mentions.push({
        username: username,
        id: null // 需要后续通过用户名查找ID
      })
    }
  }
  
  return mentions
}

// 获取唯一的提及用户列表
// 获取唯一的提及用户列表
export function getUniqueMentions(mentions) {
  const uniqueMap = new Map()
  
  mentions.forEach(mention => {
    if (mention.id) {
      uniqueMap.set(mention.id, mention)
    } else if (mention.username) {
      uniqueMap.set(mention.username, mention)
    }
  })
  
  return Array.from(uniqueMap.values())
}

export default {
  extractMentionsFromHTML,
  extractMentionsFromText,
  getUniqueMentions
}
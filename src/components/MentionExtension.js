import { Mention } from '@tiptap/extension-mention'

// 用户提及扩展配置
export const UserMention = Mention.extend({
  name: 'userMention',
  
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-id': attributes.id
          }
        }
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }
          return {
            'data-label': attributes.label
          }
        }
      },
      username: {
        default: null,
        parseHTML: element => element.getAttribute('data-username'),
        renderHTML: attributes => {
          if (!attributes.username) {
            return {}
          }
          return {
            'data-username': attributes.username
          }
        }
      }
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'user-mention',
        'data-type': 'mention'
      },
      `@${node.attrs.label || node.attrs.username}`
    ]
  },

  addCommands() {
    return {
      insertMention: (attributes) => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: attributes
          })
          .run()
      }
    }
  }
})

// 创建提及建议配置
export const createMentionSuggestion = (onSearch, onSelect) => {
  return {
    char: '@',
    allowSpaces: false,
    allowedPrefixes: [' ', '\n', '\t'],
    items: ({ query }) => {
      return onSearch(query)
    },
    
    render: () => {
      let component
      let popup

      return {
        onStart: (props) => {
          component = document.createElement('div')
          component.className = 'mention-suggestion-popup'
          
          // 创建建议列表
          const list = document.createElement('ul')
          list.className = 'mention-suggestion-list'
          
          props.items.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = 'mention-suggestion-item'
            li.dataset.index = index
            
            // 创建用户头像
            const avatar = document.createElement('img')
            avatar.src = item.avatar || '/Head.png'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            // 创建用户名
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            // 创建用户ID显示
            const userId = document.createElement('span')
            userId.className = 'mention-suggestion-userid'
            userId.textContent = `#${item.id}`
            
            li.appendChild(avatar)
            li.appendChild(username)
            li.appendChild(userId)
            
            li.addEventListener('click', () => {
              onSelect(item)
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          component.appendChild(list)
          document.body.appendChild(component)
          popup = component
          
          // 定位弹出框
          updatePosition(props)
        },
        
        onUpdate: (props) => {
          if (!popup) return
          
          // 更新建议列表
          const list = popup.querySelector('.mention-suggestion-list')
          list.innerHTML = ''
          
          props.items.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = 'mention-suggestion-item'
            li.dataset.index = index
            
            const avatar = document.createElement('img')
            avatar.src = item.avatar || '/Head.png'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            const userId = document.createElement('span')
            userId.className = 'mention-suggestion-userid'
            userId.textContent = `#${item.id}`
            
            li.appendChild(avatar)
            li.appendChild(username)
            li.appendChild(userId)
            
            li.addEventListener('click', () => {
              onSelect(item)
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          updatePosition(props)
        },
        
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            props.event.stopPropagation()
            props.event.preventDefault()
            return true
          }
          
          if (props.event.key === 'Enter') {
            props.event.stopPropagation()
            props.event.preventDefault()
            
            if (props.items.length > 0) {
              const selectedItem = props.items[props.range.index]
              onSelect(selectedItem)
              props.command({ id: selectedItem.id, label: selectedItem.username, username: selectedItem.username })
              return true
            }
          }
          
          return false
        },
        
        onExit: () => {
          if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup)
          }
          component = null
          popup = null
        }
      }
    }
  }
}

// 更新弹出框位置
function updatePosition(props) {
  const popup = document.querySelector('.mention-suggestion-popup')
  
  if (!popup) return
  
  // ⚠️ 关键：clientRect 可能是函数！
  const rect = props.clientRect?.()
  
  if (!rect) {
    // fallback：避免跑左下角
    popup.style.top = '100px'
    popup.style.left = '100px'
    return
  }
  
  // 获取视口尺寸
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // 计算弹出框位置
  let top = rect.bottom + window.scrollY + 6  // 👈 往下偏一点点
  let left = rect.left + window.scrollX
  
  // 确保弹出框不会超出视口右侧
  const popupWidth = popup.offsetWidth || 250
  if (left + popupWidth > viewportWidth) {
    left = viewportWidth - popupWidth - 10
  }
  
  // 确保弹出框不会超出视口底部
  const popupHeight = popup.offsetHeight || 300
  if (top + popupHeight > viewportHeight + window.scrollY) {
    // 如果下方空间不足，显示在光标上方
    top = rect.top + window.scrollY - popupHeight
  }
  
  // 确保位置不为负
  top = Math.max(10, top)
  left = Math.max(10, left)
  
  // 设置位置
  popup.style.position = 'absolute'
  popup.style.top = `${top}px`
  popup.style.left = `${left}px`
  popup.style.zIndex = '9999'
  
  // 如果没有建议，隐藏弹出框
  if (props.items.length === 0) {
    popup.style.display = 'none'
  } else {
    popup.style.display = 'block'
  }
}

// 简化的提及建议配置（使用Tiptap官方方式）
export const createSimpleMentionSuggestion = (onSearch) => {
  return {
    char: '@',
    allowSpaces: false,
    allowedPrefixes: [' ', '\n', '\t'],
    items: ({ query }) => {
      return onSearch(query)
    },
    render: () => {
      let component
      let popup
      let selectedIndex = 0

      return {
        onStart: (props) => {
          component = document.createElement('div')
          component.className = 'mention-suggestion-popup'
          
          const list = document.createElement('ul')
          list.className = 'mention-suggestion-list'
          
          props.items.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = index === selectedIndex ? 'mention-suggestion-item selected' : 'mention-suggestion-item'
            li.dataset.index = index
            
            const avatar = document.createElement('img')
            avatar.src = item.avatar || '/Head.png'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            const userId = document.createElement('span')
            userId.className = 'mention-suggestion-userid'
            userId.textContent = `#${item.id}`
            
            li.appendChild(avatar)
            li.appendChild(username)
            li.appendChild(userId)
            
            li.addEventListener('click', () => {
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          component.appendChild(list)
          document.body.appendChild(component)
          popup = component
          
          // 定位
          // ⚠️ 关键：clientRect 可能是函数！
          const rect = props.clientRect?.()
          
          if (rect) {
            component.style.position = 'absolute'
            
            // 获取视口尺寸
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            
            // 计算弹出框位置
            let top = rect.bottom + window.scrollY + 6  // 👈 往下偏一点点
            let left = rect.left + window.scrollX
            
            // 确保弹出框不会超出视口右侧
            const popupWidth = 250 // 默认宽度
            if (left + popupWidth > viewportWidth) {
              left = viewportWidth - popupWidth - 10
            }
            
            // 确保弹出框不会超出视口底部
            const popupHeight = 300 // 默认高度
            if (top + popupHeight > viewportHeight + window.scrollY) {
              // 如果下方空间不足，显示在光标上方
              top = rect.top + window.scrollY - popupHeight
            }
            
            // 确保位置不为负
            top = Math.max(10, top)
            left = Math.max(10, left)
            
            component.style.top = `${top}px`
            component.style.left = `${left}px`
            component.style.zIndex = '9999'
          } else {
            // fallback：避免跑左下角
            component.style.position = 'absolute'
            component.style.top = '100px'
            component.style.left = '100px'
            component.style.zIndex = '9999'
          }
        },
        
        onUpdate: (props) => {
          if (!popup) return
          
          const list = popup.querySelector('.mention-suggestion-list')
          list.innerHTML = ''
          
          props.items.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = index === selectedIndex ? 'mention-suggestion-item selected' : 'mention-suggestion-item'
            li.dataset.index = index
            
            const avatar = document.createElement('img')
            avatar.src = item.avatar || '/Head.png'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            const userId = document.createElement('span')
            userId.className = 'mention-suggestion-userid'
            userId.textContent = `#${item.id}`
            
            li.appendChild(avatar)
            li.appendChild(username)
            li.appendChild(userId)
            
            li.addEventListener('click', () => {
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          // 更新位置
          // ⚠️ 关键：clientRect 可能是函数！
          const rect = props.clientRect?.()
          
          if (rect) {
            // 获取视口尺寸
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            
            // 计算弹出框位置
            let top = rect.bottom + window.scrollY + 6  // 👈 往下偏一点点
            let left = rect.left + window.scrollX
            
            // 确保弹出框不会超出视口右侧
            const popupWidth = popup.offsetWidth || 250
            if (left + popupWidth > viewportWidth) {
              left = viewportWidth - popupWidth - 10
            }
            
            // 确保弹出框不会超出视口底部
            const popupHeight = popup.offsetHeight || 300
            if (top + popupHeight > viewportHeight + window.scrollY) {
              // 如果下方空间不足，显示在光标上方
              top = rect.top + window.scrollY - popupHeight
            }
            
            // 确保位置不为负
            top = Math.max(10, top)
            left = Math.max(10, left)
            
            popup.style.top = `${top}px`
            popup.style.left = `${left}px`
          } else {
            // fallback：避免跑左下角
            popup.style.top = '100px'
            popup.style.left = '100px'
          }
        },
        
        onKeyDown: (props) => {
          const items = props.items
          
          if (props.event.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length
            props.event.preventDefault()
            return true
          }
          
          if (props.event.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % items.length
            props.event.preventDefault()
            return true
          }
          
          if (props.event.key === 'Enter') {
            if (items.length > 0) {
              props.command({ 
                id: items[selectedIndex].id, 
                label: items[selectedIndex].username, 
                username: items[selectedIndex].username 
              })
              props.event.preventDefault()
              return true
            }
          }
          
          if (props.event.key === 'Escape') {
            props.event.preventDefault()
            return true
          }
          
          return false
        },
        
        onExit: () => {
          if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup)
          }
          component = null
          popup = null
          selectedIndex = 0
        }
      }
    }
  }
}

// 导出默认配置
export default {
  UserMention,
  createMentionSuggestion,
  createSimpleMentionSuggestion
}
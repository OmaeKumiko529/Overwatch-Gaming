import { Mention } from '@tiptap/extension-mention'

// ç¨ćˇćĺćŠĺąéç˝Ž
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

// ĺĺťşćĺĺťşčŽŽéç˝Ž
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
          
          // ĺĺťşĺťşčŽŽĺčĄ¨
          const list = document.createElement('ul')
          list.className = 'mention-suggestion-list'
          
          props.items.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = 'mention-suggestion-item'
            li.dataset.index = index
            
            // ĺĺťşç¨ćˇĺ¤´ĺ
            const avatar = document.createElement('img')
avatar.src = item.avatar || '/default-avatar.webp'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            // ĺĺťşç¨ćˇĺďźä¸ĺćžç¤şIDďź?
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            li.appendChild(avatar)
            li.appendChild(username)
            
            li.addEventListener('click', () => {
              onSelect(item)
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          component.appendChild(list)
          document.body.appendChild(component)
          popup = component
          
          // ĺŽä˝ĺźšĺşćĄ?
          updatePosition(props)
        },
        
        onUpdate: (props) => {
          if (!popup) return
          
          // ć´ć°ĺťşčŽŽĺčĄ¨
          const list = popup.querySelector('.mention-suggestion-list')
          list.innerHTML = ''
          
          props.items.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = 'mention-suggestion-item'
            li.dataset.index = index
            
            const avatar = document.createElement('img')
            avatar.src = item.avatar || '/default-avatar.webp'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            li.appendChild(avatar)
            li.appendChild(username)
            
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

// ć´ć°ĺźšĺşćĄä˝ç˝?
function updatePosition(props) {
  const popup = document.querySelector('.mention-suggestion-popup')
  
  if (!popup) return
  
  // â ď¸ ĺłéŽďźclientRect ĺŻč˝ćŻĺ˝ć°ďź
  const rect = props.clientRect?.()
  
  if (!rect) {
    // fallbackďźéżĺčˇĺˇŚä¸č§?
    popup.style.top = '100px'
    popup.style.left = '100px'
    return
  }
  
  // čˇĺč§ĺŁĺ°şĺŻ¸
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // čŽĄçŽĺźšĺşćĄä˝ç˝?
  let top = rect.bottom + window.scrollY + 6  // đ ĺžä¸ĺä¸çšçš
  let left = rect.left + window.scrollX
  
  // çĄŽäżĺźšĺşćĄä¸äźčśĺşč§ĺŁĺłäž?
  const popupWidth = popup.offsetWidth || 250
  if (left + popupWidth > viewportWidth) {
    left = viewportWidth - popupWidth - 10
  }
  
  // çĄŽäżĺźšĺşćĄä¸äźčśĺşč§ĺŁĺşé?
  const popupHeight = popup.offsetHeight || 300
  if (top + popupHeight > viewportHeight + window.scrollY) {
    // ĺŚćä¸ćšçŠşé´ä¸čśłďźćžç¤şĺ¨ĺć ä¸ćš
    top = rect.top + window.scrollY - popupHeight
  }
  
  // çĄŽäżä˝ç˝Žä¸ä¸şč´?
  top = Math.max(10, top)
  left = Math.max(10, left)
  
  // čŽžç˝Žä˝ç˝Ž
  popup.style.position = 'absolute'
  popup.style.top = `${top}px`
  popup.style.left = `${left}px`
  popup.style.zIndex = '9999'
  
  // ĺŚćć˛ĄćĺťşčŽŽďźéčĺźšĺşćĄ
  if (props.items.length === 0) {
    popup.style.display = 'none'
  } else {
    popup.style.display = 'block'
  }
}

// çŽĺçćĺĺťşčŽŽéç˝Žďźä˝żç¨TiptapĺŽćšćšĺźďź?
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
            avatar.src = item.avatar || '/default-avatar.webp'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            li.appendChild(avatar)
            li.appendChild(username)
            
            li.addEventListener('click', () => {
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          component.appendChild(list)
          document.body.appendChild(component)
          popup = component
          
          // ĺŽä˝
          // â ď¸ ĺłéŽďźclientRect ĺŻč˝ćŻĺ˝ć°ďź
          const rect = props.clientRect?.()
          
          if (rect) {
            component.style.position = 'absolute'
            
            // čˇĺč§ĺŁĺ°şĺŻ¸
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            
            // čŽĄçŽĺźšĺşćĄä˝ç˝?
            let top = rect.bottom + window.scrollY + 6  // đ ĺžä¸ĺä¸çšçš
            let left = rect.left + window.scrollX
            
            // çĄŽäżĺźšĺşćĄä¸äźčśĺşč§ĺŁĺłäž?
            const popupWidth = 250 // éťčŽ¤ĺŽ˝ĺşŚ
            if (left + popupWidth > viewportWidth) {
              left = viewportWidth - popupWidth - 10
            }
            
            // çĄŽäżĺźšĺşćĄä¸äźčśĺşč§ĺŁĺşé?
            const popupHeight = 300 // éťčŽ¤éŤĺşŚ
            if (top + popupHeight > viewportHeight + window.scrollY) {
              // ĺŚćä¸ćšçŠşé´ä¸čśłďźćžç¤şĺ¨ĺć ä¸ćš
              top = rect.top + window.scrollY - popupHeight
            }
            
            // çĄŽäżä˝ç˝Žä¸ä¸şč´?
            top = Math.max(10, top)
            left = Math.max(10, left)
            
            component.style.top = `${top}px`
            component.style.left = `${left}px`
            component.style.zIndex = '9999'
          } else {
            // fallbackďźéżĺčˇĺˇŚä¸č§?
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
            avatar.src = item.avatar || '/default-avatar.webp'
            avatar.className = 'mention-suggestion-avatar'
            avatar.alt = item.username
            
            const username = document.createElement('span')
            username.className = 'mention-suggestion-username'
            username.textContent = item.username
            
            li.appendChild(avatar)
            li.appendChild(username)
            
            li.addEventListener('click', () => {
              props.command({ id: item.id, label: item.username, username: item.username })
            })
            
            list.appendChild(li)
          })
          
          // ć´ć°ä˝ç˝Ž
          // â ď¸ ĺłéŽďźclientRect ĺŻč˝ćŻĺ˝ć°ďź
          const rect = props.clientRect?.()
          
          if (rect) {
            // čˇĺč§ĺŁĺ°şĺŻ¸
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            
            // čŽĄçŽĺźšĺşćĄä˝ç˝?
            let top = rect.bottom + window.scrollY + 6  // đ ĺžä¸ĺä¸çšçš
            let left = rect.left + window.scrollX
            
            // çĄŽäżĺźšĺşćĄä¸äźčśĺşč§ĺŁĺłäž?
            const popupWidth = popup.offsetWidth || 250
            if (left + popupWidth > viewportWidth) {
              left = viewportWidth - popupWidth - 10
            }
            
            // çĄŽäżĺźšĺşćĄä¸äźčśĺşč§ĺŁĺşé?
            const popupHeight = popup.offsetHeight || 300
            if (top + popupHeight > viewportHeight + window.scrollY) {
              // ĺŚćä¸ćšçŠşé´ä¸čśłďźćžç¤şĺ¨ĺć ä¸ćš
              top = rect.top + window.scrollY - popupHeight
            }
            
            // çĄŽäżä˝ç˝Žä¸ä¸şč´?
            top = Math.max(10, top)
            left = Math.max(10, left)
            
            popup.style.top = `${top}px`
            popup.style.left = `${left}px`
          } else {
            // fallbackďźéżĺčˇĺˇŚä¸č§?
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

// ĺŻźĺşéťčŽ¤éç˝Ž
export default {
  UserMention,
  createMentionSuggestion,
  createSimpleMentionSuggestion
}
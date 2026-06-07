import { Node, mergeAttributes } from '@tiptap/core'

/**
 * 自定义 TipTap 节点 — <git> 仓库引用
 *
 * 编辑器内显示为可点击的卡片
 * 输出 HTML: <git data-title="..." data-platform="..." data-contributors="..."></git>
 */
export const GitNode = Node.create({
  name: 'git',

  group: 'block',

  selectable: true,

  draggable: false,

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: element => element.getAttribute('data-url'),
        renderHTML: attributes => {
          if (!attributes.url) return {}
          return { 'data-url': attributes.url }
        }
      },
      platform: {
        default: 'github',
        parseHTML: element => element.getAttribute('data-platform'),
        renderHTML: attributes => {
          if (!attributes.platform) return {}
          return { 'data-platform': attributes.platform }
        }
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) return {}
          return { 'data-title': attributes.title }
        }
      },
      contributors: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-contributors'),
        renderHTML: attributes => {
          if (!attributes.contributors) return {}
          return { 'data-contributors': attributes.contributors }
        }
      }
    }
  },

  parseHTML() {
    return [
      { tag: 'git' }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const platform = node.attrs.platform || 'github'
    const title = node.attrs.title || '未知仓库'
    const url = node.attrs.url || ''
    let contributors = []
    try {
      contributors = JSON.parse(node.attrs.contributors || '[]')
    } catch (e) {
      contributors = []
    }

    // 构建贡献者展示 - 使用 TipTap 嵌套数组，而非 HTML 字符串
    const maxShow = 2
    const shown = contributors.slice(0, maxShow)
    const contribChildren = []
    shown.forEach(c => {
      contribChildren.push(
        ['img', { src: c.avatar_url, alt: c.login, class: 'git-contributor-avatar', title: c.login }]
      )
      contribChildren.push(
        ['span', { class: 'git-contributor-name' }, c.login]
      )
    })
    if (contributors.length > maxShow) {
      contribChildren.push(
        ['span', { class: 'git-contributor-more' }, `...等${contributors.length}个贡献者`]
      )
    }

    return [
      'git',
      mergeAttributes(HTMLAttributes, {
        class: 'git-card',
        'data-platform': platform,
        'data-url': url,
        'data-title': title,
        'data-contributors': node.attrs.contributors || '[]'
      }),
      [
        'div',
        { class: 'git-card-header' },
        [
          'span',
          { class: 'git-platform-icon' },
          platform === 'github' ? '🔗' : '🔗'
        ],
        [
          'span',
          { class: 'git-card-title' },
          title
        ]
      ],
      [
        'div',
        { class: 'git-card-body' },
        [
          'div',
          { class: 'git-contributors' },
          ...contribChildren
        ]
      ]
    ]
  },

  addCommands() {
    return {
      insertGit: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            url: attrs.url || '',
            platform: attrs.platform || 'github',
            title: attrs.title || '',
            contributors: attrs.contributors || '[]'
          }
        })
      }
    }
  }
})

export default GitNode
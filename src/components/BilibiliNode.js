import { Node, mergeAttributes } from '@tiptap/core'

/**
 * 自定义 TipTap 节点 — <bv>BV号</bv>
 * 
 * 编辑器内显示为蓝色可点击的胶囊标签
 * 输出 HTML: <bv>BV1NArXB4E5q</bv>
 */
export const BilibiliNode = Node.create({
  name: 'bilibili',

  group: 'inline',

  inline: true,

  selectable: true,

  draggable: false,

  atom: true,

  addAttributes() {
    return {
      bvid: {
        default: null,
        parseHTML: element => {
          // 从 <bv>BVxxx</bv> 标签取文本内容
          return element.textContent?.trim() || null
        },
        renderHTML: attributes => {
          return {}
        }
      }
    }
  },

  parseHTML() {
    return [
      { tag: 'bv' }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const bvid = node.attrs.bvid || node.text || '未知BV号'
    return [
      'bv',
      mergeAttributes(HTMLAttributes, {
        'data-bvid': bvid,
        'class': 'bilibili-inline'
      }),
      bvid
    ]
  },

  addCommands() {
    return {
      insertBilibili: (bvid) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { bvid }
        })
      }
    }
  }
})

export default BilibiliNode
import { usePopupStore } from '../stores/popup.js'

/**
 * 通用弹窗快捷调用工具
 *
 * 用法：
 *   import pop from '@/utils/pop.js'
 *
 *   - 简单弹窗
 *   pop.up('提示', '操作成功！')
 *   pop.up('错误', '发生了一个错误', 'error')
 *
 *   - 配置对象
 *   pop.up({ title: '警告', text: '确定删除？', icon: 'warning', style: 'ow' })
 *
 *   - 确认框（Promise 方式）
 *   const ok = await pop.confirm('确定删除？')
 *   if (ok) { // 执行删除 }
 *
 *   - 图片图标
 *   pop.up({ title: '自定义', text: '...', icon: '/my-icon.png' })
 *
 *   - 守望先锋风格
 *   pop.up({ title: '提示', text: '...', style: 'ow' })
 *
 *   - 自定义按钮文字 + 自动关闭
 *   pop.up({ title: '成功', text: '已保存', style: 'dark', confirmText: '好的', timeout: 3000 })
 *
 *   - 隐藏关闭按钮 + 嵌入自定义内容（通过插槽）
 *   pop.up({ title: '加载中', text: '请稍候...', hideButtons: true, closeOnOverlay: false })
 *
 *   - 关闭弹窗
 *   pop.hide()
 */

const pop = {
  /**
   * 弹出通用提示弹窗
   * @param {Object|string} config - 配置对象或标题字符串
   * @param {string} [text] - 当 config 为字符串时，此为文本内容
   * @param {string} [icon] - 当 config 为字符串时，此为图标类型
   * @returns {Promise<boolean>}
   */
  up(config, text, icon) {
    const store = usePopupStore()
    return store.open(config, text, icon)
  },

  /**
   * 快捷确认框
   * @param {string} title - 标题
   * @param {string} [text] - 内容
   * @param {Object} [options] - 额外配置
   * @returns {Promise<boolean>} true=确认, false=取消
   */
  confirm(title, text = '', options = {}) {
    const store = usePopupStore()
    return store.open({
      title,
      text,
      icon: options.icon || 'question',
      confirm: true,
      cancel: true,
      confirmText: options.confirmText || '确认',
      cancelText: options.cancelText || '取消',
      style: options.style || 'common',
      ...options
    })
  },

  /**
   * 成功提示
   * @param {string} title
   * @param {string} [text]
   * @param {Object} [options]
   */
  success(title, text = '', options = {}) {
    const store = usePopupStore()
    return store.open({
      title,
      text,
      icon: 'success',
      style: 'common',
      ...options
    })
  },

  /**
   * 错误提示
   * @param {string} title
   * @param {string} [text]
   * @param {Object} [options]
   */
  error(title, text = '', options = {}) {
    const store = usePopupStore()
    return store.open({
      title,
      text,
      icon: 'error',
      style: 'common',
      ...options
    })
  },

  /**
   * 警告提示
   * @param {string} title
   * @param {string} [text]
   * @param {Object} [options]
   */
  warning(title, text = '', options = {}) {
    const store = usePopupStore()
    return store.open({
      title,
      text,
      icon: 'warning',
      style: 'common',
      ...options
    })
  },

  /**
   * 信息提示
   * @param {string} title
   * @param {string} [text]
   * @param {Object} [options]
   */
  info(title, text = '', options = {}) {
    const store = usePopupStore()
    return store.open({
      title,
      text,
      icon: 'info',
      style: 'common',
      ...options
    })
  },

  /**
   * Toast 轻提示（底部弹出，1秒后自动消失）
   * @param {string} text - 提示文本
   * @param {string} [icon] - 图标类型：'success' / 'error' / 'warning' / 'info'
   * @param {Object} [options] - 额外配置（如 timeout）
   */
  toast(text, icon = '', options = {}) {
    const store = usePopupStore()
    return store.open({
      title: '',
      text,
      icon: icon || 'info',
      style: 'toast',
      hideButtons: true,
      closeOnOverlay: false,
      timeout: options.timeout || 1000,
      ...options
    })
  },

  /**
   * 关闭当前弹窗
   */
  hide() {
    const store = usePopupStore()
    store.close()
  }
}

export default pop

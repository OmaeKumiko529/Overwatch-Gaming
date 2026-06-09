import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Emoji 映射表
const ICON_MAP = {
  success: { emoji: '✅', type: 'success' },
  warning: { emoji: '⚠️', type: 'warning' },
  error: { emoji: '❌', type: 'error' },
  info: { emoji: 'ℹ️', type: 'info' },
  question: { emoji: '❓', type: 'info' },
  confirm: { emoji: '❓', type: 'confirm' }
}

export const usePopupStore = defineStore('popup', () => {
  // ======== 状态 ========
  const visible = ref(false)
  const title = ref('')
  const text = ref('')
  const icon = ref(null)          // 字符串（emoji关键字）或图片路径
  const iconType = ref('info')    // success / warning / error / info
  const isImageIcon = ref(false)  // 是否使用图片图标
  const styleName = ref('common') // 样式名
  const showConfirm = ref(false)
  const showCancel = ref(false)
  const confirmText = ref('确认')
  const cancelText = ref('取消')
  const closeOnOverlay = ref(true)
  const hideButtons = ref(false)  // 纯展示模式，无按钮，点击空白/延迟关闭

  // Promise 相关（声明在顶部，避免变量提升问题）
  let _resolve = null
  let _onConfirm = null
  let _onCancel = null

  // ======== 计算属性 ========
  const iconDisplay = computed(() => {
    if (isImageIcon.value) return null
    const entry = ICON_MAP[icon.value]
    return entry ? entry.emoji : null
  })

  const derivedType = computed(() => {
    if (isImageIcon.value) return iconType.value
    const entry = ICON_MAP[icon.value]
    return entry ? entry.type : iconType.value
  })

  // ======== 方法 ========

  /**
   * 打开弹窗，返回 Promise
   * @param {Object|string} config - 配置对象，或字符串（作为 title）
   * @param {string} [config.title] - 标题
   * @param {string} [config.text] - 内容文本
   * @param {string} [config.icon] - emoji关键字(success/warning/error/info) 或 图片路径
   * @param {string} [config.style] - 样式名（对应 popupStyles.json 的 key）
   * @param {boolean} [config.confirm] - 是否显示确认按钮
   * @param {boolean} [config.cancel] - 是否显示取消按钮
   * @param {string} [config.confirmText] - 确认按钮文字
   * @param {string} [config.cancelText] - 取消按钮文字
   * @param {boolean} [config.closeOnOverlay] - 点击遮罩是否关闭
   * @param {Function} [config.onConfirm] - 确认回调
   * @param {Function} [config.onCancel] - 取消回调
   * @param {number} [config.timeout] - 自动关闭毫秒数（不传则不自动关闭）
   * @returns {Promise<boolean>} resolve(true) 表示确认，resolve(false) 表示取消/关闭
   */
  function open(config) {
    // 重载：open(title, text, icon)
    if (typeof config === 'string') {
      const titleStr = config
      const textStr = arguments[1] || ''
      const iconStr = arguments[2] || 'info'
      config = { title: titleStr, text: textStr, icon: iconStr }
    }

    // 解析图标
    let iconVal = config.icon || 'info'
    let isImage = false
    if (typeof iconVal === 'string' && (iconVal.startsWith('/') || iconVal.startsWith('http'))) {
      isImage = true
    }

    visible.value = true
    title.value = config.title || ''
    text.value = config.text || ''
    icon.value = iconVal
    isImageIcon.value = isImage
    styleName.value = config.style || 'common'
    showConfirm.value = config.confirm || false
    showCancel.value = config.cancel || false
    confirmText.value = config.confirmText || '确认'
    cancelText.value = config.cancelText || '取消'
    closeOnOverlay.value = config.closeOnOverlay !== false
    hideButtons.value = config.hideButtons || false

    // 如果是 info 类型且没显示确认/取消按钮，设置默认的关闭行为
    if (!showConfirm.value && !showCancel.value && !hideButtons.value) {
      // 默认类型：显示一个"关闭"按钮
      showConfirm.value = true
      confirmText.value = '关闭'
    }

    // 自定义回调
    _onConfirm = config.onConfirm || null
    _onCancel = config.onCancel || null

    // 自动关闭
    if (config.timeout && config.timeout > 0) {
      setTimeout(() => close(), config.timeout)
    }

    // 返回 Promise
    return new Promise((resolve) => {
      _resolve = resolve
    })
  }

  function close() {
    visible.value = false
    if (_resolve) {
      _resolve(false)
      _resolve = null
    }
    _onConfirm = null
    _onCancel = null
  }

  function confirm() {
    if (_onConfirm) _onConfirm()
    visible.value = false
    if (_resolve) {
      _resolve(true)
      _resolve = null
    }
    _onConfirm = null
    _onCancel = null
  }

  function cancel() {
    if (_onCancel) _onCancel()
    visible.value = false
    if (_resolve) {
      _resolve(false)
      _resolve = null
    }
    _onConfirm = null
    _onCancel = null
  }

  return {
    visible,
    title,
    text,
    icon,
    iconType,
    isImageIcon,
    styleName,
    showConfirm,
    showCancel,
    confirmText,
    cancelText,
    closeOnOverlay,
    hideButtons,
    iconDisplay,
    derivedType,
    open,
    close,
    confirm,
    cancel
  }
})

export default usePopupStore

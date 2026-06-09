<template>
  <Teleport to="body">
    <Transition :name="animName">
      <div v-if="store.visible" class="popup-overlay" :class="{ 'toast-mode': isToast }" @click.self="onOverlayClick">
        <div class="popup-card" :class="{ 'toast-card': isToast }" :style="cardStyle">
          <!-- 关闭按钮（右上角X，toast 不显示） -->
          <button v-if="showCloseBtn && !isToast" class="popup-close-btn" @click="store.close()" :style="closeBtnStyle">✕</button>

          <!-- 图标区域（toast 使用行内图标，不和标题分离） -->
          <div v-if="store.icon" class="popup-icon-area" :class="{ 'toast-icon': isToast }">
            <!-- 图片图标 -->
            <img v-if="store.isImageIcon" :src="store.icon" alt="icon" class="popup-image-icon" :style="{ width: styles.iconSize, height: styles.iconSize }" />
            <!-- Emoji 图标 -->
            <div v-else class="popup-emoji-icon" :style="emojiIconStyle">
              {{ store.iconDisplay }}
            </div>
          </div>

          <!-- 标题（toast 只有 text 时 title 和 text 同行显示） -->
          <div v-if="store.title" class="popup-title" :class="{ 'toast-inline': isToast }" :style="titleStyle">
            {{ store.title }}
          </div>

          <!-- 内容文本 -->
          <div v-if="store.text" class="popup-text" :class="{ 'toast-inline': isToast }" :style="textStyle">
            <span v-html="renderedText"></span>
          </div>

          <!-- 插槽：允许在弹窗内嵌入自定义内容 -->
          <div v-if="$slots.default" class="popup-slot">
            <slot />
          </div>

          <!-- 按钮区域 -->
          <div v-if="!store.hideButtons" class="popup-actions" :style="actionsStyle">
            <button
              v-if="store.showCancel"
              class="popup-btn popup-btn-cancel"
              :style="cancelBtnStyle"
              @click="store.cancel()"
            >
              {{ store.cancelText }}
            </button>
            <button
              v-if="store.showConfirm"
              class="popup-btn popup-btn-confirm"
              :style="confirmBtnStyle"
              @click="store.confirm()"
            >
              {{ store.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { usePopupStore } from '../stores/popup.js'
import popupStyles from '../constants/popupStyles.json'

const store = usePopupStore()
const slots = defineSlots()

// 根据当前风格名获取样式配置
const styles = computed(() => {
  return popupStyles[store.styleName] || popupStyles['common']
})

// 卡片内联样式
const cardStyle = computed(() => ({
  background: styles.value.cardBg,
  borderRadius: styles.value.cardBorderRadius,
  boxShadow: styles.value.cardShadow,
  width: styles.value.cardWidth,
  padding: styles.value.cardPadding
}))

// 标题样式
const titleStyle = computed(() => ({
  color: styles.value.titleColor,
  fontSize: styles.value.titleSize,
  fontWeight: styles.value.titleWeight
}))

// 文本样式
const textStyle = computed(() => ({
  color: styles.value.textColor,
  fontSize: styles.value.textSize
}))

// 图标样式（根据类型着色）
const emojiIconStyle = computed(() => {
  const type = store.derivedType
  let color = styles.value.colorInfo
  if (type === 'success') color = styles.value.colorSuccess
  else if (type === 'warning') color = styles.value.colorWarning
  else if (type === 'error') color = styles.value.colorError
  else if (type === 'confirm') color = styles.value.colorConfirm
  return {
    fontSize: styles.value.iconSize,
    color: color,
    width: styles.value.iconSize,
    height: styles.value.iconSize
  }
})

// 确认按钮
const confirmBtnStyle = computed(() => ({
  background: styles.value.btnConfirmBg,
  color: styles.value.btnConfirmText,
  fontSize: styles.value.btnFontSize,
  borderRadius: styles.value.btnBorderRadius,
  padding: styles.value.btnPadding
}))

// 取消按钮
const cancelBtnStyle = computed(() => ({
  background: styles.value.btnCancelBg,
  color: styles.value.btnCancelText,
  fontSize: styles.value.btnFontSize,
  borderRadius: styles.value.btnBorderRadius,
  padding: styles.value.btnPadding
}))

// 按钮容器样式
const actionsStyle = computed(() => ({
  gap: store.showCancel && store.showConfirm ? '12px' : '0'
}))

// 关闭按钮样式
const closeBtnStyle = computed(() => ({
  color: styles.value.textColor
}))

// 是否 toast 风格
const isToast = computed(() => {
  return styles.value.position === 'bottom'
})

// 是否显示右上角关闭按钮
const showCloseBtn = computed(() => {
  return store.closeOnOverlay && !store.hideButtons && !isToast.value
})

// 动画名称
const animName = computed(() => {
  const anim = styles.value.animation
  if (anim === 'glow') return 'popup-glow'
  if (anim === 'toast-slide' || anim === 'toast-glow') return 'popup-toast'
  return 'popup-fade'
})

// 点击遮罩层
function onOverlayClick() {
  if (store.closeOnOverlay) {
    store.close()
  }
}

// 渲染文本（支持简单HTML换行）
const renderedText = computed(() => {
  if (!store.text) return ''
  return String(store.text).replace(/\n/g, '<br>')
})
</script>

<style scoped>
/* ======== 遮罩层 ======== */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: v-bind('styles.overlayBg');
}

/* ======== 弹窗卡片 ======== */
.popup-card {
  position: relative;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Toast 定位：底部往上 100px 居中 */
.popup-overlay.toast-mode {
  align-items: center;
  padding: 0;
}

.popup-card.toast-card {
  flex-direction: row;
  gap: 8px;
  max-width: 80vw;
  width: auto;
  white-space: nowrap;
  margin-top: calc(100vh - 120px);
}

/* ======== 关闭按钮 ======== */
.popup-close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.popup-close-btn:hover {
  opacity: 1;
}

/* ======== 图标区域 ======== */
.popup-icon-area {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.popup-icon-area.toast-icon {
  margin-bottom: 0;
}

.popup-emoji-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.popup-image-icon {
  object-fit: contain;
}

/* ======== 标题 ======== */
.popup-title {
  margin-bottom: 12px;
  line-height: 1.3;
}

.popup-title.toast-inline {
  margin-bottom: 0;
}

/* ======== 文本 ======== */
.popup-text {
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-word;
}

.popup-text.toast-inline {
  margin-bottom: 0;
}

/* ======== 自定义插槽 ======== */
.popup-slot {
  width: 100%;
  margin: 8px 0;
}

/* ======== 按钮区域 ======== */
.popup-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}

.popup-btn {
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  min-width: 80px;
  white-space: nowrap;
}

.popup-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.popup-btn:active {
  filter: brightness(0.95);
  transform: translateY(0);
}

/* ======== Fade-Scale 动画 ======== */
.popup-fade-enter-active {
  transition: all 0.25s ease-out;
}
.popup-fade-leave-active {
  transition: all 0.2s ease-in;
}
.popup-fade-enter-from {
  opacity: 0;
}
.popup-fade-enter-from .popup-card {
  opacity: 0;
  transform: scale(0.9);
}
.popup-fade-leave-to {
  opacity: 0;
}
.popup-fade-leave-to .popup-card {
  opacity: 0;
  transform: scale(0.9);
}

/* ======== Toast Slide 动画（底部弹出 + 渐变消失） ======== */
.popup-toast-enter-active {
  transition: all 0.3s ease-out;
}
.popup-toast-leave-active {
  transition: all 0.6s ease-in;
}
.popup-toast-enter-from {
  opacity: 0;
}
.popup-toast-enter-from .popup-card {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.popup-toast-leave-to {
  opacity: 0;
}
.popup-toast-leave-to .popup-card {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}

/* ======== Glow 动画（守望先锋风格） ======== */
.popup-glow-enter-active {
  transition: all 0.3s ease-out;
}
.popup-glow-leave-active {
  transition: all 0.25s ease-in;
}
.popup-glow-enter-from {
  opacity: 0;
}
.popup-glow-enter-from .popup-card {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
  filter: brightness(1.5);
}
.popup-glow-leave-to {
  opacity: 0;
}
.popup-glow-leave-to .popup-card {
  opacity: 0;
  transform: scale(0.85) translateY(-20px);
  filter: brightness(0.5);
}
</style>
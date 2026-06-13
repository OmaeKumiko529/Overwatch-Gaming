<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>选择担任职责</h3>
      <p class="hint">请选择您在战队中的主要职责（可多选，最多2个，或选择灵活）</p>
      <div class="role-options">
        <div v-for="opt in roleOptions" :key="opt.key"
          class="role-option"
          :class="{
            selected: selected.includes(opt.key),
            disabled: isFlexibleSelected && opt.key !== 'flexible'
          }"
          @click="toggle(opt.key)"
        >
          <div v-if="opt.key === 'flexible'" class="flexible-icons-row">
            <img src="/role-icon-tank.webp" alt="重装" class="role-img small" />
            <img src="/role-icon-damage.webp" alt="输出" class="role-img small" />
            <img src="/role-icon-support.webp" alt="支援" class="role-img small" />
          </div>
          <img v-else :src="opt.icon" :alt="opt.label" class="role-img" />
          <span class="role-label">{{ opt.label }}</span>
          <p class="role-desc">{{ opt.desc }}</p>
          <div class="checkbox" :class="{ checked: selected.includes(opt.key) }">
            <span v-if="selected.includes(opt.key)">✓</span>
          </div>
        </div>
      </div>
      <div class="selection-info">
        <p v-if="selected.length > 0">
          已选择 {{ selected.length }} 个职责：
          <strong>{{ selected.map(k => labelMap[k]).join('、') }}</strong>
        </p>
        <p v-else>请至少选择一个职责</p>
      </div>
      <div v-if="message" class="msg" :class="{ error: isError }">{{ message }}</div>
      <div class="modal-actions">
        <button class="btn cancel" @click="$emit('close')">取消</button>
        <button class="btn confirm" @click="handleConfirm">确认更改</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['close', 'submit'])
const selected = ref([])
const message = ref('')
const isError = ref(false)
const labelMap = { 'heavy': '重装', 'damage': '输出', 'support': '支援', 'flexible': '灵活' }

const roleOptions = [
  { key: 'heavy', label: '重装', desc: '承受伤害，保护队友', icon: '/role-icon-tank.webp' },
  { key: 'damage', label: '输出', desc: '造成伤害，击败敌人', icon: '/role-icon-damage.webp' },
  { key: 'support', label: '支援', desc: '治疗辅助，提供支援', icon: '/role-icon-support.webp' },
  { key: 'flexible', label: '灵活', desc: '根据情况切换职责', icon: '' }
]

const isFlexibleSelected = computed(() => selected.value.includes('flexible'))

function toggle(key) {
  if (key === 'flexible') {
    selected.value = ['flexible']
  } else {
    const idx = selected.value.indexOf('flexible')
    if (idx !== -1) selected.value.splice(idx, 1)
    const i = selected.value.indexOf(key)
    if (i === -1) {
      if (selected.value.length < 2) selected.value.push(key)
    } else {
      selected.value.splice(i, 1)
    }
  }
}

function handleConfirm() {
  if (selected.value.length === 0) {
    message.value = '请至少选择一个职责'
    isError.value = true
    return
  }
  if (isFlexibleSelected.value && selected.value.length > 1) {
    message.value = '灵活选项不能与其他职责同时选择'
    isError.value = true
    return
  }
  emit('submit', [...selected.value])
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.5);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:1000;
}
.modal-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 540px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
h3 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 12px;
  text-align: center;
}
.hint { font-size: 0.9rem; color: #6c757d; text-align: center; margin-bottom: 16px; }
.role-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 16px 0;
}
.role-option {
  padding: 16px 12px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}
.role-option:hover { border-color: #4facfe; background: rgba(79,172,254,0.05); }
.role-option.selected { border-color: #28a745; background: rgba(40,167,69,0.08); }
.role-option.disabled { opacity: 0.5; pointer-events: none; }
.role-img { width: 48px; height: 48px; object-fit: contain; margin-bottom: 8px; background: #35373998; border-radius: 8px; padding: 4px; }
.role-img.small { width: 32px; height: 32px; }
.flexible-icons-row { display: flex; justify-content: center; gap: 4px; margin-bottom: 8px; }
.role-label { display: block; font-weight: 600; font-size: 1rem; color: #333; margin-bottom: 4px; }
.role-desc { font-size: 0.82rem; color: #6c757d; margin: 0; }
.checkbox {
  width: 22px; height: 22px;
  border: 2px solid #ced4da;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px auto 0;
  transition: all 0.3s;
}
.checkbox.checked { background: #28a745; border-color: #28a745; color: white; }
.selection-info { text-align: center; font-size: 0.9rem; color: #555; margin: 8px 0; }
.msg { padding: 10px; border-radius: 8px; text-align: center; font-weight: 500; }
.msg:not(.error) { background: #d4edda; color: #155724; }
.msg.error { background: #f8d7da; color: #721c24; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}
.cancel { background: #6c757d; color: white; }
.cancel:hover { background: #5a6268; }
.confirm { background: #28a745; color: white; }
.confirm:hover { background: #218838; }
</style>
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>确认退出战队</h3>
      <p class="warning">⚠️ 警告：退出后将无法访问战队内容！</p>
      <p>如果您是战队创建者，退出后战队将被解散。</p>
      <div v-if="message" class="msg error">{{ message }}</div>
      <div class="modal-actions">
        <button class="btn cancel" @click="$emit('close')">取消</button>
        <button class="btn danger" @click="$emit('confirm')">确认退出</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: { type: String, default: '' } })
defineEmits(['close', 'confirm'])
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
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
h3 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}
.warning { color: #dc3545; font-weight: 600; text-align: center; margin: 12px 0; }
.msg { padding: 10px; border-radius: 8px; text-align: center; font-weight: 500; }
.msg.error { background: #f8d7da; color: #721c24; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
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
.danger { background: #dc3545; color: white; }
.danger:hover { background: #c82333; }
</style>
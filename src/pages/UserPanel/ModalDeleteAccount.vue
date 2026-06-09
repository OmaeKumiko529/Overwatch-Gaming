<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>确认注销账户</h3>
      <p class="warning">⚠️ 警告：此操作不可撤销！您的所有数据将被永久删除。</p>
      <p>请输入您的密码以确认注销：</p>
      <div class="form-group">
        <input type="password" v-model="password" placeholder="请输入密码" class="form-input" />
      </div>
      <div class="modal-actions">
        <button class="btn cancel" @click="$emit('close')">取消</button>
        <button class="btn danger" @click="$emit('confirm', password)">确认注销</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineEmits(['close', 'confirm'])
const password = ref('')
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
.form-group { margin: 12px 0; }
.form-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'SmileySans Oblique', sans-serif;
}
.form-input:focus { outline: none; border-color: #4facfe; }
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
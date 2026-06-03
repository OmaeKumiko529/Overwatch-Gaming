<template>
  <span v-if="rankInfo" class="userrank-badge" :style="{ color: rankInfo.color }">
    <span class="userrank-badge__icon">{{ rankInfo.icon }}</span>
    <span class="userrank-badge__label">{{ rankInfo.cn }}</span>
  </span>
  <span v-else class="userrank-badge userrank-badge--loading">
    加载中...
  </span>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getUserRankInfo } from '../constants/rankMap.js'

const props = defineProps({
  userId: {
    type: [String, Number],
    default: null
  }
})

const authStore = useAuthStore()
const targetUserrank = ref(null)

const rankInfo = computed(() => {
  const rank = targetUserrank.value !== null ? targetUserrank.value : authStore.userrank
  return getUserRankInfo(rank)
})

// 当传入 userId 时，异步获取目标用户的等级
watchEffect(async () => {
  if (props.userId !== null) {
    try {
      const user = await authStore.getUserById(props.userId)
      targetUserrank.value = Number(user?.userrank ?? 0)
    } catch {
      targetUserrank.value = 0
    }
  } else {
    targetUserrank.value = null
  }
})
</script>

<style scoped>
.userrank-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 1;
  padding: 3px 8px;
  border: 1.5px solid currentColor;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.85);
}

.userrank-badge__icon {
  font-size: 16px;
}

.userrank-badge__label {
  font-weight: 500;
}

.userrank-badge--loading {
  color: #999;
  font-size: 12px;
}
</style>
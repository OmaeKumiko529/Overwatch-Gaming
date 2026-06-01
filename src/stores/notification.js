import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationsApi } from '../services/api.js'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const currentUid = ref('')

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.IsRead).length
  })

  async function load(uid) {
    currentUid.value = uid
    if (uid) {
      const res = await notificationsApi.getNotifications()
      if (res.success) {
        notifications.value = res.notifications
      } else {
        notifications.value = []
      }
    } else {
      notifications.value = []
    }
  }

  async function push(data) {
    const res = await notificationsApi.create(data)
    if (res.success) {
      const notif = res.notification
      if (data.To === currentUid.value) {
        notifications.value.unshift(notif)
      }
      return notif
    }
    return null
  }

  async function markRead(id) {
    await notificationsApi.markRead(id)
    const n = notifications.value.find(n => n.id === id)
    if (n) n.IsRead = true
  }

  async function markAllRead() {
    if (!currentUid.value) return
    await notificationsApi.markAllRead()
    notifications.value.forEach(n => { n.IsRead = true })
  }

  return {
    notifications,
    unreadCount,
    currentUid,
    load,
    push,
    markRead,
    markAllRead
  }
})

export default useNotificationStore
// ç¨ćˇçŽĄçćĺĄ - éčżĺçŤŻ API çŽĄçç¨ćˇć°ćŽ
import { authApi } from './api.js'

// çźĺ­ç¨ćˇĺčĄ¨ďźéżĺé˘çš?API čŻˇćąďź?
let cachedUsers = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000 // 5ĺéçźĺ­

// ç¨ćˇçŽĄçćĺĄďźĺŻšćĽĺçŤ?APIďź?
export const userService = {
  // äťĺçŤŻčˇĺććç¨ć?
  async getAllUsers() {
    try {
      // ĺŚćçźĺ­ććďźç´ćĽčżĺ?
      if (cachedUsers && Date.now() < cacheExpiry) {
        return cachedUsers
      }
      const res = await authApi.getAllUsers()
      if (res.success && Array.isArray(res.users)) {
        cachedUsers = res.users
        cacheExpiry = Date.now() + CACHE_TTL
        return res.users
      }
      return []
    } catch (error) {
      console.error('čˇĺç¨ćˇĺčĄ¨ĺ¤ąč´Ľ:', error)
      return []
    }
  },

  // ć šćŽç¨ćˇIDčˇĺç¨ćˇäżĄćŻďźID ć?UIDďź?
  async getUserById(userIdOrUid) {
    try {
      const res = await authApi.getUserById(userIdOrUid)
      if (res.success && res.user) {
        return res.user
      }
      // çźĺ­ä¸­ćĽć?
      const users = await this.getAllUsers()
      return users.find(u => String(u.id) === String(userIdOrUid) || u.uid === userIdOrUid) || null
    } catch {
      return null
    }
  },

  // ćç´˘ç¨ćˇďźćç¨ćˇĺďźĺçŤŻčżćť¤ďź?
  searchUsers(query) {
    if (!cachedUsers) {
      // ĺŚćçźĺ­ćŞĺ č˝˝ďźč§Śĺĺźć­Ľĺ č˝˝ä˝čżĺçŠşďźč°ç¨ćšäźéčŻďź
      this.getAllUsers()
      return []
    }
    const lowerQuery = query.toLowerCase()
    return cachedUsers.filter(user =>
      user.username.toLowerCase().includes(lowerQuery)
    ).map(user => ({
      id: user.id,
      uid: user.uid,
      username: user.username,
      avatar: user.avatar || '/default-avatar.webp'
    })).slice(0, 10) // ćĺ¤?0ä¸ŞĺťşčŽ?
  },

  // ĺźşĺśĺˇć°ç¨ćˇçźĺ­
  refreshUsers() {
    cachedUsers = null
    cacheExpiry = 0
    return this.getAllUsers()
  }
}

// ĺŻźĺşéťčŽ¤ĺŽäž
export default userService
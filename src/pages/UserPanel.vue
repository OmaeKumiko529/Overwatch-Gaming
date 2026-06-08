<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { authApi } from '../services/api.js';
import pop from '../utils/pop.js';
import postService from '../services/post.js';
import { useTeamStore } from '../stores/team.js';
import ProfileHeader from './UserPanel/ProfileHeader.vue';
import OverviewTab from './UserPanel/OverviewTab.vue';
import TeamTab from './UserPanel/TeamTab.vue';
import PostsTab from './UserPanel/PostsTab.vue';
import SettingsTab from './UserPanel/SettingsTab.vue';

import ModalChangePassword from './UserPanel/ModalChangePassword.vue';
import ModalDeleteAccount from './UserPanel/ModalDeleteAccount.vue';
import ModalTeamCreate from './UserPanel/ModalTeamCreate.vue';
import ModalTeamJoin from './UserPanel/ModalTeamJoin.vue';
import ModalTeamLeave from './UserPanel/ModalTeamLeave.vue';
import ModalChangeRole from './UserPanel/ModalChangeRole.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const teamStore = useTeamStore();
const uid = computed(() => route.params.uid);

const activeTab = ref('overview');
const userInfo = ref({});
const userTeam = ref(null);
const teamMembers = ref([]);
const userPosts = ref([]);
const loadingPosts = ref(false);
const message = ref('');
const isError = ref(false);

// Modal visibility
const showChangePassword = ref(false);
const showDeleteConfirm = ref(false);
const showCreateTeam = ref(false);
const showJoinTeam = ref(false);
const showLeaveConfirm = ref(false);
const showChangeRole = ref(false);
const showEditNickname = ref(false);

// Modal state
const passwordData = reactive({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
const teamData = reactive({ teamName: '' })
const joinTeamName = ref('')
const leaveTeamMessage = ref('')
const deletePassword = ref('')
const nicknameInput = ref('')

const tabs = computed(() => {
  const items = [
    { key: 'overview', label: '概览', icon: '📊' },
    { key: 'team', label: '战队', icon: '🏆' },
    { key: 'posts', label: '帖子', icon: '📝' },
  ]
  if (isViewingOwnProfile.value) {
    items.push({ key: 'settings', label: '设置', icon: '⚙️' })
  }
  return items
})

const isViewingOwnProfile = computed(() => {
  return auth.currentUser && userInfo.value.id && Number(auth.currentUser.id) === Number(userInfo.value.id)
})

const totalLikes = computed(() => {
  return userPosts.value.reduce((sum, post) => sum + (post.likes || 0), 0)
})

// Load data
async function loadUserInfo() {
  const targetUid = uid.value
  if (targetUid) {
    try {
      const res = await authApi.getUserById(targetUid)
      if (res.success && res.user) {
        userInfo.value = res.user
      } else {
        pop.toast('用户不存在', 'error')
      }
    } catch {
      pop.toast('加载用户信息失败', 'error')
    }
  } else {
    if (auth.currentUser) {
      userInfo.value = auth.currentUser
    } else {
      router.push({ name: 'Login' })
    }
  }
}

async function loadTeamInfo() {
  const targetUserId = userInfo.value?.id
  if (!targetUserId) return
  try {
    const team = await teamStore.getUserTeam(targetUserId)
    userTeam.value = team
    if (team) {
      const members = await teamStore.getTeamMembers(team.id)
      teamMembers.value = members || []
    } else {
      teamMembers.value = []
    }
  } catch {
    userTeam.value = null
    teamMembers.value = []
  }
}

async function loadUserPosts() {
  const targetUserId = userInfo.value?.id
  if (!targetUserId) return
  loadingPosts.value = true
  try {
    userPosts.value = await postService.getUserMainPosts(targetUserId)
  } catch (e) {
    console.error('加载帖子失败:', e)
  } finally {
    loadingPosts.value = false
  }
}

// Actions
function handleLogout() {
  auth.logout()
  router.push({ name: 'Home' })
}

async function handleChangePassword(data) {
  if (!auth.currentUser) return
  try {
    const res = await authApi.changePassword(data.currentPassword, data.newPassword)
    if (res.success) {
      pop.toast('密码修改成功', 'success')
      showChangePassword.value = false
    } else {
      pop.toast(res.message || '修改失败', 'error')
    }
  } catch {
    pop.toast('修改失败，请检查网络', 'error')
  }
}

async function handleDeleteAccount(password) {
  if (!auth.currentUser) return
  try {
    // 先验证密码（不修改密码）
    const verifyRes = await authApi.verifyPassword(password)
    if (!verifyRes.success) {
      pop.toast(verifyRes.message || '密码错误', 'error')
      return
    }
    // 验证通过后删除账户
    const delRes = await authApi.deleteUser()
    if (delRes.success) {
      auth.logout()
      pop.toast('账户已注销', 'success')
      router.push({ name: 'Home' })
    } else {
      pop.toast(delRes.message || '删除失败', 'error')
    }
  } catch {
    pop.toast('网络错误，请检查服务器是否正在运行', 'error')
  }
}

async function handleCreateTeam(name) {
  if (!auth.currentUser) return
  try {
    const result = await teamStore.createTeam(name, auth.currentUser.id)
    if (result.success) {
      await loadTeamInfo()
      pop.toast('战队创建成功', 'success')
      showCreateTeam.value = false
    } else {
      pop.toast(result.message || '创建失败', 'error')
    }
  } catch {
    pop.toast('创建失败，请检查网络', 'error')
  }
}

async function handleJoinTeam(name) {
  if (!auth.currentUser) return
  try {
    const result = await teamStore.joinTeam(name, auth.currentUser.id)
    if (result.success) {
      await loadTeamInfo()
      pop.toast('成功加入战队', 'success')
      showJoinTeam.value = false
    } else {
      pop.toast(result.message || '加入失败', 'error')
    }
  } catch {
    pop.toast('加入失败，请检查网络', 'error')
  }
}

async function handleLeaveTeam() {
  if (!auth.currentUser) return
  try {
    const result = await teamStore.leaveTeam(auth.currentUser.id)
    if (result.success) {
      await loadTeamInfo()
      pop.toast(result.teamDeleted ? '已退出战队，战队已解散' : '已成功退出战队', 'success')
      showLeaveConfirm.value = false
    } else {
      pop.toast(result.message || '退出失败', 'error')
    }
  } catch {
    pop.toast('退出失败，请检查网络', 'error')
  }
}

async function handleChangeRole(roles) {
  if (!auth.currentUser) return
  try {
    const result = await auth.updateUserRole(auth.currentUser.id, roles)
    if (result.success) {
      loadUserInfo()
      loadTeamInfo()
      pop.toast('职责更新成功', 'success')
      showChangeRole.value = false
    } else {
      pop.toast(result.message || '更新失败', 'error')
    }
  } catch {
    pop.toast('更新失败', 'error')
  }
}

function viewPost(pid) {
  router.push({ name: 'PostDetail', params: { pid } })
}

async function deletePost(pid) {
  const ok = await pop.confirm('确定删除这篇帖子吗？', '', { icon: 'warning' })
  if (!ok) return
  const result = await postService.deletePost(pid, auth.currentUser?.id)
  if (result.success) {
    userPosts.value = userPosts.value.filter(p => p.pid !== pid)
    pop.toast('帖子删除成功', 'success')
  } else {
    pop.toast(result.message || '删除失败', 'error')
  }
}

async function handleEditNickname() {
  if (!auth.currentUser) return
  nicknameInput.value = userInfo.value.nickname || ''
  showEditNickname.value = true
}

async function saveNickname() {
  if (!auth.currentUser) return
  const newNickname = nicknameInput.value.trim()
  const result = await auth.updateUser(auth.currentUser.id, { nickname: newNickname || null })
  if (result.success) {
    userInfo.value = { ...userInfo.value, ...result.user }
    if (auth.currentUser && Number(auth.currentUser.id) === Number(userInfo.value.id)) {
      auth.currentUser.nickname = result.user.nickname
      auth.currentUser.displayName = result.user.displayName
    }
    pop.toast(newNickname ? '昵称修改成功' : '昵称已清除', 'success')
    showEditNickname.value = false
  } else {
    pop.toast(result.message || '修改失败', 'error')
  }
}

function handleMemberClick(id) {
  router.push({ name: 'UserProfile', params: { uid: id } })
}

// Lifecycle
onMounted(() => {
  loadUserInfo()
})

watch(uid, () => loadUserInfo())

watch(userInfo, (newVal) => {
  if (newVal && newVal.id) {
    loadTeamInfo()
    loadUserPosts()
  }
}, { immediate: true })
</script>

<template>
  <div class="user-profile">
    <ProfileHeader
      :user="userInfo"
      :post-count="userPosts.length"
      :total-likes="totalLikes"
      :team-name="userTeam?.name || ''"
      :member-count="teamMembers.length"
    />

    <!-- Tab Navigation -->
    <div class="tab-bar">
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <OverviewTab
        v-if="activeTab === 'overview'"
        :user="userInfo"
        :post-count="userPosts.length"
        :total-likes="totalLikes"
        :team-name="userTeam?.name || ''"
        :member-count="teamMembers.length"
      />
      <TeamTab
        v-if="activeTab === 'team'"
        :team="userTeam"
        :members="teamMembers"
        :current-user-id="auth.currentUser?.id || ''"
        :is-owner="isViewingOwnProfile"
        @leave-team="showLeaveConfirm = true"
        @create-team="showCreateTeam = true"
        @join-team="showJoinTeam = true"
        @member-click="handleMemberClick"
      />
      <PostsTab
        v-if="activeTab === 'posts'"
        :posts="userPosts"
        :loading="loadingPosts"
        :is-owner="isViewingOwnProfile"
        :username="userInfo.username || ''"
        :display-name="userInfo.displayName || userInfo.username || ''"
        :total-likes="totalLikes"
        @create-post="router.push({ name: 'CreatePost' })"
        @view-post="viewPost"
        @delete-post="(id) => deletePost(id)"
      />
      <SettingsTab
        v-if="activeTab === 'settings' && isViewingOwnProfile"
        @logout="handleLogout"
        @change-password="showChangePassword = true"
        @delete-account="showDeleteConfirm = true"
        @edit-nickname="handleEditNickname"
      />
    </div>

    <!-- Modals -->
    <ModalChangePassword v-if="showChangePassword" @close="showChangePassword = false" @submit="handleChangePassword" />
    <ModalDeleteAccount v-if="showDeleteConfirm" @close="showDeleteConfirm = false" @confirm="handleDeleteAccount" />
    <ModalTeamCreate v-if="showCreateTeam" @close="showCreateTeam = false" @submit="handleCreateTeam" />
    <ModalTeamJoin v-if="showJoinTeam" @close="showJoinTeam = false" @submit="handleJoinTeam" />
    <ModalTeamLeave v-if="showLeaveConfirm" :message="leaveTeamMessage" @close="showLeaveConfirm = false" @confirm="handleLeaveTeam" />
    <ModalChangeRole v-if="showChangeRole" @close="showChangeRole = false" @submit="handleChangeRole" />

    <!-- Nickname Edit Modal -->
    <div v-if="showEditNickname" class="modal-overlay" @click.self="showEditNickname = false">
      <div class="modal-content">
        <h3 class="modal-title">修改昵称</h3>
        <p class="modal-hint">昵称显示在用户名位置，留空则显示用户名。</p>
        <div class="modal-body">
          <input
            v-model="nicknameInput"
            type="text"
            class="nickname-input"
            placeholder="输入新的昵称（可选）"
            maxlength="50"
            @keydown.enter="saveNickname"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel-btn" @click="showEditNickname = false">取消</button>
          <button class="modal-btn confirm-btn" @click="saveNickname">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  min-height: 100vh;
  padding-top: 60px;
  background: #0f0f1a;
  font-family: 'MapleMono CN Regular', monospace;
}

.tab-bar {
  background: #1a1a2e;
  border-bottom: 1px solid #2a2a4a;
  position: sticky;
  top: 60px;
  z-index: 100;
}

.tab-nav {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  gap: 4px;
  padding: 0 20px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  background: transparent;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: #4facfe;
  background: #252545;
}

.tab-btn.active {
  color: #4facfe;
  border-bottom-color: #4facfe;
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

@media (max-width: 640px) {
  .tab-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 0;
  }
  .tab-btn {
    padding: 12px 16px;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  .tab-label {
    display: none;
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #e0e0e0;
  margin: 0 0 8px;
}

.modal-hint {
  font-size: 0.9rem;
  color: #a0aec0;
  margin: 0 0 20px;
}

.modal-body {
  margin-bottom: 24px;
}

.nickname-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #2a2a4a;
  border-radius: 10px;
  background: #0a0a18;
  color: #e0e0e0;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.nickname-input:focus {
  outline: none;
  border-color: #4facfe;
}

.nickname-input::placeholder {
  color: #6c757d;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #252545;
  color: #a0aec0;
  border: 1px solid #2a2a4a;
}

.cancel-btn:hover {
  background: #2a2a4a;
  color: #e0e0e0;
}

.confirm-btn {
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79,172,254,0.3);
}
</style>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { authApi } from '../services/api.js';
import postService from '../services/post.js';
import { useTeamStore } from '../stores/team.js';

import pop from '../utils/pop.js';
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

// Modal state
const passwordData = reactive({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
const teamData = reactive({ teamName: '' })
const joinTeamName = ref('')
const leaveTeamMessage = ref('')
const deletePassword = ref('')

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
    const res = await authApi.changePassword(password, '__verify__')
    if (!res.success) {
      pop.toast('密码错误', 'error')
      return
    }
    const delRes = await authApi.deleteUser()
    if (delRes.success) {
      auth.logout()
      router.push({ name: 'Home' })
    }
  } catch {
    pop.toast('删除失败', 'error')
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

function viewPost(id) {
  router.push({ name: 'PostDetail', params: { id } })
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
      />
    </div>

    <!-- Modals -->
    <ModalChangePassword v-if="showChangePassword" @close="showChangePassword = false" @submit="handleChangePassword" />
    <ModalDeleteAccount v-if="showDeleteConfirm" @close="showDeleteConfirm = false" @confirm="handleDeleteAccount" />
    <ModalTeamCreate v-if="showCreateTeam" @close="showCreateTeam = false" @submit="handleCreateTeam" />
    <ModalTeamJoin v-if="showJoinTeam" @close="showJoinTeam = false" @submit="handleJoinTeam" />
    <ModalTeamLeave v-if="showLeaveConfirm" :message="leaveTeamMessage" @close="showLeaveConfirm = false" @confirm="handleLeaveTeam" />
    <ModalChangeRole v-if="showChangeRole" @close="showChangeRole = false" @submit="handleChangeRole" />
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
</style>
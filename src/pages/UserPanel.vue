<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import auth from '../services/auth.js';
import userService from '../services/user.js';
import postService from '../services/post.js';
import teamService from '../services/team.js';

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
const uid = computed(() => route.params.uid);

const activeTab = ref('overview');
const userInfo = ref({});
const userTeam = ref(null);
const teamMembers = ref([]);
const userPosts = ref([]);
const loadingPosts = ref(false);
const currentUser = ref(null);

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
  return currentUser.value && currentUser.value.id === userInfo.value.id
})

const totalLikes = computed(() => {
  return userPosts.value.reduce((sum, post) => sum + (post.likes || 0), 0)
})

// Load data
function loadUserInfo() {
  const targetUid = uid.value
  if (targetUid) {
    const user = userService.getUserById(targetUid)
    if (user) {
      userInfo.value = user
    } else {
      message.value = '用户不存在'
      isError.value = true
    }
  } else {
    const cu = auth.getCurrentUser()
    if (cu) {
      userInfo.value = cu
    } else {
      router.push({ name: 'Login' })
    }
  }
}

function loadTeamInfo() {
  const targetUserId = userInfo.value?.id || auth.getCurrentUser()?.id
  if (!targetUserId) return
  const team = teamService.getUserTeam(targetUserId)
  userTeam.value = team
  if (team) {
    const members = teamService.getTeamMembers(team.id)
    const allUsers = userService.getAllUsers()
    teamMembers.value = allUsers.filter(user => members.includes(user.id))
  } else {
    teamMembers.value = []
  }
}

function loadUserPosts() {
  const targetUserId = userInfo.value?.id
  if (!targetUserId) return
  loadingPosts.value = true
  try {
    userPosts.value = postService.getUserMainPosts(targetUserId)
  } catch (e) {
    console.error('加载帖子失败:', e)
  } finally {
    loadingPosts.value = false
  }
}

// Actions
function handleLogout() {
  if (auth.logout()) {
    router.push({ name: 'Home' })
  }
}

function handleChangePassword(data) {
  const cu = auth.getCurrentUser()
  if (!cu) return
  const users = userService.getAllUsers()
  const idx = users.findIndex(u => u.id === cu.id)
  if (idx === -1) return
  if (users[idx].password !== data.currentPassword) {
    message.value = '当前密码错误'
    isError.value = true
    return
  }
  users[idx].password = data.newPassword
  users[idx].updatedAt = new Date().toISOString()
  if (userService.saveAllUsers(users)) {
    message.value = '密码修改成功'
    isError.value = false
  }
}

function handleDeleteAccount(password) {
  const cu = auth.getCurrentUser()
  if (!cu) return
  const users = userService.getAllUsers()
  const user = users.find(u => u.id === cu.id)
  if (!user || user.password !== password) {
    message.value = '密码错误'
    isError.value = true
    return
  }
  const result = userService.deleteUser(cu.id)
  if (result.success) {
    router.push({ name: 'Home' })
  }
}

function handleCreateTeam(name) {
  const cu = auth.getCurrentUser()
  if (!cu) return
  const result = teamService.createTeam(name, cu.id)
  if (result.success) {
    loadTeamInfo()
    message.value = '战队创建成功'
    isError.value = false
  } else {
    message.value = result.message || '创建失败'
    isError.value = true
  }
}

function handleJoinTeam(name) {
  const cu = auth.getCurrentUser()
  if (!cu) return
  const result = teamService.joinTeam(name, cu.id)
  if (result.success) {
    loadTeamInfo()
    message.value = '成功加入战队'
    isError.value = false
  } else {
    message.value = result.message || '加入失败'
    isError.value = true
  }
}

function handleLeaveTeam() {
  const cu = auth.getCurrentUser()
  if (!cu) return
  const result = teamService.leaveTeam(cu.id)
  if (result.success) {
    loadTeamInfo()
    message.value = result.teamDeleted ? '已退出战队，战队已解散' : '已成功退出战队'
    isError.value = false
  } else {
    message.value = result.message || '退出失败'
    isError.value = true
  }
}

function handleChangeRole(roles) {
  const cu = auth.getCurrentUser()
  if (!cu) return
  const result = userService.updateUserRoles(cu.id, roles)
  if (result.success) {
    loadUserInfo()
    loadTeamInfo()
    message.value = '职责更新成功'
    isError.value = false
  } else {
    message.value = result.message || '更新失败'
    isError.value = true
  }
}

function viewPost(id) {
  router.push({ name: 'PostDetail', params: { id } })
}

function deletePost(id) {
  if (!confirm('确定删除这篇帖子吗？')) return
  const cu = auth.getCurrentUser()
  const result = postService.deletePost(id, cu?.id)
  if (result.success) {
    userPosts.value = userPosts.value.filter(p => p.id !== id)
    message.value = '帖子删除成功'
    isError.value = false
  } else {
    message.value = result.message || '删除失败'
    isError.value = true
  }
}

function handleMemberClick(id) {
  router.push({ name: 'UserProfile', params: { uid: id } })
}

// Lifecycle
onMounted(() => {
  currentUser.value = auth.getCurrentUser()
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
        :current-user-id="currentUser?.id || ''"
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
        @delete-post="deletePost"
      />
      <SettingsTab
        v-if="activeTab === 'settings' && isViewingOwnProfile"
        @logout="handleLogout"
        @change-password="showChangePassword = true"
        @delete-account="showDeleteConfirm = true"
      />
    </div>

    <!-- Global Message -->
    <div v-if="message" class="global-msg" :class="{ error: isError }">
      {{ message }}
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
  background: #f0f2f5;
  font-family: 'SmileySans Oblique', sans-serif;
}

/* Tab Bar */
.tab-bar {
  background: white;
  border-bottom: 1px solid #e9ecef;
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
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: #333;
  background: #f8f9fa;
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

/* Global Message */
.global-msg {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}

.global-msg:not(.error) {
  background: #d4edda;
  color: #155724;
}

.global-msg.error {
  background: #f8d7da;
  color: #721c24;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
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
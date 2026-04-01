<template>
  <div class="user-profile page-enter-active">
    <!-- 用户封面图区域 -->
    <div class="profile-cover">
      <div class="cover-image"></div>
      <div class="cover-overlay">

        <div class="profile-header-content">
          <div class="profile-avatar">
            <img
              :src="userInfo.avatar || '/Head.png'"
              :alt="userInfo.username"
              class="avatar-image"
              @error="handleAvatarError"
            />
          </div>
          <div class="profile-header-info">
            <h1 class="profile-name">{{ userInfo.username }}</h1>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ userPosts.length }}</span>
                <span class="stat-label">帖子</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ totalLikes }}</span>
                <span class="stat-label">获赞</span>
              </div>
              <div class="stat-item" v-if="userTeam">
                <span class="stat-value">{{ teamMembers.length }}</span>
                <span class="stat-label">战队成员</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="profile-container">
      <!-- 左侧栏：用户信息和战队信息 -->
      <div class="profile-sidebar">
        <!-- 用户信息卡片 -->
        <div class="profile-card">
          <h3 class="card-title">基本信息</h3>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userInfo.username }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userInfo.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ formatDate(userInfo.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">最后登录</span>
              <span class="info-value">{{ formatDate(userInfo.loginTime) }}</span>
            </div>
          </div>
        </div>
      
        <!-- 战队信息卡片 -->
        <div class="profile-card team-card">
          <h3 class="card-title">战队信息</h3>
          <div v-if="userTeam" class="team-info">
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">战队名称</span>
                <span class="info-value">{{ userTeam.name }}</span>
              </div>
              <div class="info-row" v-if="isViewingOwnProfile">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(userTeam.createdAt) }}</span>
              </div>
              <div class="info-row" v-if="isViewingOwnProfile">
                <span class="info-label">成员数量</span>
                <span class="info-value">{{ teamMembers.length }} 人</span>
              </div>
              <div class="info-row" v-if="isViewingOwnProfile">
                <span class="info-label">您的身份</span>
                <span class="info-value">{{ userTeam.creatorId === userInfo.id ? '创建者' : '成员' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">担任职责</span>
                <span class="info-value role-display">
                  <div class="role-icons">
                    <template v-if="roleIcons.length > 1">
                      <img v-for="(icon, index) in roleIcons" :key="index" :src="icon" :alt="roleDisplayName" class="role-icon flexible-icon" />
                    </template>
                    <img v-else-if="roleIcons.length === 1" :src="roleIcons[0]" :alt="roleDisplayName" class="role-icon" />
                    <div v-else class="no-role">未设置</div>
                  </div>
                  {{ roleDisplayName }}
                  <button class="change-role-button" @click="showChangeRole = true" v-if="isViewingOwnProfile" >更改</button>
                </span>
              </div>
            </div>
            
            <!-- 战队成员列表 - 仅自己可见 -->
            <div class="team-members-section" v-if="teamMembers.length > 0 && isViewingOwnProfile">
              <h4 class="members-title">战队成员 ({{ teamMembers.length }}/6)</h4>
              <div class="members-list">
                <div v-for="member in teamMembers" :key="member.id" class="member-item" @click="handleMemberClick(member.id)">
                  <div class="member-info">
                    <span class="member-name">{{ member.username }}</span>
                    <div class="member-roles-container">
                      <template v-if="Array.isArray(member.role) && member.role.length > 1">
                        <span
                          v-for="(role, index) in member.role"
                          :key="index"
                          class="member-role"
                          :class="getRoleClass(role)"
                        >
                          {{ getRoleDisplayName(role) }}
                        </span>
                      </template>
                      <template v-else>
                        <span class="member-role" :class="getRoleClass(member.role)">
                          {{ getRoleDisplayName(member.role) }}
                        </span>
                      </template>
                    </div>
                  </div>
                  <div class="member-icons">
                    <img
                      v-if="member.role !== 'flexible'"
                      :src="getRoleIcon(member.role)"
                      :alt="getRoleDisplayName(member.role)"
                      class="member-role-icon"
                    />
                    <div v-else class="flexible-icons-small">
                      <img src="/96px-职责：重装_图标.webp" alt="重装" class="flexible-icon-small" />
                      <img src="/96px-职责：输出_图标.webp" alt="输出" class="flexible-icon-small" />
                      <img src="/96px-职责：支援_图标.webp" alt="支援" class="flexible-icon-small" />
                    </div>
                    <span v-if="member.id === userTeam.creatorId" class="creator-badge">创建者</span>
                    <span v-else-if="member.id === userInfo.id" class="you-badge">您</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 退出战队按钮 - 仅自己可见 -->
            <div class="team-actions" v-if="isViewingOwnProfile">
              <button class="action-button leave-team-button" @click="showLeaveConfirm = true">
                <span class="button-icon">🚪</span>
                <span class="button-text">退出战队</span>
              </button>
            </div>
          </div>
          
          <div v-else class="no-team">
            <p class="no-team-message">{{ isViewingOwnProfile ? '您尚未加入任何战队' : '该用户尚未加入任何战队' }}</p>
            <div class="team-actions" v-if="isViewingOwnProfile">
              <button class="action-button create-team-button" @click="showCreateTeam = true">
                <span class="button-icon">🏆</span>
                <span class="button-text">创建战队</span>
              </button>
              <button class="action-button join-team-button" @click="goToJoinTeamPage"> <!--此处似乎不起作用-->
                <span class="button-icon">➕</span>
                <span class="button-text">浏览并加入战队</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 账户操作卡片 - 仅自己可见 -->
        <div class="profile-card actions-card" v-if="isViewingOwnProfile">
          <h3 class="card-title">账户操作</h3>
          <div class="action-buttons">
            <button class="action-button logout-button" @click="handleLogout">
              <span class="button-icon">🚪</span>
              <span class="button-text">退出登录</span>
            </button>
            
            <button class="action-button change-password-button" @click="showChangePassword = true">
              <span class="button-icon">🔒</span>
              <span class="button-text">修改密码</span>
            </button>
            
            <button class="action-button delete-account-button" @click="showDeleteConfirm = true">
              <span class="button-icon">🗑️</span>
              <span class="button-text">注销账户</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 右侧内容区域：帖子流 -->
      <div class="profile-content">
        <!-- 帖子瀑布流 - 对所有用户可见 -->
        <div class="posts-section">
          <div class="posts-header">
            <h2>{{ isViewingOwnProfile ? '我的帖子' : `${userInfo.username}的帖子` }}</h2>
            <div class="posts-header-actions">
              <button v-if="isViewingOwnProfile" class="create-post-button" @click="goToCreatePost">
                <span class="button-icon">📝</span>
                <span class="button-text">发布新帖子</span>
              </button>
              <div class="posts-stats">
                <span class="stat-item">共 {{ userPosts.length }} 篇帖子</span>
                <span class="stat-item">获赞 {{ totalLikes }} 次</span>
              </div>
            </div>
          </div>
          
          <div v-if="loadingPosts" class="loading-posts">
            <div class="loading-spinner"></div>
            <p>加载帖子中...</p>
          </div>
          
          <div v-else-if="userPosts.length === 0" class="no-posts">
            <p class="no-posts-message">{{ isViewingOwnProfile ? '您还没有发布过任何帖子' : `${userInfo.username}还没有发布过任何帖子` }}</p>
            <button v-if="isViewingOwnProfile" class="create-post-button-empty" @click="goToCreatePost">
              <span class="button-icon">📝</span>
              <span class="button-text">发布第一篇帖子</span>
            </button>
          </div>
          
          <div v-else class="posts-waterfall">
            <div
              v-for="post in userPosts"
              :key="post.id"
              class="post-card"
              :class="getPostCategoryClass(post.category)"
            >
              <div class="post-header">
                <div class="post-category">{{ getCategoryDisplayName(post.category) }}</div>
                <div class="post-date">{{ formatDate(post.createdAt) }}</div>
              </div>
              
              <h3 class="post-title">{{ post.title }}</h3>
              
              <div class="post-content">
                {{ truncateContent(post.content, 150) }}
              </div>
              
              <div class="post-footer">
                <div class="post-stats">
                  <span class="stat likes-stat">
                    <span class="stat-icon">❤️</span>
                    {{ post.likes }}
                  </span>
                  <span class="stat comments-stat">
                    <span class="stat-icon">💬</span>
                    {{ post.comments.length }}
                  </span>
                </div>
                
                <div class="post-actions">
                  <button class="post-action-button view-button" @click="viewPost(post.id)">
                    查看详情
                  </button>
                  <button v-if="isViewingOwnProfile" class="post-action-button delete-button" @click="deletePost(post.id)">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      
      <!-- 修改密码模态框 -->
      <div v-if="showChangePassword" class="modal-overlay" @click.self="showChangePassword = false">
        <div class="modal-content">
          <h3>修改密码</h3>
          <form @submit.prevent="handleChangePassword" class="password-form">
            <div class="form-group">
              <label for="currentPassword">当前密码</label>
              <input
                type="password"
                id="currentPassword"
                v-model="passwordData.currentPassword"
                required
                placeholder="请输入当前密码"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="newPassword">新密码</label>
              <input
                type="password"
                id="newPassword"
                v-model="passwordData.newPassword"
                required
                placeholder="请输入新密码（至少6位）"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="confirmNewPassword">确认新密码</label>
              <input
                type="password"
                id="confirmNewPassword"
                v-model="passwordData.confirmNewPassword"
                required
                placeholder="请再次输入新密码"
                class="form-input"
              />
            </div>
            
            <div v-if="passwordMessage" class="message" :class="{ 'error': isPasswordError }">
              {{ passwordMessage }}
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="showChangePassword = false" class="modal-button cancel-button">
                取消
              </button>
              <button type="submit" class="modal-button confirm-button">
                确认修改
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 注销确认模态框 -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content">
          <h3>确认注销账户</h3>
          <p class="warning-text">⚠️ 警告：此操作不可撤销！您的所有数据将被永久删除。</p>
          <p>请输入您的密码以确认注销：</p>
          
          <div class="form-group">
            <input
              type="password"
              v-model="deletePassword"
              required
              placeholder="请输入密码"
              class="form-input"
            />
          </div>
          
          <div v-if="deleteMessage" class="message error">
            {{ deleteMessage }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showDeleteConfirm = false" class="modal-button cancel-button">
              取消
            </button>
            <button type="button" @click="handleDeleteAccount" class="modal-button delete-button">
              确认注销
            </button>
          </div>
        </div>
      </div>
      
      <!-- 创建战队模态框 -->
      <div v-if="showCreateTeam" class="modal-overlay" @click.self="showCreateTeam = false">
        <div class="modal-content">
          <h3>创建战队</h3>
          <form @submit.prevent="handleCreateTeam" class="team-form">
            <div class="form-group">
              <label for="teamName">战队名称</label>
              <input
                type="text"
                id="teamName"
                v-model="teamData.teamName"
                required
                placeholder="请输入战队名称（不含#号）"
                class="form-input"
              />
              <p class="form-hint">系统会自动在名称后添加 #随机四位数 作为唯一标识符</p>
            </div>
            
            <div v-if="teamMessage" class="message" :class="{ 'error': isTeamError }">
              {{ teamMessage }}
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="showCreateTeam = false" class="modal-button cancel-button">
                取消
              </button>
              <button type="submit" class="modal-button confirm-button">
                创建战队
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 加入战队模态框 -->
      <div v-if="showJoinTeam" class="modal-overlay" @click.self="showJoinTeam = false">
        <div class="modal-content">
          <h3>加入战队</h3>
          <form @submit.prevent="handleJoinTeam" class="team-form">
            <div class="form-group">
              <label for="joinTeamName">战队完整名称</label>
              <input
                type="text"
                id="joinTeamName"
                v-model="joinTeamName"
                required
                placeholder="请输入战队完整名称（包含#号）"
                class="form-input"
              />
              <p class="form-hint">例如：我的战队#1234</p>
            </div>
            
            <div v-if="joinTeamMessage" class="message" :class="{ 'error': isJoinTeamError }">
              {{ joinTeamMessage }}
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="showJoinTeam = false" class="modal-button cancel-button">
                取消
              </button>
              <button type="submit" class="modal-button confirm-button">
                加入战队
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 退出战队确认模态框 -->
      <div v-if="showLeaveConfirm" class="modal-overlay" @click.self="showLeaveConfirm = false">
        <div class="modal-content">
          <h3>确认退出战队</h3>
          <p class="warning-text">⚠️ 警告：退出后将无法访问战队内容！</p>
          <p>如果您是战队创建者，退出后战队将被解散。</p>
          
          <div v-if="leaveTeamMessage" class="message error">
            {{ leaveTeamMessage }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showLeaveConfirm = false" class="modal-button cancel-button">
              取消
            </button>
            <button type="button" @click="handleLeaveTeam" class="modal-button delete-button">
              确认退出
            </button>
          </div>
        </div>
      </div>
      
      <!-- 更改职责模态框 -->
      <div v-if="showChangeRole" class="modal-overlay" @click.self="showChangeRole = false">
        <div class="modal-content">
          <h3>选择担任职责</h3>
          <p class="form-hint">请选择您在战队中的主要职责（可多选，最多2个，或选择灵活）</p>
          
          <div class="role-options" color="#000000">
            <div
              class="role-option"
              :class="{ 'selected': isRoleSelected('heavy'), 'disabled': isRoleSelected('flexible') }"
              @click="toggleRoleSelection('heavy')"
            >
              <img src="/96px-职责：重装_图标.webp" alt="重装" class="role-option-icon" />
              <span class="role-option-label">重装</span>
              <p class="role-option-desc">承受伤害，保护队友</p>
              <div class="role-checkbox" :class="{ 'checked': isRoleSelected('heavy') }">
                <span v-if="isRoleSelected('heavy')">✓</span>
              </div>
            </div>
            
            <div
              class="role-option"
              :class="{ 'selected': isRoleSelected('damage'), 'disabled': isRoleSelected('flexible') }"
              @click="toggleRoleSelection('damage')"
            >
              <img src="/96px-职责：输出_图标.webp" alt="输出" class="role-option-icon" />
              <span class="role-option-label">输出</span>
              <p class="role-option-desc">造成伤害，击败敌人</p>
              <div class="role-checkbox" :class="{ 'checked': isRoleSelected('damage') }">
                <span v-if="isRoleSelected('damage')">✓</span>
              </div>
            </div>
            
            <div
              class="role-option"
              :class="{ 'selected': isRoleSelected('support'), 'disabled': isRoleSelected('flexible') }"
              @click="toggleRoleSelection('support')"
            >
              <img src="/96px-职责：支援_图标.webp" alt="支援" class="role-option-icon" />
              <span class="role-option-label">支援</span>
              <p class="role-option-desc">治疗辅助，提供支援</p>
              <div class="role-checkbox" :class="{ 'checked': isRoleSelected('support') }">
                <span v-if="isRoleSelected('support')">✓</span>
              </div>
            </div>
            
            <div
              class="role-option"
              :class="{ 'selected': isRoleSelected('flexible'), 'disabled': selectedRolesCount > 0 && !isRoleSelected('flexible') }"
              @click="toggleRoleSelection('flexible')"
            >
              <div class="flexible-icons">
                <img src="/96px-职责：重装_图标.webp" alt="重装" class="role-option-icon flexible-icon" />
                <img src="/96px-职责：输出_图标.webp" alt="输出" class="role-option-icon flexible-icon" />
                <img src="/96px-职责：支援_图标.webp" alt="支援" class="role-option-icon flexible-icon" />
              </div>
              <span class="role-option-label">灵活</span>
              <p class="role-option-desc">根据情况切换职责</p>
              <div class="role-checkbox" :class="{ 'checked': isRoleSelected('flexible') }">
                <span v-if="isRoleSelected('flexible')">✓</span>
              </div>
            </div>
          </div>
          
          <div class="selection-info">
            <p v-if="selectedRolesCount > 0">
              已选择 {{ selectedRolesCount }} 个职责:
              <span class="selected-roles-list">
                {{ selectedRoles.map(role => ROLE_DISPLAY_NAMES[role]).join('、') }}
              </span>
            </p>
            <p v-else>请至少选择一个职责</p>
          </div>
          
          <div v-if="roleMessage" class="message" :class="{ 'error': isRoleError }">
            {{ roleMessage }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="showChangeRole = false" class="modal-button cancel-button">
              取消
            </button>
            <button type="button" @click="handleChangeRole" class="modal-button confirm-button">
              确认更改
            </button>
          </div>
        </div>
      </div>
      
      <!-- 操作反馈消息 -->
      <div v-if="message" class="message" :class="{ 'error': isError }">
        {{ message }}
      </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import auth from '../services/auth.js';
import userService from '../services/user.js';
import postService from '../services/post.js';
import teamService from '../services/team.js';

const route = useRoute();
const router = useRouter();
const uid = computed(() => route.params.uid);

const userInfo = ref({});
const message = ref('');
const isError = ref(false);

const showChangePassword = ref(false);
const showDeleteConfirm = ref(false);
const passwordMessage = ref('');
const isPasswordError = ref(false);
const deleteMessage = ref('');
const deletePassword = ref('');

const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
});

// 战队相关变量
const showCreateTeam = ref(false);
const showJoinTeam = ref(false);
const showLeaveConfirm = ref(false);
const userTeam = ref(null);
const teamMembers = ref([]);
const teamMessage = ref('');
const isTeamError = ref(false);
const joinTeamName = ref('');
const joinTeamMessage = ref('');
const isJoinTeamError = ref(false);
const leaveTeamMessage = ref('');

const teamData = reactive({
  teamName: ''
});

// 职责相关变量
const showChangeRole = ref(false);
const selectedRoles = ref([]); // 改为数组，支持多选
const roleMessage = ref('');
const isRoleError = ref(false);

// 职责选项
const ROLE_OPTIONS = {
  HEAVY: 'heavy',
  DAMAGE: 'damage',
  SUPPORT: 'support',
  FLEXIBLE: 'flexible'
};

// 职责显示名称映射
const ROLE_DISPLAY_NAMES = {
  'heavy': '重装',
  'damage': '输出',
  'support': '支援',
  'flexible': '灵活'
};

// 处理职责选择
const toggleRoleSelection = (role) => {
  if (role === ROLE_OPTIONS.FLEXIBLE) {
    // 选择灵活时，清空其他选项
    selectedRoles.value = [ROLE_OPTIONS.FLEXIBLE];
  } else {
    // 选择其他职责时，移除灵活选项
    const index = selectedRoles.value.indexOf(ROLE_OPTIONS.FLEXIBLE);
    if (index !== -1) {
      selectedRoles.value.splice(index, 1);
    }
    
    // 切换当前职责的选择状态
    const roleIndex = selectedRoles.value.indexOf(role);
    if (roleIndex === -1) {
      // 最多选择2个非灵活职责
      if (selectedRoles.value.length < 2) {
        selectedRoles.value.push(role);
      }
    } else {
      selectedRoles.value.splice(roleIndex, 1);
    }
  }
};

// 检查职责是否被选中
const isRoleSelected = (role) => {
  return selectedRoles.value.includes(role);
};

// 获取选中的职责数量
const selectedRolesCount = computed(() => {
  return selectedRoles.value.length;
});

// 计算职责图标和显示名称（支持数组）
const roleIcons = computed(() => {
  const roles = userInfo.value?.role;
  
  // 处理旧数据（可能是字符串）和新数据（数组）
  if (!roles) {
    return ['/96px-职责：重装_图标.webp', '/96px-职责：输出_图标.webp', '/96px-职责：支援_图标.webp'];
  }
  
  if (Array.isArray(roles)) {
    if (roles.includes('flexible') || roles.length === 0) {
      // 灵活或空数组显示所有图标
      return ['/96px-职责：重装_图标.webp', '/96px-职责：输出_图标.webp', '/96px-职责：支援_图标.webp'];
    } else {
      // 显示选中的职责图标
      const iconMap = {
        'heavy': '/96px-职责：重装_图标.webp',
        'damage': '/96px-职责：输出_图标.webp',
        'support': '/96px-职责：支援_图标.webp'
      };
      return roles.map(role => iconMap[role]).filter(Boolean);
    }
  } else {
    // 旧数据（字符串）
    const iconMap = {
      'heavy': '/96px-职责：重装_图标.webp',
      'damage': '/96px-职责：输出_图标.webp',
      'support': '/96px-职责：支援_图标.webp',
      'flexible': '' // 灵活显示多个图标
    };
    const icon = iconMap[roles];
    return icon ? [icon] : [];
  }
});

const roleDisplayName = computed(() => {
  const roles = userInfo.value?.role;
  
  if (!roles) {
    return '灵活';
  }
  
  if (Array.isArray(roles)) {
    if (roles.includes('flexible') || roles.length === 0) {
      return '灵活';
    } else {
      return roles.map(role => ROLE_DISPLAY_NAMES[role]).join('、');
    }
  } else {
    // 旧数据（字符串）
    const nameMap = {
      'heavy': '重装',
      'damage': '输出',
      'support': '支援',
      'flexible': '灵活'
    };
    return nameMap[roles] || '未知';
  }
});

// 获取角色显示名称（用于成员列表，支持数组）
const getRoleDisplayName = (role) => {
  if (Array.isArray(role)) {
    if (role.includes('flexible') || role.length === 0) {
      return '灵活';
    } else {
      return role.map(r => ROLE_DISPLAY_NAMES[r]).join('、');
    }
  } else {
    const nameMap = {
      'heavy': '重装',
      'damage': '输出',
      'support': '支援',
      'flexible': '灵活'
    };
    return nameMap[role] || '未知';
  }
};

// 获取角色图标（用于成员列表，支持数组）
const getRoleIcon = (role) => {
  if (Array.isArray(role)) {
    if (role.includes('flexible') || role.length === 0) {
      return '';
    } else if (role.length === 1) {
      const iconMap = {
        'heavy': '/96px-职责：重装_图标.webp',
        'damage': '/96px-职责：输出_图标.webp',
        'support': '/96px-职责：支援_图标.webp'
      };
      return iconMap[role[0]] || '';
    } else {
      // 多个职责，返回第一个
      const iconMap = {
        'heavy': '/96px-职责：重装_图标.webp',
        'damage': '/96px-职责：输出_图标.webp',
        'support': '/96px-职责：支援_图标.webp'
      };
      return iconMap[role[0]] || '';
    }
  } else {
    const iconMap = {
      'heavy': '/96px-职责：重装_图标.webp',
      'damage': '/96px-职责：输出_图标.webp',
      'support': '/96px-职责：支援_图标.webp',
      'flexible': ''
    };
    return iconMap[role] || '';
  }
};

// 获取角色CSS类
const getRoleClass = (role) => {
  const classMap = {
    'heavy': 'role-heavy',
    'damage': 'role-damage',
    'support': 'role-support',
    'flexible': 'role-flexible'
  };
  
  // 处理数组情况：如果是数组，返回第一个角色的类
  if (Array.isArray(role)) {
    if (role.length === 0) return '';
    // 如果是灵活角色，返回灵活类
    if (role.includes('flexible')) return 'role-flexible';
    return classMap[role[0]] || '';
  }
  
  return classMap[role] || '';
};

// 加载用户信息
const loadUserInfo = () => {
  const targetUid = uid.value;
  
  if (targetUid) {
    // 通过用户ID获取用户信息
    const user = userService.getUserById(targetUid);
    if (user) {
      userInfo.value = user;
    } else {
      // 用户不存在
      message.value = '用户不存在';
      isError.value = true;
      // 可以跳转到404页面或返回
    }
  } else {
    // 如果没有提供用户ID，使用当前登录用户
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      userInfo.value = currentUser;
    } else {
      // 如果未登录，跳转到登录页面
      router.push({ name: 'Login' });
    }
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  } catch (error) {
    return '日期格式错误';
  }
};

// 导航到加入战队页面
const goToJoinTeamPage = () => {
  window.location.hash = 'jointeam';
};

// 处理退出登录
const handleLogout = () => {
  if (auth.logout()) {
    message.value = '已成功退出登录';
    isError.value = false;
    
    // 立即跳转到首页
    router.push({ name: 'Home' });
  } else {
    message.value = '退出登录失败';
    isError.value = true;
  }
};

// 处理修改密码
const handleChangePassword = () => {
  // 验证新密码是否匹配
  if (passwordData.newPassword !== passwordData.confirmNewPassword) {
    passwordMessage.value = '两次输入的新密码不一致';
    isPasswordError.value = true;
    return;
  }
  
  // 验证新密码长度
  if (passwordData.newPassword.length < 6) {
    passwordMessage.value = '新密码长度至少为6位';
    isPasswordError.value = true;
    return;
  }
  
  // 获取当前用户
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    passwordMessage.value = '用户未登录';
    isPasswordError.value = true;
    return;
  }
  
  // 这里应该调用API验证当前密码并更新密码
  // 由于是本地存储演示，我们简化处理
  const users = userService.getAllUsers();
  const userIndex = users.findIndex(user => user.id === currentUser.id);
  
  if (userIndex === -1) {
    passwordMessage.value = '用户不存在';
    isPasswordError.value = true;
    return;
  }
  
  // 验证当前密码
  if (users[userIndex].password !== passwordData.currentPassword) {
    passwordMessage.value = '当前密码错误';
    isPasswordError.value = true;
    return;
  }
  
  // 更新密码
  users[userIndex].password = passwordData.newPassword;
  users[userIndex].updatedAt = new Date().toISOString();
  
  if (userService.saveAllUsers(users)) {
    passwordMessage.value = '密码修改成功！';
    isPasswordError.value = false;
    
    // 清空表单
    passwordData.currentPassword = '';
    passwordData.newPassword = '';
    passwordData.confirmNewPassword = '';
    
    // 立即关闭模态框
    showChangePassword.value = false;
    passwordMessage.value = '';
  } else {
    passwordMessage.value = '密码修改失败';
    isPasswordError.value = true;
  }
};

// 处理注销账户
const handleDeleteAccount = () => {
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    deleteMessage.value = '用户未登录';
    return;
  }
  
  // 验证密码
  const users = userService.getAllUsers();
  const user = users.find(u => u.id === currentUser.id);
  
  if (!user) {
    deleteMessage.value = '用户不存在';
    return;
  }
  
  if (user.password !== deletePassword.value) {
    deleteMessage.value = '密码错误';
    return;
  }
  
  // 删除用户
  const result = userService.deleteUser(currentUser.id);
  
  if (result.success) {
    deleteMessage.value = '账户已成功注销';
    
    // 立即跳转到首页
    router.push({ name: 'Home' });
  } else {
    deleteMessage.value = result.message || '注销失败';
  }
};

// 加载战队信息
const loadTeamInfo = () => {
  // 使用当前查看的用户ID，如果没有则使用当前登录用户ID
  const targetUserId = userInfo.value?.id || auth.getCurrentUser()?.id;
  if (!targetUserId) return;
  
  const team = teamService.getUserTeam(targetUserId);
  userTeam.value = team;
  
  if (team) {
    const members = teamService.getTeamMembers(team.id);
    // teamService.getTeamMembers 返回成员ID列表，需要获取用户信息
    const allUsers = userService.getAllUsers();
    teamMembers.value = allUsers.filter(user => members.includes(user.id));
  } else {
    teamMembers.value = [];
  }
};

// 创建战队
const handleCreateTeam = () => {
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    teamMessage.value = '用户未登录';
    isTeamError.value = true;
    return;
  }
  
  if (!teamData.teamName.trim()) {
    teamMessage.value = '请输入战队名称';
    isTeamError.value = true;
    return;
  }
  
  const result = teamService.createTeam(teamData.teamName.trim(), currentUser.id);
  
  if (result.success) {
    teamMessage.value = '战队创建成功！';
    isTeamError.value = false;
    
    // 清空表单
    teamData.teamName = '';
    
    // 更新战队信息
    loadTeamInfo();
    
    // 立即关闭模态框
    showCreateTeam.value = false;
    teamMessage.value = '';
  } else {
    teamMessage.value = result.message || '创建战队失败';
    isTeamError.value = true;
  }
};

// 加入战队
const handleJoinTeam = () => {
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    joinTeamMessage.value = '用户未登录';
    isJoinTeamError.value = true;
    return;
  }
  
  if (!joinTeamName.value.trim()) {
    joinTeamMessage.value = '请输入战队完整名称';
    isJoinTeamError.value = true;
    return;
  }
  
  const result = teamService.joinTeam(joinTeamName.value.trim(), currentUser.id);
  
  if (result.success) {
    joinTeamMessage.value = '成功加入战队！';
    isJoinTeamError.value = false;
    
    // 清空表单
    joinTeamName.value = '';
    
    // 更新战队信息
    loadTeamInfo();
    
    // 立即关闭模态框
    showJoinTeam.value = false;
    joinTeamMessage.value = '';
  } else {
    joinTeamMessage.value = result.message || '加入战队失败';
    isJoinTeamError.value = true;
  }
};

// 退出战队
const handleLeaveTeam = () => {
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    leaveTeamMessage.value = '用户未登录';
    return;
  }
  
  const result = teamService.leaveTeam(currentUser.id);
  
  if (result.success) {
    leaveTeamMessage.value = result.teamDeleted ? '已退出战队，战队已解散' : '已成功退出战队';
    
    // 更新战队信息
    loadTeamInfo();
    
    // 立即关闭模态框
    showLeaveConfirm.value = false;
    leaveTeamMessage.value = '';
  } else {
    leaveTeamMessage.value = result.message || '退出战队失败';
  }
};

// 更改职责
const handleChangeRole = () => {
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    roleMessage.value = '用户未登录';
    isRoleError.value = true;
    return;
  }
  
  // 验证至少选择了一个职责
  if (selectedRoles.value.length === 0) {
    roleMessage.value = '请至少选择一个职责';
    isRoleError.value = true;
    return;
  }
  
  // 验证选择逻辑：灵活与其他职责互斥
  const hasFlexible = selectedRoles.value.includes(ROLE_OPTIONS.FLEXIBLE);
  const hasOtherRoles = selectedRoles.value.some(role =>
    role !== ROLE_OPTIONS.FLEXIBLE
  );
  
  if (hasFlexible && hasOtherRoles) {
    roleMessage.value = '灵活选项不能与其他职责同时选择';
    isRoleError.value = true;
    return;
  }
  
  // 验证非灵活职责最多选择2个
  if (!hasFlexible && selectedRoles.value.length > 2) {
    roleMessage.value = '最多只能选择2个职责';
    isRoleError.value = true;
    return;
  }
  
  // 调用更新职责函数（需要修改后端支持数组）
  const result = userService.updateUserRoles(currentUser.id, selectedRoles.value);
  
  if (result.success) {
    roleMessage.value = '职责更新成功！';
    isRoleError.value = false;
    
    // 更新用户信息
    loadUserInfo();
    
    // 立即关闭模态框
    showChangeRole.value = false;
    roleMessage.value = '';
    selectedRoles.value = [];
    
    // 更新战队信息以刷新职责显示
    loadTeamInfo();
  } else {
    roleMessage.value = result.message || '更新职责失败';
    isRoleError.value = true;
  }
};

// 帖子相关变量
const userPosts = ref([]);
const loadingPosts = ref(false);
const totalLikes = computed(() => {
  return userPosts.value.reduce((sum, post) => sum + post.likes, 0);
});

// 加载用户帖子
const loadUserPosts = () => {
  const targetUserId = userInfo.value?.id;
  if (!targetUserId) {
    return;
  }
  
  loadingPosts.value = true;
  try {
    // 使用postService中的方法获取指定用户的主帖子（不包括回复和评论）
    userPosts.value = postService.getUserMainPosts(targetUserId);
  } catch (error) {
    console.error('加载帖子失败:', error);
  } finally {
    loadingPosts.value = false;
  }
};

// 跳转到发帖页面
const goToCreatePost = () => {
  router.push({ name: 'CreatePost' });
};

// 查看帖子详情
const viewPost = (postId) => {
  // 跳转到帖子详情页面
  router.push({ name: 'PostDetail', params: { id: postId } });
};

// 删除帖子
const deletePost = (postId) => {
  if (!confirm('确定要删除这篇帖子吗？此操作不可撤销。')) {
    return;
  }
  
  const currentUser = auth.getCurrentUser();
  const result = postService.deletePost(postId, currentUser?.id);
  if (result.success) {
    // 从列表中移除已删除的帖子
    userPosts.value = userPosts.value.filter(post => post.id !== postId);
    message.value = '帖子删除成功';
    isError.value = false;
  } else {
    message.value = result.message || '删除失败';
    isError.value = true;
  }
};

// 获取分类显示名称
const getCategoryDisplayName = (category) => {
  const categoryMap = {
    'general': '一般讨论',
    'team': '战队招募',
    'strategy': '战术攻略',
    'highlight': '精彩集锦',
    'question': '问题求助',
    'announcement': '公告通知'
  };
  return categoryMap[category] || '其他';
};

// 获取帖子分类CSS类
const getPostCategoryClass = (category) => {
  return `post-category-${category}`;
};

// 截断内容
const truncateContent = (content, maxLength) => {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
};

// 计算是否是查看自己的资料
const isViewingOwnProfile = computed(() => {
  const currentUser = auth.getCurrentUser();
  return currentUser && currentUser.id === userInfo.value.id;
});

// 处理返回按钮
const handleBack = () => {
  if (isViewingOwnProfile.value) {
    // 查看自己的资料，返回首页
    router.push({ name: 'Home' });
  } else {
    // 查看他人资料，返回上一页
    router.go(-1);
  }
};

// 处理头像加载错误
const handleAvatarError = (event) => {
  // 如果头像加载失败，使用默认头像
  event.target.src = '/Head.png';
};

// 处理点击战队成员，跳转到用户面板
const handleMemberClick = (memberId) => {
  // 跳转到对应用户的用户面板
  router.push({ name: 'UserProfile', params: { uid: memberId } });
};

// 组件挂载时加载用户信息
onMounted(() => {
  loadUserInfo();
});

// 监听uid变化，当路由参数改变时重新加载用户信息
watch(uid, (newUid) => {
  if (newUid) {
    loadUserInfo();
  }
});

// 监听userInfo变化，当用户信息加载后加载战队信息和帖子
watch(userInfo, (newUser) => {
  if (newUser && newUser.id) {
    loadTeamInfo();
    loadUserPosts();
  }
}, { immediate: true });
</script>

<style scoped>
.user-profile {
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: 'SmileySans Oblique', sans-serif;
}

/* 用户封面图区域 */
.profile-cover {
  position: relative;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)),
              url('/public/Heading.png') center/cover no-repeat;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.back-button {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.back-button:hover {
  background-color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button svg {
  width: 16px;
  height: 16px;
}

.profile-header-content {
  display: flex;
  align-items: flex-end;
  flex: 1;
  gap: 30px;
  padding-bottom: 40px;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  background-color: #f0f2f5; /* 加载时的背景色 */
}

.profile-header-info {
  flex: 1;
  color: white;
}

.profile-name {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.profile-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* 主要内容区域 */
.profile-container {
  max-width: 1200px;
  margin-top: 60px;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 380px 1fr; /*重要！！：这一数值调整侧边栏宽度*/
  gap: 30px;
}

/* 左侧栏样式 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4facfe;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.95rem;
}

.info-value {
  font-weight: 500;
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.header-section {
  position: relative;
  margin-bottom: 30px;
}

.back-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #e9ecef;
  border-color: #4facfe;
  color: #4facfe;
}

.back-button svg {
  width: 16px;
  height: 16px;
}

.page-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2.5rem;
  color: #333;
  text-align: center;
  margin-bottom: 0;
  font-weight: bold;
}

.user-info-section {
  margin-bottom: 40px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.user-info-section h2 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #495057;
  margin-bottom: 20px;
  border-bottom: 2px solid #4facfe;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #dee2e63b;
}

.info-label {
  font-weight: 600;
  color: #6c757d;
}

.info-value {
  color: #212529;
  font-weight: 500;
  flex: 1;
  min-width: 0; /* 防止溢出 */
}

.actions-section {
  margin-bottom: 30px;
}

.actions-section h2 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #495057;
  margin-bottom: 20px;
  border-bottom: 2px solid #4facfe;
  padding-bottom: 10px;
}

/* 战队信息样式 */
.team-section {
  margin-bottom: 40px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.team-section h2 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #495057;
  margin-bottom: 20px;
  border-bottom: 2px solid #4facfe;
  padding-bottom: 10px;
}

/* 战队成员列表样式 */
.team-members-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #e9ecef;
}

.members-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  color: #495057;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
  cursor: pointer;
}

.member-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #4facfe;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.member-roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.member-role {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.9rem;
  padding: 3px 10px;
  border-radius: 15px;
  display: inline-block;
  width: fit-content;
}

.role-heavy {
  background-color: rgba(255, 193, 7, 0.15);
  color: #856404;
  border: 1px solid #ffc107;
}

.role-damage {
  background-color: rgba(220, 53, 69, 0.15);
  color: #721c24;
  border: 1px solid #dc3545;
}

.role-support {
  background-color: rgba(40, 167, 69, 0.15);
  color: #155724;
  border: 1px solid #28a745;
}

.role-flexible {
  background-color: rgba(108, 117, 125, 0.15);
  color: #495057;
  border: 1px solid #6c757d;
}

.member-icons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-role-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.flexible-icons-small {
  display: flex;
  gap: 2px;
}

.flexible-icon-small {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.creator-badge {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.8rem;
  background-color: #4facfe;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.you-badge {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.8rem;
  background-color: #28a745;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.no-team {
  text-align: center;
  padding: 20px;
}

.no-team-message {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  color: #6c757d;
  margin-bottom: 20px;
}

.team-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.create-team-button {
  background-color: rgba(40, 167, 69, 0.1);
  border: 2px solid #28a745;
  color: #155724;
}

.create-team-button:hover {
  background-color: #28a745;
  color: white;
}

.join-team-button {
  background-color: rgba(0, 123, 255, 0.1);
  border: 2px solid #007bff;
  color: #004085;
}

.join-team-button:hover {
  background-color: #007bff;
  color: white;
}

.leave-team-button {
  background-color: rgba(220, 53, 69, 0.1);
  border: 2px solid #dc3545;
  color: #721c24;
}

.leave-team-button:hover {
  background-color: #dc3545;
  color: white;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: none;
  border-radius: 12px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
}

.button-icon {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.button-text {
  font-weight: 600;
}

.logout-button {
  background-color: rgba(255, 193, 7, 0.1);
  border: 2px solid #ffc107;
  color: #856404;
}

.logout-button:hover {
  background-color: #ffc107;
  color: white;
}

.change-password-button {
  background-color: rgba(0, 123, 255, 0.1);
  border: 2px solid #007bff;
  color: #004085;
}

.change-password-button:hover {
  background-color: #007bff;
  color: white;
}

.delete-account-button {
  background-color: rgba(220, 53, 69, 0.1);
  border: 2px solid #dc3545;
  color: #721c24;
}

.delete-account-button:hover {
  background-color: #dc3545;
  color: white;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.warning-text {
  color: #dc3545;
  font-weight: 600;
  text-align: center;
  margin: 15px 0;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #555;
  font-weight: 500;
}

.form-input {
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'SmileySans Oblique', sans-serif;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #4facfe;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.modal-button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.cancel-button:hover {
  background-color: #5a6268;
}

.confirm-button {
  background-color: #28a745;
  color: white;
}

.confirm-button:hover {
  background-color: #218838;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
}

/* 表单提示样式 */
.form-hint {
  font-size: 0.9rem;
  color: #6c757d;
  margin-top: 5px;
  font-style: italic;
}

/* 职责相关样式 */
.role-display {
  display: flex;
  align-items: center;
  justify-content: flex-end;  /* 关键 */
  gap: 8px; /* 可选，让元素别挤一起 */
}

.role-icons {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.role-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  background-color: #5f6265a6;
  border-radius: 4px;
  padding: 2px;
}

.flexible-icon {
  width: 20px;
  height: 20px;
}

.change-role-button {
  margin-left: 10px;
  padding: 4px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 64px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.change-role-button:hover {
  background-color: #5a6268;
}

.role-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 20px 0;
}

.role-option {
  padding: 15px;
  border: 2px solid #dee2e629;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-option:hover {
  border-color: #4facfe;
  background-color: rgba(79, 172, 254, 0.05);
}

.role-option.selected {
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

.role-option-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 10px;
  background-color: #35373998;
  border-radius: 8px;
  padding: 4px;
}

.flexible-icons {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 10px;
}

.flexible-icons .role-option-icon {
  width: 32px;
  height: 32px;
}

.role-option-label {
  display: block;
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 5px;
}

.role-option-desc {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}

/* 消息样式 */
.message {
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 500;
}

.message:not(.error) {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 帖子瀑布流样式 */
.posts-section {
  margin-top: 40px;
  padding: 25px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.posts-section h2 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4facfe;
}

.posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.create-post-button {
  padding: 1px 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.create-post-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.posts-stats {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.stat-item {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #666;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.loading-posts {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4facfe;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-posts {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-posts-message {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.create-post-button-empty {
  padding: 12px 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.create-post-button-empty:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3);
}

.posts-waterfall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid #4facfe;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.post-category-general { border-left-color: #6c757d; }
.post-category-team { border-left-color: #28a745; }
.post-category-strategy { border-left-color: #17a2b8; }
.post-category-highlight { border-left-color: #ffc107; }
.post-category-question { border-left-color: #fd7e14; }
.post-category-announcement { border-left-color: #dc3545; }

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.post-category {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  background-color: #f8f9fa;
  color: #495057;
}

.post-date {
  font-size: 0.85rem;
  color: #6c757d;
}

.post-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.post-content {
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.post-stats {
  display: flex;
  gap: 15px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: #6c757d;
}

.stat-icon {
  font-size: 1rem;
}

.post-actions {
  display: flex;
  gap: 10px;
}

.post-action-button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-button {
  background-color: #4facfe;
  color: white;
}

.view-button:hover {
  background-color: #3a9bf7;
}

.delete-button {
  background-color: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.delete-button:hover {
  background-color: #dc3545;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .posts-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .posts-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .posts-waterfall {
    grid-template-columns: 1fr;
  }
  
  .post-card {
    padding: 15px;
  }
}
</style>
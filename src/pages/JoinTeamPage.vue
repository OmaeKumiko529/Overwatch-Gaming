<template>
  <div class="join-team-page page-enter-active">
    <div class="page-container">
      <h1 class="page-title">加入战队</h1>
      <p class="page-subtitle">浏览所有可用战队，选择一个加入</p>
      
      <!-- 搜索和筛选区域 -->
      <div class="filter-section">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索战队名称..."
            class="search-input"
          />
          <button class="search-button" @click="filterTeams">
            <span class="search-icon">🔍</span>
          </button>
        </div>
        
        <div class="filter-options">
          <label class="filter-label">
            <span>排序方式：</span>
            <select v-model="sortBy" @change="sortTeams" class="filter-select">
              <option value="name">名称 (A-Z)</option>
              <option value="nameDesc">名称 (Z-A)</option>
              <option value="members">成员数量 (多到少)</option>
              <option value="membersAsc">成员数量 (少到多)</option>
              <option value="date">创建时间 (新到旧)</option>
              <option value="dateDesc">创建时间 (旧到新)</option>
            </select>
          </label>
        </div>
      </div>
      
      <!-- 战队列表 -->
      <div class="teams-container">
        <div v-if="loading" class="loading-message">
          <div class="loading-spinner"></div>
          <p>加载战队列表中...</p>
        </div>
        
        <div v-else-if="filteredTeams.length === 0" class="no-teams-message">
          <p v-if="searchQuery">没有找到匹配 "{{ searchQuery }}" 的战队</p>
          <p v-else>目前没有可加入的战队</p>
          <button class="create-team-button" @click="goToCreateTeam">创建新战队</button>
        </div>
        
        <div v-else class="teams-grid">
          <div 
            v-for="team in filteredTeams" 
            :key="team.id" 
            class="team-card"
            :class="{ 'full-team': team.memberCount >= 6 }"
          >
            <div class="team-header">
              <h3 class="team-name">{{ team.displayName }}</h3>
              <span class="team-tag">#{{ team.tag }}</span>
            </div>
            
            <div class="team-info">
              <div class="info-item">
                <span class="info-label">创建者：</span>
                <span class="info-value">{{ team.creatorName || '未知' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间：</span>
                <span class="info-value">{{ formatDate(team.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">成员数量：</span>
                <span class="info-value">
                  {{ team.memberCount }} / 6 人
                  <span v-if="team.memberCount >= 6" class="full-badge">已满</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">战队描述：</span>
                <span class="info-value">{{ team.description || '暂无描述' }}</span>
              </div>
            </div>
            
            <div class="team-actions">
              <button 
                v-if="team.memberCount < 6 && !isUserInTeam"
                class="join-button"
                @click="showJoinConfirm(team)"
                :disabled="joiningTeamId === team.id"
              >
                <span v-if="joiningTeamId === team.id" class="button-loading"></span>
                <span v-else>加入战队</span>
              </button>
              
              <button 
                v-else-if="team.memberCount >= 6"
                class="full-button"
                disabled
              >
                战队已满
              </button>
              
              <button 
                v-else
                class="already-member-button"
                disabled
              >
                已是成员
              </button>
              
              <button 
                class="details-button"
                @click="showTeamDetails(team)"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 返回按钮 -->
      <div class="page-actions">
        <button class="back-button" @click="goBack">返回用户面板</button>
      </div>
      
      <!-- 加入确认模态框 -->
      <div v-if="showJoinModal" class="modal-overlay" @click.self="closeJoinModal">
        <div class="modal-content">
          <h3>确认加入战队</h3>
          <p>您确定要加入 <strong>{{ selectedTeam?.displayName }}#{{ selectedTeam?.tag }}</strong> 吗？</p>
          
          <div class="modal-info">
            <p>加入后，您将成为该战队的成员，可以：</p>
            <ul>
              <li>参与战队活动</li>
              <li>查看战队成员信息</li>
              <li>与其他成员协作</li>
            </ul>
            <p class="warning-text">注意：您只能加入一个战队，加入新战队将自动退出当前战队（如果有）。</p>
          </div>
          
          <div v-if="joinMessage" class="message" :class="{ 'error': isJoinError }">
            {{ joinMessage }}
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeJoinModal" class="modal-button cancel-button">
              取消
            </button>
            <button type="button" @click="confirmJoinTeam" class="modal-button confirm-button">
              确认加入
            </button>
          </div>
        </div>
      </div>
      
      <!-- 战队详情模态框 -->
      <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
        <div class="modal-content team-details-modal">
          <h3>战队详情</h3>
          
          <div v-if="selectedTeam" class="team-details">
            <div class="detail-header">
              <h4>{{ selectedTeam.displayName }}#{{ selectedTeam.tag }}</h4>
              <span class="detail-status" :class="{ 'full': selectedTeam.memberCount >= 6 }">
                {{ selectedTeam.memberCount >= 6 ? '已满员' : '可加入' }}
              </span>
            </div>
            
            <div class="detail-info">
              <div class="detail-item">
                <span class="detail-label">创建者：</span>
                <span class="detail-value">{{ selectedTeam.creatorName || '未知' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">创建时间：</span>
                <span class="detail-value">{{ formatDate(selectedTeam.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">成员数量：</span>
                <span class="detail-value">{{ selectedTeam.memberCount }} / 6 人</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">战队描述：</span>
                <span class="detail-value">{{ selectedTeam.description || '暂无描述' }}</span>
              </div>
            </div>
            
            <div class="detail-members">
              <h5>战队成员</h5>
              <div v-if="teamMembers.length === 0" class="no-members">
                <p>暂无成员信息</p>
              </div>
              <div v-else class="members-list">
                <div v-for="member in teamMembers" :key="member.id" class="member-item">
                  <span class="member-name">{{ member.username }}</span>
                  <span class="member-role">{{ getRoleDisplayName(member.role) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeDetailsModal" class="modal-button cancel-button">
              关闭
            </button>
            <button 
              v-if="selectedTeam && selectedTeam.memberCount < 6 && !isUserInTeam"
              type="button" 
              @click="showJoinConfirmFromDetails"
              class="modal-button confirm-button"
            >
              加入此战队
            </button>
          </div>
        </div>
      </div>
      
      <!-- 操作反馈消息 -->
      <div v-if="message" class="message" :class="{ 'error': isError }">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import teamService from '../services/team.js';
import userService from '../services/user.js';

// 状态变量
const loading = ref(true);
const teams = ref([]);
const filteredTeams = ref([]);
const searchQuery = ref('');
const sortBy = ref('name');
const message = ref('');
const isError = ref(false);

// 加入战队相关
const showJoinModal = ref(false);
const selectedTeam = ref(null);
const joinMessage = ref('');
const isJoinError = ref(false);
const joiningTeamId = ref(null);

// 详情模态框相关
const showDetailsModal = ref(false);
const teamMembers = ref([]);

const authStore = useAuthStore();

// 计算属性：用户是否已在战队中
const isUserInTeam = computed(() => {
  const currentUser = authStore.currentUser;
  if (!currentUser) return false;
  return currentUser.teamId ? true : false;
});

// 搜索输入自动过滤
watch(searchQuery, () => {
  filterTeams();
});

// 加载战队列表
const loadTeams = () => {
  loading.value = true;
  
  try {
    const allTeams = teamService.getAllTeams();
    const users = userService.getAllUsers();
    
    const processedTeams = allTeams.map(team => {
      const creator = users.find(user => user.id === team.creatorId);
      const memberCount = users.filter(user => user.teamId === team.id).length;
      
      const fullName = team.name || '';
      let displayName = fullName;
      let tag = '';
      
      const hashIndex = fullName.lastIndexOf('#');
      if (hashIndex > -1) {
        displayName = fullName.substring(0, hashIndex);
        tag = fullName.substring(hashIndex + 1);
      }
      
      const teamDisplayName = team.displayName || displayName;
      
      return {
        ...team,
        creatorName: creator ? creator.username : '未知',
        memberCount,
        description: team.description || '一个专注于守望先锋的战队',
        displayName: teamDisplayName,
        tag: tag || '0000'
      };
    });
    
    teams.value = processedTeams;
    filteredTeams.value = [...processedTeams];
    sortTeams();
    
  } catch (error) {
    console.error('加载战队列表失败:', error);
    message.value = '加载战队列表失败，请刷新重试';
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

// 过滤战队
const filterTeams = () => {
  if (!searchQuery.value.trim()) {
    filteredTeams.value = [...teams.value];
  } else {
    const query = searchQuery.value.toLowerCase().trim();
    filteredTeams.value = teams.value.filter(team => 
      team.name.toLowerCase().includes(query) || 
      team.tag.toLowerCase().includes(query) ||
      (team.description && team.description.toLowerCase().includes(query))
    );
  }
  sortTeams();
};

// 排序战队
const sortTeams = () => {
  const sorted = [...filteredTeams.value];
  
  switch (sortBy.value) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'nameDesc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'members':
      sorted.sort((a, b) => b.memberCount - a.memberCount);
      break;
    case 'membersAsc':
      sorted.sort((a, b) => a.memberCount - b.memberCount);
      break;
    case 'date':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'dateDesc':
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  filteredTeams.value = sorted;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  } catch (error) {
    return '日期格式错误';
  }
};

// 获取职责显示名称
const getRoleDisplayName = (role) => {
  const roleMap = {
    'heavy': '重装',
    'damage': '输出',
    'support': '支援',
    'flexible': '灵活'
  };
  return roleMap[role] || '未知';
};

// 显示加入确认模态框
const showJoinConfirm = (team) => {
  selectedTeam.value = team;
  showJoinModal.value = true;
  joinMessage.value = '';
  isJoinError.value = false;
};

// 关闭加入模态框
const closeJoinModal = () => {
  showJoinModal.value = false;
  selectedTeam.value = null;
  joinMessage.value = '';
  joiningTeamId.value = null;
};

// 确认加入战队
const confirmJoinTeam = async () => {
  if (!selectedTeam.value) return;
  
  const currentUser = authStore.currentUser;
  if (!currentUser) {
    joinMessage.value = '用户未登录';
    isJoinError.value = true;
    return;
  }
  
  joiningTeamId.value = selectedTeam.value.id;
  
  try {
    const fullTeamName = selectedTeam.value.name;
    const result = teamService.joinTeam(fullTeamName, currentUser.id);
    
    if (result.success) {
      joinMessage.value = '成功加入战队！';
      isJoinError.value = false;
      
      closeJoinModal();
      loadTeams();
      message.value = '已成功加入战队，正在返回用户面板...';
      isError.value = false;
      window.location.hash = 'user';
    } else {
      joinMessage.value = result.message || '加入战队失败';
      isJoinError.value = true;
      joiningTeamId.value = null;
    }
  } catch (error) {
    console.error('加入战队失败:', error);
    joinMessage.value = '加入战队失败，请重试';
    isJoinError.value = true;
    joiningTeamId.value = null;
  }
};

// 显示战队详情
const showTeamDetails = async (team) => {
  selectedTeam.value = team;
  
  try {
    const users = userService.getAllUsers();
    const members = users.filter(user => user.teamId === team.id);
    teamMembers.value = members;
    
    showDetailsModal.value = true;
  } catch (error) {
    console.error('加载战队详情失败:', error);
    message.value = '加载战队详情失败';
    isError.value = true;
  }
};

// 关闭详情模态框
const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedTeam.value = null;
  teamMembers.value = [];
};

// 从详情模态框显示加入确认（修复：先保存引用再关闭）
const showJoinConfirmFromDetails = () => {
  const team = selectedTeam.value;
  closeDetailsModal();
  if (team) {
    showJoinConfirm(team);
  }
};

// 导航函数
const goBack = () => {
  window.location.hash = 'user';
};

const goToCreateTeam = () => {
  window.location.hash = 'user';
};

// 初始化
onMounted(() => {
  const currentUser = authStore.currentUser;
  if (!currentUser) {
    message.value = '请先登录';
    isError.value = true;
    window.location.hash = '';
    return;
  }
  
  loadTeams();
});
</script>

<style scoped>
.join-team-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.page-container {
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.page-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.page-subtitle {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 30px;
  text-align: center;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.search-box {
  display: flex;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #007bff;
  border-radius: 8px 0 0 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #0056b3;
}

.search-button {
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  border: 2px solid #007bff;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.search-button:hover {
  background-color: #0056b3;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-label {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #6c757d;
  border-radius: 6px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.9rem;
  background-color: white;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: #007bff;
}

.teams-container {
  margin-bottom: 40px;
}

.loading-message {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-teams-message {
  text-align: center;
  padding: 60px 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.no-teams-message p {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  color: #6c757d;
  margin-bottom: 20px;
}

.create-team-button {
  padding: 12px 24px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-team-button:hover {
  background-color: #218838;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.team-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.team-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #007bff;
}

.team-card.full-team {
  border-color: #dc3545;
  opacity: 0.8;
}

.team-card.full-team:hover {
  border-color: #dc3545;
  transform: none;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f3f5;
}

.team-name {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.team-tag {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 4px 10px;
  border-radius: 20px;
}

.team-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  margin-bottom: 10px;
  font-family: 'SmileySans Oblique', sans-serif;
}

.info-label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
}

.info-value {
  color: #6c757d;
  flex: 1;
}

.full-badge {
  display: inline-block;
  background-color: #dc3545;
  color: white;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.team-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.join-button,
.full-button,
.already-member-button,
.details-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.join-button {
  background-color: #007bff;
  color: white;
}

.join-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.join-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.full-button {
  background-color: #dc3545;
  color: white;
  cursor: not-allowed;
}

.already-member-button {
  background-color: #28a745;
  color: white;
  cursor: not-allowed;
}

.details-button {
  background-color: #6c757d;
  color: white;
}

.details-button:hover {
  background-color: #545b62;
}

.button-loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.page-actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #f1f3f5;
}

.back-button {
  padding: 12px 30px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #545b62;
}

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

.modal-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.modal-info p {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  color: #495057;
  margin-bottom: 10px;
}

.modal-info ul {
  margin-left: 20px;
  margin-bottom: 15px;
}

.modal-info li {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.95rem;
  color: #495057;
  margin-bottom: 5px;
}

.warning-text {
  color: #dc3545;
  font-weight: 600;
}

.team-details-modal {
  max-width: 600px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f3f5;
}

.detail-header h4 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.detail-status {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.9rem;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.detail-status.full {
  background-color: #dc3545;
  color: white;
}

.detail-status:not(.full) {
  background-color: #28a745;
  color: white;
}

.detail-info {
  margin-bottom: 25px;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  font-family: 'SmileySans Oblique', sans-serif;
}

.detail-label {
  font-weight: 600;
  color: #495057;
  min-width: 100px;
}

.detail-value {
  color: #6c757d;
  flex: 1;
}

.detail-members {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f1f3f5;
}

.detail-members h5 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;
}

.no-members {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.no-members p {
  font-family: 'SmileySans Oblique', sans-serif;
  color: #6c757d;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.member-name {
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  color: #495057;
}

.member-role {
  font-family: 'SmileySans Oblique', sans-serif;
  color: #6c757d;
  background-color: #e9ecef;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
}

.modal-button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.cancel-button:hover {
  background-color: #545b62;
}

.confirm-button {
  background-color: #007bff;
  color: white;
}

.confirm-button:hover {
  background-color: #0056b3;
}

.message {
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  text-align: center;
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

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .page-container {
    padding: 25px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .modal-content {
    padding: 20px;
    width: 95%;
  }
}
</style>

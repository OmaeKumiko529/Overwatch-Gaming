<template>
  <div class="team-tab">
    <div v-if="team" class="team-card">
      <div class="team-header">
        <div class="team-name-section">
          <h3 class="team-name">{{ team.name }}</h3>
          <span class="team-id">#{{ team.id }}</span>
        </div>
        <div class="team-stats">
          <div class="team-stat">
            <span class="team-stat-value">{{ members.length }}/6</span>
            <span class="team-stat-label">成员数</span>
          </div>
          <div class="team-stat">
            <span class="team-stat-value">{{ formatDate(team.createdAt) }}</span>
            <span class="team-stat-label">创建时间</span>
          </div>
        </div>
      </div>

      <!-- 成员网格 -->
      <div class="members-section">
        <h4 class="section-title">战队成员</h4>
        <div class="members-grid">
          <div
            v-for="member in members"
            :key="member.id"
            class="member-card"
            @click="handleMemberClick(member.id)"
          >
            <div class="member-avatar">
              <img :src="member.avatar || '/Head.png'" :alt="member.username" @error="onAvatarError" />
            </div>
            <div class="member-name">{{ member.username }}</div>
            <div class="member-badges">
              <span v-if="member.id === team.creatorId" class="badge creator">创建者</span>
              <span v-else-if="member.id === currentUserId" class="badge self">您</span>
            </div>
            <div class="member-roles">
              <template v-if="Array.isArray(member.role) && member.role.includes('flexible')">
                <div class="flexible-icons-row">
                  <img src="/96px-职责：重装_图标.webp" alt="重装" class="mini-icon" />
                  <img src="/96px-职责：输出_图标.webp" alt="输出" class="mini-icon" />
                  <img src="/96px-职责：支援_图标.webp" alt="支援" class="mini-icon" />
                </div>
                <span class="role-label">灵活</span>
              </template>
              <template v-else-if="Array.isArray(member.role)">
                <div class="role-chips">
                  <span
                    v-for="r in member.role"
                    :key="r"
                    class="role-chip"
                    :class="'role-' + r"
                  >{{ roleDisplayName(r) }}</span>
                </div>
              </template>
              <template v-else>
                <span class="role-chip" :class="'role-' + member.role">{{ roleDisplayName(member.role) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 - 仅自己 -->
      <div class="team-actions" v-if="isOwner">
        <button class="action-btn leave-btn" @click="$emit('leave-team')">
          <span class="btn-icon">🚪</span>
          <span>退出战队</span>
        </button>
      </div>
    </div>

    <!-- 未加入战队 -->
    <div v-else class="no-team-card">
      <div class="no-team-icon">🏆</div>
      <p class="no-team-text">{{ isOwner ? '您尚未加入任何战队' : '该用户尚未加入任何战队' }}</p>
      <div class="no-team-actions" v-if="isOwner">
        <button class="action-btn primary-btn" @click="$emit('create-team')">
          <span class="btn-icon">🏆</span>
          <span>创建战队</span>
        </button>
        <button class="action-btn outline-btn" @click="$emit('join-team')">
          <span class="btn-icon">➕</span>
          <span>加入战队</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  team: { type: Object, default: null },
  members: { type: Array, default: () => [] },
  currentUserId: { type: String, default: '' },
  isOwner: { type: Boolean, default: false }
})

const emit = defineEmits(['leave-team', 'create-team', 'join-team', 'member-click'])

const ROLE_DISPLAY_NAMES = {
  'heavy': '重装',
  'damage': '输出',
  'support': '支援',
  'flexible': '灵活'
}

function roleDisplayName(role) {
  if (Array.isArray(role)) {
    return role.map(r => ROLE_DISPLAY_NAMES[r] || r).join('、')
  }
  return ROLE_DISPLAY_NAMES[role] || '未知'
}

function formatDate(dateString) {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleDateString('zh-CN')
  } catch {
    return '未知'
  }
}

function handleMemberClick(id) {
  emit('member-click', id)
}

function onAvatarError(e) {
  e.target.src = '/Head.png'
}
</script>

<style scoped>
.team-tab {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 0;
}

.team-card, .no-team-card {
  background: #fff;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #667eea;
}

.team-name-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.team-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.team-id {
  font-size: 0.85rem;
  color: #6c757d;
}

.team-stats {
  display: flex;
  gap: 20px;
}

.team-stat {
  text-align: center;
}

.team-stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #667eea;
}

.team-stat-label {
  font-size: 0.8rem;
  color: #6c757d;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 16px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.member-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 18px 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: #667eea;
}

.member-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
  background: #e9ecef;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.member-card:hover .member-avatar img {
  border-color: #667eea;
}

.member-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.member-badges {
  margin-bottom: 6px;
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.badge.creator {
  background: #e8eaff;
  color: #667eea;
}

.badge.self {
  background: #d4edda;
  color: #28a745;
}

.member-roles {
  margin-top: 4px;
}

.role-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.role-chip {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.role-heavy { background: rgba(255,193,7,0.15); color: #856404; border: 1px solid #ffc107; }
.role-damage { background: rgba(220,53,69,0.15); color: #721c24; border: 1px solid #dc3545; }
.role-support { background: rgba(40,167,69,0.15); color: #155724; border: 1px solid #28a745; }
.role-flexible { background: rgba(108,117,125,0.15); color: #495057; border: 1px solid #6c757d; }

.flexible-icons-row {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-bottom: 2px;
}

.mini-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.role-label {
  font-size: 0.8rem;
  color: #6c757d;
}

.team-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon {
  font-size: 1.2rem;
}

.leave-btn {
  background: rgba(220,53,69,0.08);
  border: 2px solid #dc3545;
  color: #dc3545;
}

.leave-btn:hover {
  background: #dc3545;
  color: white;
}

.no-team-card {
  text-align: center;
  padding: 60px 24px;
}

.no-team-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.no-team-text {
  font-size: 1.2rem;
  color: #6c757d;
  margin-bottom: 24px;
}

.no-team-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.outline-btn {
  background: rgba(102, 126, 234, 0.08);
  border: 2px solid #667eea;
  color: #667eea;
}

.outline-btn:hover {
  background: #667eea;
  color: white;
}
</style>
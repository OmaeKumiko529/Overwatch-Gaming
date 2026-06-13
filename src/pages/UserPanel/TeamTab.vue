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
              <img :src="member.avatar || '/default-avatar.png'" :alt="member.username" @error="onAvatarError" />
            </div>
            <div class="member-name">{{ member.displayName || member.username }}</div>
            <div class="member-badges">
              <span v-if="member.id === team.creatorId" class="badge creator">创建者</span>
              <span v-else-if="member.id === currentUserId" class="badge self">您</span>
            </div>
            <div class="member-roles">
              <template v-if="Array.isArray(member.role) && member.role.includes('flexible')">
                <div class="flexible-icons-row">
                  <img src="/role-icon-tank.webp" alt="重装" class="mini-icon" />
                  <img src="/role-icon-damage.webp" alt="输出" class="mini-icon" />
                  <img src="/role-icon-support.webp" alt="支援" class="mini-icon" />
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

      <div class="team-actions" v-if="isOwner">
        <button class="action-btn leave-btn" @click="$emit('leave-team')">
          <span class="btn-icon">🚪</span>
          <span>退出战队</span>
        </button>
      </div>
    </div>

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
  e.target.src = '/default-avatar.png'
}
</script>

<style scoped>
.team-tab {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 0;
}

.team-card, .no-team-card {
  background: #1a1a2e;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid #2a2a4a;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #4facfe;
}

.team-name-section {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.team-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: #4facfe;
  margin: 0;
}

.team-id {
  font-size: 0.85rem;
  color: #a0aec0;
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
  color: #4facfe;
}

.team-stat-label {
  font-size: 0.8rem;
  color: #a0aec0;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 16px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.member-card {
  background: #252545;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 18px 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  border-color: #4facfe;
}

.member-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
  background: #353739;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.member-card:hover .member-avatar img {
  border-color: #4facfe;
}

.member-name {
  font-weight: 600;
  color: #e0e0e0;
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
  background: #252545;
  color: #4facfe;
}

.badge.self {
  background: #0a3a0a;
  color: #22c55e;
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

.role-heavy { background: rgba(255,193,7,0.15); color: #ffc107; border: 1px solid #ffc107; }
.role-damage { background: rgba(220,53,69,0.15); color: #ef4444; border: 1px solid #ef4444; }
.role-support { background: rgba(40,167,69,0.15); color: #22c55e; border: 1px solid #22c55e; }
.role-flexible { background: rgba(108,117,125,0.15); color: #a0aec0; border: 1px solid #6c757d; }

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
  color: #a0aec0;
}

.team-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #2a2a4a;
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
  background: rgba(220,53,69,0.15);
  border: 2px solid #ef4444;
  color: #ef4444;
}

.leave-btn:hover {
  background: #ef4444;
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
  color: #a0aec0;
  margin-bottom: 24px;
}

.no-team-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.primary-btn {
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: #ffffff;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79,172,254,0.3);
}

.outline-btn {
  background: rgba(79,172,254,0.1);
  border: 2px solid #4facfe;
  color: #4facfe;
}

.outline-btn:hover {
  background: #4facfe;
  color: #ffffff;
}
</style>

// 用户等级映射表
export const USERRANK_MAP = {
  0: { key: 'visitor', label: 'Visitor', cn: '游客', icon: '👤', color: '#6c757d' },
  1: { key: 'player', label: 'Player', cn: '玩家', icon: '🎮', color: '#4facfe' },
  2: { key: 'trusted_player', label: 'Trusted Player', cn: '信任玩家', icon: '⭐', color: '#28a745' },
  3: { key: 'op', label: 'OP', cn: '管理员', icon: '🛡️', color: '#dc3545' }
}

// 帖子标记映射表
export const POSTRANK_MAP = {
  'FF': { key: 'red', label: 'Warned', cn: '受警告内容', color: '#dc3545', icon: '', bg: '#fff5f5', border: '#dc3545' },
  '69': { key: 'blue', label: 'Normal', cn: '', color: '#4facfe', icon: '', bg: '#f0f8ff', border: '#4facfe' },
  '78': { key: 'green', label: 'Featured', cn: '精华内容', color: '#28a745', icon: '', bg: '#f0fff4', border: '#28a745' },
  '00': { key: 'black', label: 'Banned', cn: '封禁内容', color: '#212529', icon: '', bg: '#f8f9fa', border: '#212529' }
}

// 获取用户等级信息
export function getUserRankInfo(userrank = 0) {
  return USERRANK_MAP[userrank] || USERRANK_MAP[0]
}

// 获取帖子标记信息
export function getPostRankInfo(postrank = '69') {
  return POSTRANK_MAP[postrank] || POSTRANK_MAP['69']
}

// 检查是否有权限执行操作
export function canCommentOnPost(userrank = 0, postrank = '69') {
  if (postrank === '69' || postrank === '78') return true // 蓝帖/绿帖 所有人可评论
  if (postrank === 'FF') return userrank >= 1              // 红帖 player+
  if (postrank === '00') return userrank >= 3              // 黑帖 op+
  return true
}

// 检查是否有权限查看帖子内容
export function canViewPostContent(userrank = 0, postrank = '69') {
  if (postrank === '00') return userrank >= 2  // 黑帖 trusted_player+
  return true                                   // 其他帖所有人可看
}

export default { USERRANK_MAP, POSTRANK_MAP, getUserRankInfo, getPostRankInfo, canCommentOnPost, canViewPostContent }
<template>
  <div class="post-detail page-enter-active">
    <div class="post-detail-container">
      <button class="back-button" @click="goBack">
        <span class="button-icon">←</span>
        <span class="button-text">返回</span>
      </button>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载帖子中...</p>
      </div>

      <div v-else-if="!post" class="not-found-container">
        <h1 class="not-found-title">帖子不存在</h1>
        <p class="not-found-message">您访问的帖子可能已被删除或不存在。</p>
        <button class="home-button" @click="goHome">
          <span class="button-icon">🏠</span>
          <span class="button-text">返回首页</span>
        </button>
      </div>

      <div v-else class="post-content">
        <div class="post-header">
          <div v-if="post.postrank && post.postrank !== '69'" class="post-rank-badge" :style="{ backgroundColor: postRankInfo.color, color: 'white' }">
            {{ postRankInfo.cn }}
          </div>
          <div class="post-pid">PID: {{ post.pid }}</div>
          <div class="post-date">{{ formatDate(post.createdAt) }}</div>
        </div>

        <h1 class="post-title">{{ post.title }}</h1>

        <div class="author-info">
          <div class="author-avatar">
            <img :src="getUserAvatar(post.userId)" :alt="post.username" class="avatar-image" @error="handleAvatarError" />
          </div>
          <div class="author-details">
            <div class="author-name">
              <userrankBadge :userId="post.userId" />
              <span class="author-username">{{ post.username }}</span>
              <button v-if="post.userId" class="view-profile-button" @click="viewUserProfile(post.userId)">查看个人资料</button>
            </div>
            <div class="post-meta">发布于 {{ formatRelativeTime(post.createdAt) }}</div>
          </div>
        </div>

        <div v-if="canViewContent" class="post-body">
          <div class="post-text" v-html="formatPostContent(post.content)"></div>
        </div>
        <div v-else class="post-body restricted">
          <div class="restricted-message">
            <span class="restricted-icon">🚫</span>
            <p>该帖子已被标记为黑帖，您的等级不足以查看详细内容。</p>
            <p class="restricted-hint">需要 <strong>信任玩家</strong> 或更高等级。</p>
          </div>
        </div>

        <div v-if="post.mentions && post.mentions.length > 0" class="post-mentions">
          <h3 class="post-mentions-title"><span class="post-mentions-icon">@</span> 提及的用户</h3>
          <div class="post-mentions-list">
            <div v-for="mention in post.mentions" :key="mention.userId" class="post-mention-item">
              <img :src="getUserAvatar(mention.userId)" :alt="mention.username" class="post-mention-avatar" @error="handleAvatarError" />
              <span class="post-mention-name">@{{ mention.username }}</span>
              <button class="post-mention-profile-button" @click="viewUserProfile(mention.userId)">查看资料</button>
            </div>
          </div>
        </div>

        <div class="post-stats">
          <div class="stat-item"><span class="stat-icon">❤️</span><span class="stat-value">{{ post.likes }}</span><span class="stat-label">点赞</span></div>
          <div class="stat-item"><span class="stat-icon">👁️</span><span class="stat-value">{{ post.views || 0 }}</span><span class="stat-label">浏览</span></div>
          <div class="stat-item"><span class="stat-icon">💬</span><span class="stat-value">{{ childPosts.length }}</span><span class="stat-label">评论</span></div>
          <div v-if="post.mentions && post.mentions.length > 0" class="stat-item"><span class="stat-icon">@</span><span class="stat-value">{{ post.mentions.length }}</span><span class="stat-label">提及</span></div>
        </div>

        <div class="post-actions">
          <button class="action-button like-button" :class="{ 'liked': isLiked }" @click="toggleLike"><span class="button-icon">{{ isLiked ? '❤️' : '🤍' }}</span><span class="button-text">{{ isLiked ? '已点赞' : '点赞' }}</span></button>
          <button v-if="canComment" class="action-button comment-button" @click="focusCommentInput"><span class="button-icon">💬</span><span class="button-text">评论</span></button>
          <button v-if="isPostAuthor" class="action-button delete-button" @click="deletePost"><span class="button-icon">🗑️</span><span class="button-text">删除</span></button>
          <button v-if="auth.isAdmin" class="action-button rank-button" @click="showRankMenu = !showRankMenu"><span class="button-icon">🏷️</span><span class="button-text">标记</span></button>
        </div>

        <div v-if="showRankMenu && auth.isAdmin" class="rank-select-menu">
          <button v-for="(info, key) in rankOptions" :key="key" class="rank-option" :class="{ active: post.postrank === key }" :style="{ borderLeft: `4px solid ${info.color}` }" @click="setPostRank(key)">{{ info.icon }} {{ info.cn }}</button>
        </div>

        <div v-if="isComment && parentPost" class="parent-post-section">
          <h3 class="parent-post-title"><span class="parent-post-icon">↶</span> 对以下帖子的回复</h3>
          <div class="parent-post-card">
            <div class="parent-post-header">
              <div class="parent-post-rank" :style="{ color: getPostRankInfoFor(parentPost).color }">{{ getPostRankInfoFor(parentPost).icon }} {{ getPostRankInfoFor(parentPost).cn }}</div>
              <div class="parent-post-pid">PID: {{ parentPost.pid }}</div>
              <div class="parent-post-date">{{ formatDate(parentPost.createdAt) }}</div>
            </div>
            <h4 class="parent-post-title-text">{{ parentPost.title }}</h4>
            <div class="parent-post-author">
              <div class="parent-post-avatar"><img :src="getUserAvatar(parentPost.userId)" :alt="parentPost.username" class="avatar-image-small" @error="handleAvatarError" /></div>
              <div class="parent-post-author-info"><span class="parent-post-author-name">{{ parentPost.username }}</span><span class="parent-post-time">{{ formatRelativeTime(parentPost.createdAt) }}</span></div>
            </div>
            <div class="parent-post-content-preview">{{ getPlainTextPreview(parentPost.content, 150) }}</div>
            <div class="parent-post-actions"><button class="parent-post-view-button" @click="goToParentPost(parentPost.pid)">查看原帖</button></div>
          </div>
        </div>

        <div class="comments-section">
          <h3 class="comments-title">评论 ({{ childPosts.length }})</h3>

          <div v-if="canComment" class="add-comment">
            <div v-if="replyToUsername" class="reply-to-hint">回复 <strong>{{ replyToUsername }}</strong> <button class="cancel-reply-btn" @click="cancelReply">取消回复</button></div>
            <textarea v-model="newComment" :placeholder="replyToUsername ? `回复 ${replyToUsername}...` : commentPlaceholder" class="comment-input" rows="3" @keydown.enter.exact.prevent="addComment"></textarea>
            <div class="comment-actions"><button class="submit-comment-button" :disabled="!newComment.trim()" @click="addComment">发布评论</button></div>
          </div>
          <div v-else class="add-comment restricted"><p class="restricted-comment-hint">{{ commentRestrictedHint }}</p></div>

          <div v-if="childPosts.length > 0" class="comments-list waterfall-layout">
            <div v-for="childPost in childPosts" :key="childPost.id" class="comment-item waterfall-item">
              <div class="comment-header">
                <div class="comment-author">
                  <div class="comment-avatar"><img :src="getUserAvatar(childPost.userId)" :alt="childPost.username" class="avatar-image-tiny" @error="handleAvatarError" /></div>
                  <div class="comment-author-info"><span class="comment-author-name">{{ childPost.username }}</span><span class="comment-time">{{ formatRelativeTime(childPost.createdAt) }}</span></div>
                </div>
                <button v-if="isCommentAuthor(childPost) || isPostAuthor" class="comment-action-btn danger" @click="deleteComment(childPost.pid)">🗑️ 删除</button>
              </div>
              <div class="comment-content" v-html="formatCommentContent(childPost.content)"></div>
              <div class="comment-footer">
                <button class="comment-action-btn" :class="{ 'liked': likedComments[childPost.pid] }" @click="likeComment(childPost.pid)"><span>{{ likedComments[childPost.pid] ? '❤️' : '🤍' }}</span><span>{{ commentLikes[childPost.pid] ?? childPost.likes ?? 0 }}</span></button>
                <button class="comment-action-btn" @click="replyToComment(childPost.pid, childPost.username)">💬 回复</button>
              </div>
              <div class="comment-pid" v-if="childPost.pid"><small>PID: {{ childPost.pid }}</small></div>
            </div>
          </div>
          <div v-else class="no-comments"><p>还没有评论，快来抢沙发吧！</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { usePostStore } from '../stores/post.js';
import { getPostRankInfo, canViewPostContent, canCommentOnPost } from '../constants/rankMap.js';
import pop from '../utils/pop.js';
import postService from '../services/post.js';
import { authApi } from '../services/api.js';
import { decodeParam, encodePid, buildRouterLinkUser, buildRouterLinkPost } from '../utils/encode.js';
import { processContent } from '../utils/contentFilter.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const postStore = usePostStore();

const pid = computed(() => decodeParam(route.params.pid));
const post = ref(null);
const parentPost = ref(null);
const childPosts = ref([]);
const loading = ref(true);
const newComment = ref('');
const isLiked = ref(false);
const showRankMenu = ref(false);
const likeLoading = ref(false);
const commentLikeLoading = ref({});
const replyToPid = ref(null);
const replyToUsername = ref('');

const rankOptions = {
  'FF': { icon: '', cn: '受警告内容', color: '#dc3545' },
  '69': { icon: '', cn: '一般帖子', color: '#4facfe' },
  '78': { icon: '', cn: '精华内容', color: '#28a745' },
  '00': { icon: '', cn: '封禁内容', color: '#212529' }
}

function extractRootPid(context) { if (!context) return null; const m = context.match(/p-\d{8}-\d{4}-\d{2}/); return m ? m[0] : null }
function extractParentContext(context) { if (!context) return null; const i = context.lastIndexOf('/'); if (i <= 1) return null; return context.substring(0, i) }

const postRankInfo = computed(() => getPostRankInfo(post.value?.postrank))
const canViewContent = computed(() => { if (!post.value) return false; const m = '[该帖子已被标记为黑帖，您没有权限查看内容]'; return post.value.content && post.value.content !== m })
const canComment = computed(() => { return post.value && canCommentOnPost(auth.userrank, post.value.postrank) && auth.isLoggedIn })
const commentPlaceholder = computed(() => { if (!auth.isLoggedIn) return '请先登录后评论'; if (post.value?.postrank === 'FF') return '评论此红帖需要玩家及以上等级'; if (post.value?.postrank === '00') return '评论此黑帖需要管理员等级'; return '写下您的评论...' })
const commentRestrictedHint = computed(() => { if (!auth.isLoggedIn) return '请先登录后评论。'; if (post.value?.postrank === 'FF') return '红帖仅允许玩家及以上等级的用户评论。'; if (post.value?.postrank === '00') return '黑帖仅允许管理员评论。'; return '' })

const avatarCache = ref({});
const getUserAvatar = (userId) => { if (!userId) return '/Head.png'; if (avatarCache.value[userId]) return avatarCache.value[userId]; return '/Head.png' }
const loadUserAvatar = async (userId) => { if (!userId || avatarCache.value[userId]) return; try { const r = await authApi.getUserById(userId); if (r.success && r.user?.avatar) avatarCache.value[userId] = r.user.avatar } catch {} }
const handleAvatarError = (e) => { e.target.src = '/Head.png' }

const likedComments = ref({});
const commentLikes = ref({});
const isComment = computed(() => post.value && post.value.context && post.value.context !== `#/${post.value.pid}`)
const isPostAuthor = computed(() => auth.currentUser && post.value && Number(auth.currentUser.id) === Number(post.value.userId))
function getPostRankInfoFor(p) { return getPostRankInfo(p?.postrank) }

const loadPostDetail = async () => {
  loading.value = true; parentPost.value = null; showRankMenu.value = false
  try {
    const foundPost = await postService.getPostByPid(pid.value)
    if (foundPost) {
      post.value = foundPost; isLiked.value = false; likedComments.value = {}; commentLikes.value = {}
      postService.incrementView(pid.value)
      if (foundPost.userId) loadUserAvatar(foundPost.userId)
      if (foundPost.mentions) foundPost.mentions.forEach(m => loadUserAvatar(m.userId))
      childPosts.value = foundPost.childPosts || []
      isLiked.value = foundPost.isLikedByUser || false
      childPosts.value.forEach(c => { commentLikes.value[c.pid] = c.likes || 0; likedComments.value[c.pid] = c.isLikedByUser || false; if (c.userId) loadUserAvatar(c.userId) })
      if (isComment.value) {
        const pc = extractParentContext(post.value.context)
        if (pc) { const rp = extractRootPid(pc); if (rp) { parentPost.value = await postService.getPostByPid(rp); if (parentPost.value?.userId) loadUserAvatar(parentPost.value.userId) } }
      }
    } else { post.value = null; childPosts.value = [] }
  } catch (error) { console.error('加载帖子失败:', error); pop.toast('加载帖子失败，请重试', 'error') }
  finally { loading.value = false }
}

const formatPostContent = (content) => { return content ? processContent(content) : '' }
const getPlainTextPreview = (html, max = 150) => { if (!html) return ''; let t = html; if (t.includes('<') && t.includes('>')) t = t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '); if (t.length > max) return t.substring(0, max) + '...'; return t }
const formatCommentContent = (content) => { return content ? processContent(content) : '' }
const formatDate = (d) => { if (!d) return '未知'; try { return new Date(d).toLocaleString('zh-CN') } catch { return '日期格式错误' } }
const formatRelativeTime = (d) => { if (!d) return '未知'; try { const dt = new Date(d); const n = new Date(); const s = Math.floor((n - dt) / 1000); if (s < 60) return '刚刚'; if (s < 3600) return `${Math.floor(s/60)}分钟前`; if (s < 86400) return `${Math.floor(s/3600)}小时前`; if (s < 604800) return `${Math.floor(s/86400)}天前`; return formatDate(d) } catch { return '未知时间' } }
const goBack = () => router.go(-1)
const goHome = () => router.push({ name: 'Home' })
const viewUserProfile = (userId) => { authApi.getUserById(userId).then(r => { if (r.success && r.user?.uid) router.push(buildRouterLinkUser(r.user.uid)) }).catch(() => router.push('/user/' + encodeURIComponent(String(userId)))) }

const toggleLike = async () => {
  if (!auth.isLoggedIn) { pop.toast('请先登录', 'error'); return }
  if (likeLoading.value) return; likeLoading.value = true
  if (!isLiked.value) { const r = await postService.likePost(pid.value); if (r.success) { isLiked.value = true; post.value.likes = r.likes; pop.toast('点赞成功', 'success') } else pop.toast(r.message || '点赞失败', 'error') }
  else { const r = await postService.unlikePost(pid.value); if (r.success) { isLiked.value = false; post.value.likes = r.likes; pop.toast('已取消点赞', 'info') } else pop.toast(r.message || '取消点赞失败', 'error') }
  likeLoading.value = false
}

const focusCommentInput = () => { document.querySelector('.comment-input')?.focus() }
function cancelReply() { replyToPid.value = null; replyToUsername.value = ''; newComment.value = '' }

const addComment = async () => {
  if (!auth.isLoggedIn) { pop.toast('请先登录', 'error'); return }
  if (!newComment.value.trim()) { pop.toast('评论内容不能为空', 'error'); return }
  if (!auth.currentUser) { pop.toast('用户信息获取失败', 'error'); return }
  const targetPid = replyToPid.value || pid.value
  try {
    const r = await postService.addComment(targetPid, newComment.value.trim(), auth.currentUser.id, auth.currentUser.username)
    if (r.success) {
      if (replyToPid.value) await loadPostDetail(); else childPosts.value.unshift(r.comment)
      replyToPid.value = null; replyToUsername.value = ''; newComment.value = ''
      pop.toast('评论发布成功', 'success')
    } else pop.toast(r.message || '评论失败', 'error')
  } catch (error) { console.error('评论失败:', error); pop.toast('评论失败，请重试', 'error') }
}

const isCommentAuthor = (c) => auth.currentUser && Number(c.userId) === Number(auth.currentUser.id)

const likeComment = async (commentPid) => {
  if (!auth.isLoggedIn) { pop.toast('请先登录', 'error'); return }
  if (commentLikeLoading.value[commentPid]) return; commentLikeLoading.value[commentPid] = true
  try {
    const w = likedComments.value[commentPid] || false
    const r = w ? await postService.unlikePost(commentPid) : await postService.likePost(commentPid)
    if (r.success) { likedComments.value[commentPid] = !w; commentLikes.value[commentPid] = r.likes; pop.toast(!w ? '点赞成功' : '已取消点赞', 'success') }
    else pop.toast(r.message || '操作失败', 'error')
  } catch { pop.toast('操作失败，请重试', 'error') }
  commentLikeLoading.value[commentPid] = false
}

const replyToComment = (cid, uname) => {
  if (!auth.isLoggedIn) { pop.toast('请先登录', 'error'); return }
  replyToPid.value = cid; replyToUsername.value = uname; newComment.value = `@${uname} `
  document.querySelector('.comment-input')?.focus()
  setTimeout(() => document.querySelector('.comment-input')?.setSelectionRange(newComment.value.length, newComment.value.length), 0)
}

const deleteComment = async (commentPid) => {
  if (!await pop.confirm('确定要删除这条评论吗？')) return
  try {
    const r = await postService.deleteComment(commentPid, auth.currentUser?.id)
    if (r.success) { const i = childPosts.value.findIndex(c => c.pid === commentPid); if (i !== -1) childPosts.value.splice(i, 1); pop.toast('评论删除成功', 'success') }
    else pop.toast(r.message || '删除失败', 'error')
  } catch { pop.toast('删除失败，请重试', 'error') }
}

const deletePost = async () => {
  if (!await pop.confirm('确定要删除这篇帖子吗？此操作不可撤销。', '', { icon: 'warning' })) return
  const r = await postService.deletePost(pid.value, auth.currentUser?.id)
  if (r.success) { pop.toast('帖子删除成功', 'success'); setTimeout(() => router.push({ name: 'Home' }), 1500) }
  else pop.toast(r.message || '删除失败', 'error')
}

const setPostRank = async (newRank) => {
  const r = await postService.setPostRank(pid.value, newRank)
  if (r.success) { post.value.postrank = newRank; showRankMenu.value = false; pop.toast(`帖子标记已更新为 ${rankOptions[newRank]?.cn}`, 'success') }
  else pop.toast(r.message || '设置标记失败', 'error')
}

const goToParentPost = (parentPid) => router.push(buildRouterLinkPost(parentPid))
onMounted(() => loadPostDetail())
</script>

<style scoped>
.post-detail {
  min-height: 100vh;
  background: radial-gradient(ellipse at 20% 50%, rgba(79,172,254,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(118,75,162,0.15) 0%, transparent 50%), linear-gradient(135deg, #0a1628 0%, #16203a 40%, #1a1a2e 70%, #0d1117 100%);
  padding: 76px 20px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.post-detail-container {
  background: #1a1a2e;
  border-radius: 20px;
  padding: 76px 40px 40px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  position: relative;
  border: 1px solid #2a2a4a;
}

.back-button {
  position: absolute; top: 20px; left: 20px; padding: 6px 16px;
  background: #252545; border: 1px solid #2a2a4a; border-radius: 100px;
  font-family: 'MapleMono CN Regular', monospace; font-size: 0.85rem;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.25s ease; color: #a0aec0;
}
.back-button:hover { background: #3a3a6a; transform: translateX(-4px); color: #4facfe; border-color: #4facfe; }
.back-button .button-icon { display: inline-block; transition: transform 0.25s ease; }
.back-button:hover .button-icon { transform: translateX(-2px); }

.loading-container { text-align: center; padding: 80px 0; color: #6c757d; }
.loading-spinner { width: 48px; height: 48px; border-radius: 50%; background: conic-gradient(from 0deg, #4facfe, #667eea, #4facfe); mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #fff calc(100% - 5px)); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #fff calc(100% - 5px)); animation: spin 0.8s linear infinite; margin: 0 auto 18px; }
@keyframes spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
.loading-container p { font-family: 'MapleMono CN Regular', monospace; font-size: 1rem; color: #6c757d; }

.not-found-container { text-align: center; padding: 80px 0; }
.not-found-title { font-family: 'SmileySans Oblique', sans-serif; font-size: 2rem; color: #dc3545; margin-bottom: 16px; }
.not-found-message { font-size: 1.1rem; color: #6c757d; margin-bottom: 32px; }
.home-button { padding: 12px 28px; background: linear-gradient(135deg, #4facfe, #667eea); color: white; border: none; border-radius: 100px; font-family: 'MapleMono CN Regular', monospace; font-weight: 600; font-size: 1rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(79,172,254,0.25); }
.home-button:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(79,172,254,0.35); }

.post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #2a2a4a; flex-wrap: wrap; }
.post-rank-badge { position: relative; font-family: 'MapleMono CN Regular', monospace; font-size: 0.85rem; font-weight: 700; padding: 5px 16px; border-radius: 100px; display: inline-flex; align-items: center; text-shadow: 0 1px 3px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.35); box-shadow: 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3); }
.post-pid { font-size: 0.82rem; color: #6c757d; font-family: 'MapleMono CN Regular', monospace; padding: 3px 10px; border: 1px dashed #4a5568; border-radius: 6px; background: rgba(0,0,0,0.2); }
.post-date { font-size: 0.88rem; color: #a0aec0; margin-left: auto; }

.post-title { font-family: 'SmileySans Oblique', sans-serif; font-size: 2.2rem; color: #e0e0e0; margin-bottom: 28px; line-height: 1.35; letter-spacing: 0.01em; }

.author-info { display: flex; align-items: center; gap: 16px; margin-bottom: 30px; padding: 16px 20px; background: #252545; border-radius: 14px; border: 1px solid #2a2a4a; transition: box-shadow 0.2s ease; }
.author-info:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); border-color: #4facfe; }
.author-avatar { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; }
.avatar-image { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background-color: #353739; border: 2px solid #2a2a4a; }
.avatar-image-small { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background-color: #353739; }
.avatar-image-tiny { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background-color: #353739; }
.author-details { flex: 1; }
.author-name { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap; }
.author-username { font-family: 'SmileySans Oblique', sans-serif; font-size: 1.2rem; font-weight: 600; color: #e0e0e0; }
.view-profile-button { padding: 5px 14px; background: linear-gradient(135deg, #4facfe, #667eea); color: white; border: none; border-radius: 100px; font-size: 0.78rem; font-weight: 500; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(79,172,254,0.2); }
.view-profile-button:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,172,254,0.35); }
.post-meta { font-size: 0.88rem; color: #a0aec0; }

.post-body { margin-bottom: 30px; padding: 28px 28px 28px 32px; background: #252545; border-radius: 14px; border: 1px solid #2a2a4a; position: relative; }
.post-body::before { content: ''; position: absolute; left: 0; top: 12px; bottom: 12px; width: 4px; border-radius: 0 4px 4px 0; background: linear-gradient(180deg, #4facfe, #667eea); }
.post-body.restricted { background: #1a1a2e; border: 2px dashed #4a5568; }
.post-body.restricted::before { background: linear-gradient(180deg, #4a5568, #6c757d); }
.restricted-message { text-align: center; padding: 24px; color: #a0aec0; }
.restricted-icon { font-size: 3rem; display: block; margin-bottom: 10px; }
.restricted-message p { font-size: 1.05rem; margin: 8px 0; }
.restricted-hint { color: #6c757d; font-size: 0.9rem; }
.restricted-hint strong { color: #dc3545; }

.post-text { font-size: 1.05rem; line-height: 1.85; color: #e0e0e0; overflow-wrap: break-word; }
.post-text p { margin: 0 0 1em 0; }
.post-text h1, .post-text h2, .post-text h3 { margin: 1.2em 0 0.6em 0; line-height: 1.3; font-weight: 700; color: #ffffff; }
.post-text h1 { font-size: 1.7em } .post-text h2 { font-size: 1.4em } .post-text h3 { font-size: 1.15em }
.post-text ul, .post-text ol { padding-left: 1.5em; margin: 1em 0; }
.post-text li { margin: 0.4em 0; }
.post-text blockquote { border-left: 4px solid #4facfe; margin: 1.2em 0; padding: 12px 16px 12px 20px; color: #a0aec0; font-style: italic; background: rgba(79,172,254,0.06); border-radius: 0 8px 8px 0; }
.post-text hr { border: none; border-top: 2px solid #2a2a4a; margin: 2em 0; }
.post-text code { font-family: 'MapleMono CN Regular', 'Courier New', monospace; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 5px; font-size: 0.92em; color: #e83e8c; }
.post-text pre { background: #0a0a18; color: #e9ecef; padding: 16px 20px; border-radius: 10px; overflow-x: auto; font-family: 'MapleMono CN Regular', 'Courier New', monospace; font-size: 0.9rem; line-height: 1.6; margin: 1em 0; }
.post-text pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
.post-text :deep(.bilibili-video-wrapper) { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 16px 0; border-radius: 12px; background: #000; }
.post-text :deep(.bilibili-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

.post-stats { display: flex; gap: 28px; margin-bottom: 25px; padding: 14px 20px; background: #252545; border-radius: 12px; border: 1px solid #2a2a4a; }
.stat-item { display: flex; align-items: center; gap: 8px; }
.stat-icon { font-size: 1.15rem; line-height: 1; }
.stat-value { font-family: 'MapleMono CN Regular', monospace; font-size: 1.25rem; font-weight: 600; color: #e0e0e0; }
.stat-label { font-size: 0.88rem; color: #a0aec0; }

.post-actions { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.action-button { padding: 10px 22px; border: none; border-radius: 100px; font-family: 'MapleMono CN Regular', monospace; font-weight: 600; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.25s ease; }
.action-button:hover { transform: translateY(-2px); }
.like-button { background: rgba(255,255,255,0.08); color: #a0aec0; border: 1.5px solid #2a2a4a; }
.like-button:hover { background: rgba(255,255,255,0.12); border-color: #4a5568; }
.like-button.liked { background: linear-gradient(135deg, #dc3545, #e74c3c); color: white; border-color: transparent; box-shadow: 0 4px 16px rgba(220,53,69,0.3); }
.like-button.liked:hover { box-shadow: 0 6px 24px rgba(220,53,69,0.4); }
.comment-button { background: rgba(79,172,254,0.12); color: #4facfe; border: 1.5px solid rgba(79,172,254,0.25); }
.comment-button:hover { background: linear-gradient(135deg, #4facfe, #667eea); color: white; box-shadow: 0 4px 16px rgba(79,172,254,0.3); border-color: transparent; }
.delete-button { background: rgba(220,53,69,0.12); color: #ef4444; border: 1.5px solid rgba(220,53,69,0.25); }
.delete-button:hover { background: linear-gradient(135deg, #dc3545, #e74c3c); color: white; box-shadow: 0 4px 16px rgba(220,53,69,0.3); border-color: transparent; }
.rank-button { background: rgba(255,255,255,0.08); color: #a0aec0; border: 1.5px solid #2a2a4a; }
.rank-button:hover { background: rgba(255,255,255,0.12); color: #e0e0e0; border-color: #4a5568; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

.rank-select-menu { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; padding: 12px 16px; background: #252545; border-radius: 12px; border: 1px solid #2a2a4a; }
.rank-option { padding: 7px 16px; border: 1.5px solid #2a2a4a; border-radius: 100px; background: #1a1a2e; font-family: 'MapleMono CN Regular', monospace; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease; color: #a0aec0; }
.rank-option:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #4facfe; }
.rank-option.active { background: #4facfe; color: white; border-color: #4facfe; }

.post-mentions { background: #252545; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid #2a2a4a; position: relative; overflow: hidden; }
.post-mentions::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #4facfe, #667eea); }
.post-mentions-title { font-size: 0.92rem; font-weight: 600; color: #a0aec0; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
.post-mentions-icon { font-weight: 700; color: #4facfe; }
.post-mentions-list { display: flex; flex-wrap: wrap; gap: 8px; }
.post-mention-item { display: flex; align-items: center; gap: 6px; background: rgba(79,172,254,0.08); padding: 4px 12px 4px 6px; border-radius: 100px; font-size: 0.85rem; transition: all 0.2s ease; border: 1px solid rgba(79,172,254,0.15); }
.post-mention-item:hover { background: rgba(79,172,254,0.15); border-color: rgba(79,172,254,0.3); transform: translateY(-1px); }
.post-mention-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
.post-mention-name { color: #4facfe; font-weight: 500; }
.post-mention-profile-button { background: none; border: 1px solid #4facfe; color: #4facfe; border-radius: 100px; font-size: 0.72rem; padding: 2px 8px; cursor: pointer; transition: all 0.2s; }
.post-mention-profile-button:hover { background: #4facfe; color: white; }

.parent-post-section { margin-bottom: 30px; padding: 20px 20px 20px 24px; background: rgba(79,172,254,0.06); border-radius: 14px; border: 1px solid rgba(79,172,254,0.15); position: relative; }
.parent-post-section::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: linear-gradient(180deg, #4facfe, #667eea); }
.parent-post-title { font-size: 1rem; color: #4facfe; margin: 0 0 15px; display: flex; align-items: center; gap: 6px; }
.parent-post-card { background: #252545; border-radius: 12px; padding: 16px 20px; border: 1px solid #2a2a4a; }
.parent-post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 0.82rem; flex-wrap: wrap; }
.parent-post-rank { font-weight: 600; }
.parent-post-pid { color: #6c757d; }
.parent-post-date { color: #a0aec0; margin-left: auto; }
.parent-post-title-text { font-size: 1.08rem; color: #e0e0e0; margin: 0 0 10px; }
.parent-post-author { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.parent-post-author-info { display: flex; flex-direction: column; gap: 2px; }
.parent-post-author-name { font-weight: 600; color: #e0e0e0; font-size: 0.88rem; }
.parent-post-time { font-size: 0.78rem; color: #a0aec0; }
.parent-post-content-preview { font-size: 0.9rem; color: #a0aec0; margin-bottom: 12px; line-height: 1.6; }
.parent-post-actions { text-align: right; }
.parent-post-view-button { padding: 5px 16px; background: none; color: #4facfe; border: 1.5px solid #4facfe; border-radius: 100px; font-size: 0.82rem; cursor: pointer; transition: all 0.25s ease; font-family: 'MapleMono CN Regular', monospace; }
.parent-post-view-button:hover { background: #4facfe; color: white; box-shadow: 0 4px 12px rgba(79,172,254,0.25); transform: translateX(2px); }
.parent-post-view-button::after { content: ' →'; transition: margin 0.2s; }
.parent-post-view-button:hover::after { margin-left: 4px; }

.comments-section { margin-top: 30px; }
.comments-title { font-size: 1.25rem; color: #e0e0e0; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #2a2a4a; }
.add-comment { margin-bottom: 24px; }
.add-comment.restricted { padding: 20px; background: #1a1a2e; border-radius: 12px; text-align: center; border: 1px solid #2a2a4a; }
.restricted-comment-hint { color: #a0aec0; font-size: 0.92rem; }
.comment-input { width: 100%; padding: 14px 18px; border: 1.5px solid #2a2a4a; border-radius: 12px; font-family: 'MapleMono CN Regular', monospace; font-size: 0.92rem; resize: vertical; transition: all 0.3s ease; box-sizing: border-box; background: #0a0a18; color: #e0e0e0; }
.comment-input:focus { outline: none; border-color: #4facfe; box-shadow: 0 0 0 3px rgba(79,172,254,0.12); }
.comment-input::placeholder { color: #6c757d; }
.comment-actions { margin-top: 12px; text-align: right; }
.submit-comment-button { padding: 10px 28px; background: linear-gradient(135deg, #4facfe, #667eea); color: white; border: none; border-radius: 100px; font-family: 'MapleMono CN Regular', monospace; font-weight: 600; font-size: 0.92rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(79,172,254,0.2); }
.submit-comment-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,172,254,0.35); }
.submit-comment-button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

.comments-list { display: flex; flex-direction: column; gap: 14px; }
.waterfall-layout { columns: 1; }
@supports (columns: 1) { @media (min-width: 800px) { .waterfall-layout { columns: 2 320px; column-gap: 16px; } .waterfall-item { break-inside: avoid; margin-bottom: 14px } } }

.comment-item { background: #252545; border-radius: 12px; padding: 16px 18px; border: 1px solid #2a2a4a; transition: all 0.2s ease; position: relative; }
.comment-item::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 0 3px 3px 0; background: linear-gradient(180deg, rgba(79,172,254,0.3), rgba(102,126,234,0.3)); }
.comment-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); border-color: #4facfe; transform: translateX(2px); }

.waterfall-item { animation: commentSlideIn 0.4s ease both; }
.waterfall-item:nth-child(1) { animation-delay: 0.00s }
.waterfall-item:nth-child(2) { animation-delay: 0.03s }
.waterfall-item:nth-child(3) { animation-delay: 0.06s }
.waterfall-item:nth-child(4) { animation-delay: 0.09s }
.waterfall-item:nth-child(5) { animation-delay: 0.12s }
.waterfall-item:nth-child(6) { animation-delay: 0.15s }
.waterfall-item:nth-child(7) { animation-delay: 0.18s }
.waterfall-item:nth-child(8) { animation-delay: 0.21s }
.waterfall-item:nth-child(9) { animation-delay: 0.24s }
.waterfall-item:nth-child(10) { animation-delay: 0.27s }
@keyframes commentSlideIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }

.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.comment-author { display: flex; align-items: center; gap: 10px; }
.comment-author-info { display: flex; flex-direction: column; gap: 2px; }
.comment-author-name { font-weight: 600; color: #e0e0e0; font-size: 0.88rem; }
.comment-time { font-size: 0.78rem; color: #a0aec0; }

.comment-footer { display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap; }
.comment-action-btn { background: none; border: 1px solid #2a2a4a; border-radius: 100px; padding: 3px 12px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; color: #a0aec0; transition: all 0.2s ease; font-family: 'MapleMono CN Regular', monospace; }
.comment-action-btn:hover { background: rgba(79,172,254,0.1); color: #4facfe; border-color: rgba(79,172,254,0.2); }
.comment-action-btn.liked { color: #ef4444; border-color: rgba(220,53,69,0.2); background: rgba(220,53,69,0.08); }
.comment-action-btn.liked:hover { background: rgba(220,53,69,0.15); }
.comment-action-btn.danger { color: #ef4444; border-color: rgba(220,53,69,0.2); }
.comment-action-btn.danger:hover { background: #ef4444; color: white; border-color: #ef4444; }

.comment-content { font-size: 0.92rem; line-height: 1.65; color: #e0e0e0; }
.comment-content :deep(.bilibili-video-wrapper) { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 12px 0; border-radius: 8px; background: #000; }
.comment-content :deep(.bilibili-video-wrapper iframe) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
.comment-pid { margin-top: 8px; color: #4a5568; font-size: 0.82rem; }
.no-comments { text-align: center; padding: 40px; color: #a0aec0; font-size: 1rem; background: #1a1a2e; border-radius: 12px; border: 1px dashed #2a2a4a; }

.reply-to-hint { font-size: 0.88rem; color: #4facfe; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.cancel-reply-btn { padding: 2px 10px; background: none; border: 1px solid #4a5568; border-radius: 100px; color: #a0aec0; font-size: 0.78rem; cursor: pointer; transition: all 0.2s; font-family: 'MapleMono CN Regular', monospace; }
.cancel-reply-btn:hover { background: #4a5568; border-color: #4a5568; color: white; }

@media (max-width: 640px) {
  .post-detail-container { padding: 24px 16px; border-radius: 16px; }
  .post-title { font-size: 1.5rem; }
  .post-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .action-button { width: 100%; justify-content: center; padding: 10px 14px; font-size: 0.88rem; }
  .post-header { gap: 6px; } .post-date { margin-left: 0; width: 100%; }
  .post-stats { gap: 16px; flex-wrap: wrap; }
  .author-info { flex-wrap: wrap; }
  .back-button { top: 14px; left: 14px; padding: 6px 14px; font-size: 0.82rem; }
}
@media (max-width: 400px) { .post-actions { grid-template-columns: 1fr } }
</style>

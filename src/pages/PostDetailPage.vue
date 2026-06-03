<template>
  <div class="post-detail page-enter-active">
    <div class="post-detail-container">
      <!-- 返回按钮 -->
      <button class="back-button" @click="goBack">
        <span class="button-icon">←</span>
        <span class="button-text">返回</span>
      </button>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载帖子中...</p>
      </div>

      <!-- 帖子不存在 -->
      <div v-else-if="!post" class="not-found-container">
        <h1 class="not-found-title">帖子不存在</h1>
        <p class="not-found-message">您访问的帖子可能已被删除或不存在。</p>
        <button class="home-button" @click="goHome">
          <span class="button-icon">🏠</span>
          <span class="button-text">返回首页</span>
        </button>
      </div>

      <!-- 帖子详情 -->
      <div v-else class="post-content">
        <!-- 帖子头部：标记 + PID + 日期 -->
        <div class="post-header">
          <div class="post-rank-badge" :style="{ backgroundColor: postRankInfo.color, color: 'white' }">
            {{ postRankInfo.icon }} {{ postRankInfo.cn }}
          </div>
          <div class="post-pid">PID: {{ post.pid }}</div>
          <div class="post-date">{{ formatDate(post.createdAt) }}</div>
        </div>

        <h1 class="post-title">{{ post.title }}</h1>

        <!-- 作者信息 -->
        <div class="author-info">
          <div class="author-avatar">
            <img
              :src="getUserAvatar(post.userId)"
              :alt="post.username"
              class="avatar-image"
              @error="handleAvatarError"
            />
          </div>
          <div class="author-details">
            <div class="author-name">
              <span class="author-username">{{ post.username }}</span>
              <span class="author-rank" :style="{ color: authorRankInfo.color }">
                {{ authorRankInfo.icon }} {{ authorRankInfo.cn }}
              </span>
              <button
                v-if="post.userId"
                class="view-profile-button"
                @click="viewUserProfile(post.userId)"
              >
                查看个人资料
              </button>
            </div>
            <div class="post-meta">
              发布于 {{ formatRelativeTime(post.createdAt) }}
            </div>
          </div>
        </div>

        <!-- 帖子内容（黑帖权限控制） -->
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
        
        <!-- 提及用户显示 -->
        <div v-if="post.mentions && post.mentions.length > 0" class="post-mentions">
          <h3 class="post-mentions-title">
            <span class="post-mentions-icon">@</span>
            提及的用户
          </h3>
          <div class="post-mentions-list">
            <div v-for="mention in post.mentions" :key="mention.userId" class="post-mention-item">
              <img
                :src="getUserAvatar(mention.userId)"
                :alt="mention.username"
                class="post-mention-avatar"
                @error="handleAvatarError"
              />
              <span class="post-mention-name">@{{ mention.username }}</span>
              <button
                class="post-mention-profile-button"
                @click="viewUserProfile(mention.userId)"
                title="查看用户资料"
              >
                查看资料
              </button>
            </div>
          </div>
        </div>
        
        <!-- 帖子统计 -->
        <div class="post-stats">
          <div class="stat-item">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ post.likes }}</span>
            <span class="stat-label">点赞</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💬</span>
            <span class="stat-value">{{ childPosts.length }}</span>
            <span class="stat-label">评论</span>
          </div>
          <div v-if="post.mentions && post.mentions.length > 0" class="stat-item">
            <span class="stat-icon">@</span>
            <span class="stat-value">{{ post.mentions.length }}</span>
            <span class="stat-label">提及</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="post-actions">
          <button 
            class="action-button like-button" 
            :class="{ 'liked': isLiked }"
            @click="toggleLike"
          >
            <span class="button-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
            <span class="button-text">{{ isLiked ? '已点赞' : '点赞' }}</span>
          </button>

          <button v-if="canComment" class="action-button comment-button" @click="focusCommentInput">
            <span class="button-icon">💬</span>
            <span class="button-text">评论</span>
          </button>

          <button 
            v-if="isPostAuthor" 
            class="action-button delete-button" 
            @click="deletePost"
          >
            <span class="button-icon">🗑️</span>
            <span class="button-text">删除</span>
          </button>

          <!-- 管理员：设置帖子标记 -->
          <button 
            v-if="auth.isAdmin" 
            class="action-button rank-button" 
            @click="showRankMenu = !showRankMenu"
          >
            <span class="button-icon">🏷️</span>
            <span class="button-text">标记</span>
          </button>
        </div>

        <!-- 标记选择菜单（仅管理员） -->
        <div v-if="showRankMenu && auth.isAdmin" class="rank-select-menu">
          <button v-for="(info, key) in rankOptions" :key="key"
            class="rank-option" :class="{ active: post.postrank === key }"
            :style="{ borderLeft: `4px solid ${info.color}` }"
            @click="setPostRank(key)">
            {{ info.icon }} {{ info.cn }}
          </button>
        </div>

        <!-- 父帖子显示区域（如果当前帖子是评论/回复） -->
        <div v-if="isComment && parentPost" class="parent-post-section">
          <h3 class="parent-post-title">
            <span class="parent-post-icon">↶</span>
            对以下帖子的回复
          </h3>
          <div class="parent-post-card">
            <div class="parent-post-header">
              <div class="parent-post-rank" :style="{ color: getPostRankInfoFor(parentPost).color }">
                {{ getPostRankInfoFor(parentPost).icon }} {{ getPostRankInfoFor(parentPost).cn }}
              </div>
              <div class="parent-post-pid">PID: {{ parentPost.pid }}</div>
              <div class="parent-post-date">{{ formatDate(parentPost.createdAt) }}</div>
            </div>
            <h4 class="parent-post-title-text">{{ parentPost.title }}</h4>
            <div class="parent-post-author">
              <div class="parent-post-avatar">
                <img
                  :src="getUserAvatar(parentPost.userId)"
                  :alt="parentPost.username"
                  class="avatar-image-small"
                  @error="handleAvatarError"
                />
              </div>
              <div class="parent-post-author-info">
                <span class="parent-post-author-name">{{ parentPost.username }}</span>
                <span class="parent-post-time">{{ formatRelativeTime(parentPost.createdAt) }}</span>
              </div>
            </div>
            <div class="parent-post-content-preview">
              {{ getPlainTextPreview(parentPost.content, 150) }}
            </div>
            <div class="parent-post-actions">
              <button class="parent-post-view-button" @click="goToParentPost(parentPost.pid)">
                查看原帖
              </button>
            </div>
          </div>
        </div>

        <!-- 评论区域 -->
        <div class="comments-section">
          <h3 class="comments-title">评论 ({{ childPosts.length }})</h3>

          <!-- 添加评论 -->
          <div v-if="canComment" class="add-comment">
            <textarea
              v-model="newComment"
              :placeholder="commentPlaceholder"
              class="comment-input"
              rows="3"
              @keydown.enter.exact.prevent="addComment"
            ></textarea>
            <div class="comment-actions">
              <button
                class="submit-comment-button"
                :disabled="!newComment.trim()"
                @click="addComment"
              >
                发布评论
              </button>
            </div>
          </div>
          <div v-else class="add-comment restricted">
            <p class="restricted-comment-hint">{{ commentRestrictedHint }}</p>
          </div>

          <!-- 评论列表（子帖子流水布局） -->
          <div v-if="childPosts.length > 0" class="comments-list waterfall-layout">
            <div
              v-for="childPost in childPosts"
              :key="childPost.id"
              class="comment-item waterfall-item"
            >
              <div class="comment-header">
                <div class="comment-author">
                  <div class="comment-avatar">
                    <img
                      :src="getUserAvatar(childPost.userId)"
                      :alt="childPost.username"
                      class="avatar-image-tiny"
                      @error="handleAvatarError"
                    />
                  </div>
                  <div class="comment-author-info">
                    <span class="comment-author-name">{{ childPost.username }}</span>
                    <span class="comment-time">{{ formatRelativeTime(childPost.createdAt) }}</span>
                  </div>
                </div>
                <button
                  v-if="isCommentAuthor(childPost) || isPostAuthor"
                  class="delete-comment-button"
                  @click="deleteComment(childPost.pid)"
                >
                  删除
                </button>
              </div>
              <div class="comment-content" v-html="formatCommentContent(childPost.content)"></div>
              <div class="comment-pid" v-if="childPost.pid">
                <small>PID: {{ childPost.pid }}</small>
              </div>
            </div>
          </div>

          <div v-else class="no-comments">
            <p>还没有评论，快来抢沙发吧！</p>
          </div>
        </div>
      </div>

      <!-- 消息提示 -->
      <div v-if="message" class="message" :class="{ 'error': isError }">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { usePostStore } from '../stores/post.js';
import { getPostRankInfo, getUserRankInfo, canViewPostContent, canCommentOnPost } from '../constants/rankMap.js';
import postService from '../services/post.js';
import { authApi } from '../services/api.js';
import { decodeParam, encodePid, buildRouterLinkUser, buildRouterLinkPost } from '../utils/encode.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const postStore = usePostStore();

const pid = computed(() => decodeParam(route.params.pid));
const post = ref(null);
const parentPost = ref(null);
const childPosts = ref([]);
const loading = ref(true);
const message = ref('');
const isError = ref(false);
const newComment = ref('');
const isLiked = ref(false);
const showRankMenu = ref(false);

// 等级映射
const rankOptions = {
  'FF': { icon: '🔴', cn: '红帖', color: '#dc3545' },
  '69': { icon: '🔵', cn: '蓝帖', color: '#4facfe' },
  '78': { icon: '🟢', cn: '绿帖', color: '#28a745' },
  '00': { icon: '⚫', cn: '黑帖', color: '#212529' }
}

// 从 context 提取根帖 PID
function extractRootPid(context) {
  if (!context) return null
  const match = context.match(/p\/\?=\d+/)
  return match ? match[0].replace(/\\//g, '/') : null
}

// 从 context 提取父帖 context
function extractParentContext(context) {
  if (!context) return null
  const idx = context.lastIndexOf('/')
  if (idx <= 1) return null
  return context.substring(0, idx)
}

// 获取作者等级信息
const authorRankInfo = computed(() => {
  if (!post.value) return getUserRankInfo(0)
  // 如果 post.userrank 存在则用，否则默认 player
  return getUserRankInfo(post.value.userrank !== undefined ? post.value.userrank : 1)
})

// 帖子标记信息
const postRankInfo = computed(() => {
  return getPostRankInfo(post.value?.postrank)
})

// 是否可以查看内容
const canViewContent = computed(() => {
  if (!post.value) return false
  return canViewPostContent(auth.userrank, post.value.postrank)
})

// 是否可以评论
const canComment = computed(() => {
  if (!post.value) return false
  return canCommentOnPost(auth.userrank, post.value.postrank) && auth.isLoggedIn
})

// 评论 placeholder
const commentPlaceholder = computed(() => {
  if (!auth.isLoggedIn) return '请先登录后评论'
  if (post.value?.postrank === 'FF') return '评论此红帖需要玩家及以上等级'
  if (post.value?.postrank === '00') return '评论此黑帖需要管理员等级'
  return '写下您的评论...'
})

// 评论禁用提示
const commentRestrictedHint = computed(() => {
  if (!auth.isLoggedIn) return '请先登录后评论。'
  if (post.value?.postrank === 'FF') return '红帖仅允许玩家及以上等级的用户评论。'
  if (post.value?.postrank === '00') return '黑帖仅允许管理员评论。'
  return ''
})

// 缓存用户头像
const avatarCache = ref({});

// 获取用户头像
const getUserAvatar = (userId) => {
  if (!userId) return '/Head.png';
  if (avatarCache.value[userId]) return avatarCache.value[userId];
  return '/Head.png';
};

// 预加载用户头像
const loadUserAvatar = async (userId) => {
  if (!userId || avatarCache.value[userId]) return;
  try {
    const res = await authApi.getUserById(userId);
    if (res.success && res.user?.avatar) {
      avatarCache.value[userId] = res.user.avatar;
    }
  } catch {}
};

const handleAvatarError = (event) => {
  event.target.src = '/Head.png';
};

const isComment = computed(() => {
  // 如果有父帖 context 或者 parentId 非空
  return post.value && post.value.context && post.value.context !== `#/${post.value.pid}`
});

const isPostAuthor = computed(() => {
  return auth.currentUser && post.value && Number(auth.currentUser.id) === Number(post.value.userId);
});

// 获取父帖标记信息
function getPostRankInfoFor(p) {
  return getPostRankInfo(p?.postrank)
}

const loadPostDetail = async () => {
  loading.value = true;
  message.value = '';
  parentPost.value = null;
  showRankMenu.value = false;
  
  try {
    const foundPost = await postService.getPostByPid(pid.value);
    
    if (foundPost) {
      post.value = foundPost;
      isLiked.value = false;
      
      // 加载作者头像
      if (foundPost.userId) {
        loadUserAvatar(foundPost.userId);
      }
      
      // 加载提及用户头像
      if (foundPost.mentions && foundPost.mentions.length > 0) {
        foundPost.mentions.forEach(m => loadUserAvatar(m.userId));
      }
      
      // 获取子帖子（通过 postService 返回的 childPosts）
      childPosts.value = foundPost.childPosts || [];
      
      // 加载评论作者头像
      childPosts.value.forEach(c => {
        if (c.userId) loadUserAvatar(c.userId);
      });
      
      // 如果当前帖子是评论/回复，获取父帖子
      if (isComment.value) {
        const parentCtx = extractParentContext(post.value.context)
        if (parentCtx) {
          const rootPid = extractRootPid(parentCtx)
          if (rootPid) {
            parentPost.value = await postService.getPostByPid(rootPid);
            if (parentPost.value?.userId) loadUserAvatar(parentPost.value.userId);
          }
        }
      }
    } else {
      post.value = null;
      childPosts.value = [];
    }
  } catch (error) {
    console.error('加载帖子失败:', error);
    message.value = '加载帖子失败，请重试';
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

const formatPostContent = (content) => {
  if (!content) return '';
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  return content.replace(/\n/g, '<br>');
};

const getPlainTextPreview = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return '';
  let plainText = htmlContent;
  if (plainText.includes('<') && plainText.includes('>')) {
    plainText = plainText.replace(/<[^>]*>/g, ' ');
    plainText = plainText.replace(/\s+/g, ' ');
  }
  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength) + '...';
  }
  return plainText;
};

const formatCommentContent = (content) => {
  if (!content) return '';
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  return content.replace(/\n/g, '<br>');
};

const formatDate = (dateString) => {
  if (!dateString) return '未知';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  } catch (error) {
    return '日期格式错误';
  }
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '未知';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    
    return formatDate(dateString);
  } catch (error) {
    return '未知时间';
  }
};

const goBack = () => {
  router.go(-1);
};

const goHome = () => {
  router.push({ name: 'Home' });
};

const viewUserProfile = (userId) => {
  // 需要获取用户 UID
  authApi.getUserById(userId).then(res => {
    if (res.success && res.user?.uid) {
      router.push(buildRouterLinkUser(res.user.uid))
    }
  }).catch(() => {
    // fallback: 使用 userId 作为参数
    router.push('/user/' + encodeURIComponent(String(userId)))
  })
};

const toggleLike = async () => {
  if (!auth.isLoggedIn) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  
  isLiked.value = !isLiked.value;
  
  if (isLiked.value) {
    const result = await postService.likePost(pid.value);
    if (result.success) {
      post.value.likes = result.likes;
      message.value = '点赞成功';
      isError.value = false;
    } else {
      isLiked.value = false;
      message.value = result.message || '点赞失败';
      isError.value = true;
    }
  } else {
    post.value.likes -= 1;
    message.value = '已取消点赞';
    isError.value = false;
  }
};

const focusCommentInput = () => {
  const textarea = document.querySelector('.comment-input');
  if (textarea) {
    textarea.focus();
  }
};

const addComment = async () => {
  if (!auth.isLoggedIn) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  
  if (!newComment.value.trim()) {
    message.value = '评论内容不能为空';
    isError.value = true;
    return;
  }
  
  if (!auth.currentUser) {
    message.value = '用户信息获取失败';
    isError.value = true;
    return;
  }
  
  try {
    const result = await postService.addComment(pid.value, newComment.value.trim(), auth.currentUser.id, auth.currentUser.username);
    
    if (result.success) {
      childPosts.value.unshift(result.comment);
      newComment.value = '';
      message.value = '评论发布成功';
      isError.value = false;
    } else {
      message.value = result.message || '评论失败';
      isError.value = true;
    }
  } catch (error) {
    console.error('评论失败:', error);
    message.value = '评论失败，请重试';
    isError.value = true;
  }
};

const isCommentAuthor = (comment) => {
  return auth.currentUser && Number(comment.userId) === Number(auth.currentUser.id);
};

const deleteComment = async (commentPid) => {
  if (!confirm('确定要删除这条评论吗？')) {
    return;
  }
  
  try {
    const result = await postService.deleteComment(commentPid, auth.currentUser?.id);
    
    if (result.success) {
      const commentIndex = childPosts.value.findIndex(c => c.pid === commentPid);
      if (commentIndex !== -1) {
        childPosts.value.splice(commentIndex, 1);
      }
      message.value = '评论删除成功';
      isError.value = false;
    } else {
      message.value = result.message || '删除失败';
      isError.value = true;
    }
  } catch (error) {
    console.error('删除评论失败:', error);
    message.value = '删除失败，请重试';
    isError.value = true;
  }
};

const deletePost = async () => {
  if (!confirm('确定要删除这篇帖子吗？此操作不可撤销。')) {
    return;
  }
  
  const result = await postService.deletePost(pid.value, auth.currentUser?.id);
  
  if (result.success) {
    message.value = '帖子删除成功';
    isError.value = false;
    
    setTimeout(() => {
      router.push({ name: 'Home' });
    }, 1500);
  } else {
    message.value = result.message || '删除失败';
    isError.value = true;
  }
};

const setPostRank = async (newRank) => {
  const result = await postService.setPostRank(pid.value, newRank);
  if (result.success) {
    post.value.postrank = newRank;
    showRankMenu.value = false;
    message.value = `帖子标记已更新为 ${rankOptions[newRank]?.cn}`;
    isError.value = false;
  } else {
    message.value = result.message || '设置标记失败';
    isError.value = true;
  }
};

const goToParentPost = (parentPid) => {
  router.push(buildRouterLinkPost(parentPid));
};

onMounted(() => {
  loadPostDetail();
});
</script>

<style scoped>
/* ============== 原有样式保留 ============== */
.post-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.post-detail-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #e9ecef;
  transform: translateX(-2px);
}

.loading-container {
  text-align: center;
  padding: 60px 0;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.not-found-container {
  text-align: center;
  padding: 60px 0;
}

.not-found-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2rem;
  color: #dc3545;
  margin-bottom: 20px;
}

.not-found-message {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 30px;
}

.home-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.home-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3);
}

.post-content {
  margin-top: 20px;
}

/* ============== 新的标记系统样式 ============== */
.post-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.post-rank-badge {
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.post-pid {
  font-size: 0.85rem;
  color: #6c757d;
  font-family: 'MapleMono CN Regular', monospace;
}

.post-date {
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: auto;
}

/* 原分类样式移除，更换为标记系统 */
.post-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2.2rem;
  color: #333;
  margin-bottom: 25px;
  line-height: 1.3;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.author-avatar {
  width: 50px;
  height: 50px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f2f5;
}

.avatar-image-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f2f5;
}

.avatar-image-tiny {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f2f5;
}

.author-details {
  flex: 1;
}

.author-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.author-username {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.author-rank {
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.view-profile-button {
  padding: 4px 12px;
  background-color: #4facfe;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.view-profile-button:hover {
  background-color: #3a9bf7;
}

.post-meta {
  font-size: 0.9rem;
  color: #6c757d;
}

/* ============== 内容区域 / 受限提示 ============== */
.post-body {
  margin-bottom: 30px;
  padding: 25px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.post-body.restricted {
  background-color: #f8f9fa;
  border: 2px dashed #6c757d;
}

.restricted-message {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

.restricted-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.restricted-message p {
  font-size: 1.1rem;
  margin: 8px 0;
}

.restricted-hint {
  color: #adb5bd;
  font-size: 0.9rem;
}

.restricted-hint strong {
  color: #dc3545;
}

.post-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
}

.post-text h1, .post-text h2, .post-text h3 {
  margin: 1em 0 0.5em 0;
  line-height: 1.3;
  font-weight: bold;
}

.post-text h1 { font-size: 1.8em; }
.post-text h2 { font-size: 1.5em; }
.post-text h3 { font-size: 1.2em; }

.post-text ul, .post-text ol {
  padding-left: 1.5em;
  margin: 1em 0;
}

.post-text li {
  margin: 0.5em 0;
}

.post-text blockquote {
  border-left: 3px solid #667eea;
  margin: 1em 0;
  padding-left: 1em;
  color: #666;
  font-style: italic;
}

.post-text hr {
  border: none;
  border-top: 2px solid #e9ecef;
  margin: 2em 0;
}

.post-text p {
  margin: 0 0 1em 0;
}

.post-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-value {
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
}

.post-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.like-button {
  background-color: #f8f9fa;
  color: #333;
  border: 2px solid #dee2e6;
}

.like-button:hover {
  background-color: #e9ecef;
}

.like-button.liked {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.like-button.liked:hover {
  background-color: #c82333;
}

.comment-button {
  background-color: #4facfe;
  color: white;
  border: 2px solid #4facfe;
}

.comment-button:hover {
  background-color: #3a9bf7;
}

.delete-button {
  background-color: #f8f9fa;
  color: #dc3545;
  border: 2px solid #dc3545;
}

.delete-button:hover {
  background-color: #dc3545;
  color: white;
}

.rank-button {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 2px solid #6c757d;
}

.rank-button:hover {
  background-color: #6c757d;
  color: white;
}

/* ============== 标记选择菜单 ============== */
.rank-select-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #dee2e6;
}

.rank-option {
  padding: 8px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.rank-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.rank-option.active {
  border-color: #333;
  background: #e9ecef;
}

/* ============== 其他区域 ============== */
.post-mentions {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.post-mentions-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-mentions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.post-mention-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e9ecef;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.post-mention-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.post-mention-name {
  color: #4facfe;
  font-weight: 500;
}

.post-mention-profile-button {
  background: none;
  border: 1px solid #4facfe;
  color: #4facfe;
  border-radius: 4px;
  font-size: 0.75rem;
  padding: 2px 6px;
  cursor: pointer;
}

.parent-post-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f0f8ff;
  border-radius: 12px;
  border: 1px solid #b3d9ff;
}

.parent-post-title {
  font-size: 1rem;
  color: #4facfe;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.parent-post-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.parent-post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.parent-post-rank {
  font-weight: 600;
}

.parent-post-pid {
  color: #6c757d;
}

.parent-post-date {
  color: #6c757d;
  margin-left: auto;
}

.parent-post-title-text {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 10px;
}

.parent-post-author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.parent-post-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.parent-post-author-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.parent-post-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.parent-post-content-preview {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 12px;
  line-height: 1.5;
}

.parent-post-actions {
  text-align: right;
}

.parent-post-view-button {
  padding: 6px 16px;
  background: #4facfe;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.3s;
}

.parent-post-view-button:hover {
  background: #3a9bf7;
}

.comments-section {
  margin-top: 30px;
}

.comments-title {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.add-comment {
  margin-bottom: 20px;
}

.add-comment.restricted {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  text-align: center;
}

.restricted-comment-hint {
  color: #6c757d;
  font-size: 0.95rem;
}

.comment-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  resize: vertical;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.comment-input:focus {
  outline: none;
  border-color: #4facfe;
}

.comment-actions {
  margin-top: 10px;
  text-align: right;
}

.submit-comment-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-comment-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102,126,234,0.3);
}

.submit-comment-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.comment-item:hover {
  border-color: #ced4da;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-author-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.delete-comment-button {
  padding: 4px 10px;
  font-size: 0.8rem;
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-comment-button:hover {
  background: #dc3545;
  color: white;
}

.comment-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
}

.comment-pid {
  margin-top: 8px;
  color: #adb5bd;
}

.no-comments {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 1rem;
}

.message {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message:not(.error) {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

@media (max-width: 640px) {
  .post-detail-container {
    padding: 24px 16px;
  }
  .post-title {
    font-size: 1.5rem;
  }
  .post-actions {
    flex-direction: column;
  }
  .action-button {
    width: 100%;
    justify-content: center;
  }
  .post-header {
    gap: 8px;
  }
  .post-date {
    margin-left: 0;
    width: 100%;
  }
}
</style>
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
          <div v-if="post.postrank && post.postrank !== '69'" class="post-rank-badge" :style="{ backgroundColor: postRankInfo.color, color: 'white' }">
            {{ postRankInfo.cn }}
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
              <userrankBadge :userId="post.userId" />
              <span class="author-username">{{ post.username }}</span>
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
                  class="comment-action-btn danger"
                  @click="deleteComment(childPost.pid)"
                >
                  🗑️ 删除
                </button>
              </div>
              <div class="comment-content" v-html="formatCommentContent(childPost.content)"></div>
              <div class="comment-footer">
                <button class="comment-action-btn" :class="{ 'liked': likedComments[childPost.pid] }" @click="likeComment(childPost.pid)">
                  <span>{{ likedComments[childPost.pid] ? '❤️' : '🤍' }}</span>
                  <span>{{ commentLikes[childPost.pid] ?? childPost.likes ?? 0 }}</span>
                </button>
                <button class="comment-action-btn" @click="replyToComment(childPost.username)">
                  💬 回复
                </button>
              </div>
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
      <Transition name="toast">
        <div v-if="message" class="message" :class="{ 'error': isError }">
          {{ message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { usePostStore } from '../stores/post.js';
import { getPostRankInfo, canViewPostContent, canCommentOnPost } from '../constants/rankMap.js';
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
const message = ref('');
const isError = ref(false);
const newComment = ref('');
const isLiked = ref(false);
const showRankMenu = ref(false);
const likeLoading = ref(false);
const commentLikeLoading = ref({});

// 等级映射
const rankOptions = {
  'FF': { icon: '', cn: '受警告内容', color: '#dc3545' },
  '69': { icon: '', cn: '一般帖子', color: '#4facfe' },
  '78': { icon: '', cn: '精华内容', color: '#28a745' },
  '00': { icon: '', cn: '封禁内容', color: '#212529' }
}

// 从 context 提取根帖 PID
function extractRootPid(context) {
  if (!context) return null
  const match = context.match(/p-\d{8}-\d{4}-\d{2}/)
  return match ? match[0] : null
}

// 从 context 提取父帖 context
function extractParentContext(context) {
  if (!context) return null
  const idx = context.lastIndexOf('/')
  if (idx <= 1) return null
  return context.substring(0, idx)
}

// 帖子标记信息
const postRankInfo = computed(() => {
  return getPostRankInfo(post.value?.postrank)
})

// 是否可以查看内容 — 信任服务端响应，如果服务端返回了真实内容则展示
const canViewContent = computed(() => {
  if (!post.value) return false
  const restrictedMsg = '[该帖子已被标记为黑帖，您没有权限查看内容]'
  // 如果内容不是受限提示，说明服务端允许查看
  if (post.value.content && post.value.content !== restrictedMsg) {
    return true
  }
  return false
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

// 评论点赞状态（按 PID 索引）
const likedComments = ref({});
const commentLikes = ref({});

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
      likedComments.value = {};
      commentLikes.value = {};
      
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
      
      // 从服务端读取点赞状态
      isLiked.value = foundPost.isLikedByUser || false;
      
      // 初始化评论点赞缓存
      childPosts.value.forEach(c => {
        commentLikes.value[c.pid] = c.likes || 0;
        likedComments.value[c.pid] = c.isLikedByUser || false;
      });
      
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
  // 使用内容过滤器处理（B站视频嵌入 + XSS 消毒）
  return processContent(content);
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
  // 使用内容过滤器处理（B站视频嵌入 + XSS 消毒）
  return processContent(content);
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
  if (likeLoading.value) return;
  likeLoading.value = true;
  
  if (!isLiked.value) {
    const result = await postService.likePost(pid.value);
    if (result.success) {
      isLiked.value = true;
      post.value.likes = result.likes;
      message.value = '点赞成功';
      isError.value = false;
    } else {
      message.value = result.message || '点赞失败';
      isError.value = true;
    }
  } else {
    const result = await postService.unlikePost(pid.value);
    if (result.success) {
      isLiked.value = false;
      post.value.likes = result.likes;
      message.value = '已取消点赞';
      isError.value = false;
    } else {
      message.value = result.message || '取消点赞失败';
      isError.value = true;
    }
  }
  likeLoading.value = false;
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

// 评论点赞（可切换，等待式）
const likeComment = async (commentPid) => {
  if (!auth.isLoggedIn) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  if (commentLikeLoading.value[commentPid]) return;
  commentLikeLoading.value[commentPid] = true;
  
  try {
    const wasLiked = likedComments.value[commentPid] || false;
    let result;
    if (!wasLiked) {
      result = await postService.likePost(commentPid);
    } else {
      result = await postService.unlikePost(commentPid);
    }
    if (result.success) {
      likedComments.value[commentPid] = !wasLiked;
      commentLikes.value[commentPid] = result.likes;
      message.value = !wasLiked ? '点赞成功' : '已取消点赞';
      isError.value = false;
    } else {
      message.value = result.message || '操作失败';
      isError.value = true;
    }
  } catch (error) {
    message.value = '操作失败，请重试';
    isError.value = true;
  }
  commentLikeLoading.value[commentPid] = false;
};

// 回复评论（在输入框插入 @用户名）
const replyToComment = (username) => {
  if (!auth.isLoggedIn) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  const atText = `@${username} `;
  newComment.value = newComment.value ? atText + newComment.value : atText;
  const textarea = document.querySelector('.comment-input');
  if (textarea) {
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(newComment.value.length, newComment.value.length);
    }, 0);
  }
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
/* ======================================================
   PostDetailPage.vue — 视觉优化版
   主题：守望先锋科技风 + 玻璃拟态
   ====================================================== */

/* ---------- 1. 背景层 ---------- */
.post-detail {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(79, 172, 254, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #0a1628 0%, #16203a 40%, #1a1a2e 70%, #0d1117 100%);
  padding: 76px 20px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* ---------- 2. 玻璃容器 ---------- */
.post-detail-container {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border-radius: 20px;
  padding: 76px 40px 40px;
  width: 100%;
  max-width: 800px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 24px 64px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: box-shadow 0.3s ease;
}

/* ---------- 3. 返回按钮（毛玻璃药丸） ---------- */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 100px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s ease;
  color: #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  color: #1a1a2e;
}

.back-button .button-icon {
  display: inline-block;
  transition: transform 0.25s ease;
}

.back-button:hover .button-icon {
  transform: translateX(-2px);
}

/* ---------- 4. 加载状态（双色渐变 spinner） ---------- */
.loading-container {
  text-align: center;
  padding: 80px 0;
  color: #666;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #667eea, #764ba2, #667eea);
  mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #fff calc(100% - 5px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #fff calc(100% - 5px));
  animation: spin 0.8s linear infinite;
  margin: 0 auto 18px;
  position: relative;
}

.loading-spinner::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.15); }
}

.loading-container p {
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
  color: #888;
  animation: pulse-text 2s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ---------- 5. 不存在状态 ---------- */
.not-found-container {
  text-align: center;
  padding: 80px 0;
}

.not-found-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2rem;
  color: #dc3545;
  margin-bottom: 16px;
}

.not-found-message {
  font-size: 1.1rem;
  color: #888;
  margin-bottom: 32px;
}

.home-button {
  padding: 12px 28px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 100px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.25);
}

.home-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(79, 172, 254, 0.35);
}

/* ---------- 6. 帖子头部 ---------- */
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

/* 标记徽章 — 带内发光 + 脉冲呼吸 */
.post-rank-badge {
  position: relative;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 5px 16px;
  border-radius: 100px;
  display: inline-flex;
  align-items: center;
  text-shadow: 0 1px 3px rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow:
    0 2px 8px rgba(0,0,0,0.12),
    inset 0 1px 0 rgba(255,255,255,0.3);
  animation: badge-pulse 3s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3); }
  50% { box-shadow: 0 2px 16px rgba(0,0,0,0.2), 0 0 12px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3); }
}

.post-pid {
  font-size: 0.82rem;
  color: #6c757d;
  font-family: 'MapleMono CN Regular', monospace;
  padding: 3px 10px;
  border: 1px dashed #adb5bd;
  border-radius: 6px;
  background: rgba(0,0,0,0.02);
}

.post-date {
  font-size: 0.88rem;
  color: #888;
  margin-left: auto;
}

/* ---------- 7. 帖子标题 ---------- */
.post-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2.2rem;
  color: #1a1a2e;
  margin-bottom: 28px;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

/* ---------- 8. 作者信息卡（毛玻璃升级） ---------- */
.author-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}

.author-info:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.author-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f2f5;
  border: 2px solid white;
}

.avatar-image-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f2f5;
}

.avatar-image-tiny {
  width: 32px;
  height: 32px;
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
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.author-username {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a1a2e;
}

.author-rank {
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.view-profile-button {
  padding: 5px 14px;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(79, 172, 254, 0.2);
}

.view-profile-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.35);
}

.post-meta {
  font-size: 0.88rem;
  color: #888;
}

/* ---------- 9. 正文内容区（左侧装饰条） ---------- */
.post-body {
  margin-bottom: 30px;
  padding: 28px 28px 28px 32px;
  background: white;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

/* 左侧装饰条 */
.post-body::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(180deg, #667eea, #764ba2);
}

.post-body.restricted {
  background: #f8f9fa;
  border: 2px dashed #adb5bd;
}

.post-body.restricted::before {
  background: linear-gradient(180deg, #adb5bd, #6c757d);
}

.restricted-message {
  text-align: center;
  padding: 24px;
  color: #6c757d;
}

.restricted-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.restricted-message p {
  font-size: 1.05rem;
  margin: 8px 0;
}

.restricted-hint {
  color: #adb5bd;
  font-size: 0.9rem;
}

.restricted-hint strong {
  color: #dc3545;
}

/* ---------- 10. 帖子文本排版 ---------- */
.post-text {
  font-size: 1.05rem;
  line-height: 1.85;
  color: #2c2c3a;
  overflow-wrap: break-word;
}

.post-text p {
  margin: 0 0 1em 0;
}

.post-text h1, .post-text h2, .post-text h3 {
  margin: 1.2em 0 0.6em 0;
  line-height: 1.3;
  font-weight: 700;
  color: #1a1a2e;
}

.post-text h1 { font-size: 1.7em; }
.post-text h2 { font-size: 1.4em; }
.post-text h3 { font-size: 1.15em; }

.post-text ul, .post-text ol {
  padding-left: 1.5em;
  margin: 1em 0;
}

.post-text li {
  margin: 0.4em 0;
}

/* 引用块 — 渐变左边框 + 浅背景 */
.post-text blockquote {
  border-left: 4px solid;
  border-image: linear-gradient(180deg, #667eea, #764ba2) 1;
  margin: 1.2em 0;
  padding: 12px 16px 12px 20px;
  color: #555;
  font-style: italic;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.04), rgba(118, 75, 162, 0.04));
  border-radius: 0 8px 8px 0;
}

.post-text hr {
  border: none;
  border-top: 2px solid rgba(0, 0, 0, 0.06);
  margin: 2em 0;
}

/* 代码样式预埋 */
.post-text code {
  font-family: 'MapleMono CN Regular', 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.92em;
  color: #e83e8c;
}

.post-text pre {
  background: #1a1a2e;
  color: #e9ecef;
  padding: 16px 20px;
  border-radius: 10px;
  overflow-x: auto;
  font-family: 'MapleMono CN Regular', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 1em 0;
}

.post-text pre code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

/* B站视频嵌入 */
.post-text :deep(.bilibili-video-wrapper) {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin: 16px 0;
  border-radius: 12px;
  background: #000;
}

.post-text :deep(.bilibili-video-wrapper iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* ---------- 11. 帖子统计 ---------- */
.post-stats {
  display: flex;
  gap: 28px;
  margin-bottom: 25px;
  padding: 14px 20px;
  background: rgba(248, 249, 250, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 1.15rem;
  line-height: 1;
}

.stat-value {
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
}

.stat-label {
  font-size: 0.88rem;
  color: #888;
}

/* ---------- 12. 操作按钮组（渐变胶囊） ---------- */
.post-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-button {
  padding: 10px 22px;
  border: none;
  border-radius: 100px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.action-button:hover {
  transform: translateY(-2px);
}

/* 点赞按钮 */
.like-button {
  background: rgba(255, 255, 255, 0.8);
  color: #555;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.like-button:hover {
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.12);
}

.like-button.liked {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
}

.like-button.liked:hover {
  box-shadow: 0 6px 24px rgba(220, 53, 69, 0.4);
  transform: translateY(-2px);
}

.like-button.liked .button-icon {
  animation: heartBeat 0.6s ease-in-out;
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.2); }
  60% { transform: scale(1); }
}

/* 评论按钮 */
.comment-button {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.12), rgba(102, 126, 234, 0.12));
  color: #4facfe;
  border: 1.5px solid rgba(79, 172, 254, 0.25);
}

.comment-button:hover {
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);
  border-color: transparent;
}

/* 删除按钮 */
.delete-button {
  background: rgba(255, 255, 255, 0.8);
  color: #dc3545;
  border: 1.5px solid rgba(220, 53, 69, 0.25);
}

.delete-button:hover {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
  color: white;
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3), 0 0 20px rgba(220, 53, 69, 0.15);
  border-color: transparent;
}

/* 标记按钮 */
.rank-button {
  background: rgba(255, 255, 255, 0.8);
  color: #6c757d;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
}

.rank-button:hover {
  background: rgba(108, 117, 125, 0.1);
  color: #495057;
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* ---------- 13. 标记选择菜单 ---------- */
.rank-select-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.rank-option {
  padding: 7px 16px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  border-radius: 100px;
  background: white;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}

.rank-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.rank-option.active {
  background: #1a1a2e;
  color: white;
  border-color: #1a1a2e;
}

/* ---------- 14. 提及区域 ---------- */
.post-mentions {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.post-mentions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.post-mentions-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-mentions-icon {
  font-weight: 700;
  color: #667eea;
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
  background: rgba(79, 172, 254, 0.06);
  padding: 4px 12px 4px 6px;
  border-radius: 100px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.post-mention-item:hover {
  background: rgba(79, 172, 254, 0.12);
  border-color: rgba(79, 172, 254, 0.25);
  transform: translateY(-1px);
}

.post-mention-avatar {
  width: 22px;
  height: 22px;
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
  border-radius: 100px;
  font-size: 0.72rem;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-mention-profile-button:hover {
  background: #4facfe;
  color: white;
}

/* ---------- 15. 父帖子区域 ---------- */
.parent-post-section {
  margin-bottom: 30px;
  padding: 20px 20px 20px 24px;
  background: rgba(240, 248, 255, 0.6);
  border-radius: 14px;
  border: 1px solid rgba(179, 217, 255, 0.5);
  position: relative;
}

.parent-post-section::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, #4facfe, #667eea);
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
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.parent-post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.82rem;
  flex-wrap: wrap;
}

.parent-post-rank {
  font-weight: 600;
}

.parent-post-pid {
  color: #6c757d;
}

.parent-post-date {
  color: #888;
  margin-left: auto;
}

.parent-post-title-text {
  font-size: 1.08rem;
  color: #1a1a2e;
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
  font-size: 0.88rem;
}

.parent-post-time {
  font-size: 0.78rem;
  color: #888;
}

.parent-post-content-preview {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 12px;
  line-height: 1.6;
}

.parent-post-actions {
  text-align: right;
}

.parent-post-view-button {
  padding: 5px 16px;
  background: none;
  color: #4facfe;
  border: 1.5px solid #4facfe;
  border-radius: 100px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'MapleMono CN Regular', monospace;
}

.parent-post-view-button:hover {
  background: #4facfe;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.25);
  transform: translateX(2px);
}

.parent-post-view-button::after {
  content: ' →';
  transition: margin 0.2s;
}

.parent-post-view-button:hover::after {
  margin-left: 4px;
}

/* ---------- 16. 评论区 ---------- */
.comments-section {
  margin-top: 30px;
}

.comments-title {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* 添加评论区域 */
.add-comment {
  margin-bottom: 24px;
}

.add-comment.restricted {
  padding: 20px;
  background: rgba(248, 249, 250, 0.6);
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.restricted-comment-hint {
  color: #888;
  font-size: 0.92rem;
}

/* 评论输入 — 毛玻璃 + 发光边框 */
.comment-input {
  width: 100%;
  padding: 14px 18px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.92rem;
  resize: vertical;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.comment-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  background: white;
}

.comment-input::placeholder {
  color: #adb5bd;
  transition: color 0.2s;
}

.comment-input:focus::placeholder {
  color: #ced4da;
}

.comment-actions {
  margin-top: 12px;
  text-align: right;
}

.submit-comment-button {
  padding: 10px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 100px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.submit-comment-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
}

.submit-comment-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* ---------- 17. 评论列表 ---------- */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* waterfall 流水布局补充 */
.waterfall-layout {
  columns: 1;
}

@supports (columns: 1) {
  @media (min-width: 800px) {
    .waterfall-layout {
      columns: 2 320px;
      column-gap: 16px;
    }
    .waterfall-item {
      break-inside: avoid;
      margin-bottom: 14px;
    }
  }
}

.comment-item {
  background: white;
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.comment-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, rgba(79, 172, 254, 0.3), rgba(118, 75, 162, 0.3));
}

.comment-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.08);
  transform: translateX(2px);
}

/* 评论 stagger 入场动画 */
.waterfall-item {
  animation: commentSlideIn 0.4s ease both;
}

.waterfall-item:nth-child(1)  { animation-delay: 0.00s; }
.waterfall-item:nth-child(2)  { animation-delay: 0.03s; }
.waterfall-item:nth-child(3)  { animation-delay: 0.06s; }
.waterfall-item:nth-child(4)  { animation-delay: 0.09s; }
.waterfall-item:nth-child(5)  { animation-delay: 0.12s; }
.waterfall-item:nth-child(6)  { animation-delay: 0.15s; }
.waterfall-item:nth-child(7)  { animation-delay: 0.18s; }
.waterfall-item:nth-child(8)  { animation-delay: 0.21s; }
.waterfall-item:nth-child(9)  { animation-delay: 0.24s; }
.waterfall-item:nth-child(10) { animation-delay: 0.27s; }

@keyframes commentSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  color: #1a1a2e;
  font-size: 0.88rem;
}

.comment-time {
  font-size: 0.78rem;
  color: #888;
}

/* ---------- 评论操作按钮 ---------- */
.comment-footer {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.comment-action-btn {
  background: none;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 100px;
  padding: 3px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #888;
  transition: all 0.2s ease;
  font-family: 'MapleMono CN Regular', monospace;
}

.comment-action-btn:hover {
  background: rgba(79, 172, 254, 0.08);
  color: #4facfe;
  border-color: rgba(79, 172, 254, 0.2);
}

.comment-action-btn.liked {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.2);
  background: rgba(220, 53, 69, 0.06);
}

.comment-action-btn.liked:hover {
  background: rgba(220, 53, 69, 0.12);
}

.comment-action-btn.danger {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.15);
}

.comment-action-btn.danger:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.comment-content {
  font-size: 0.92rem;
  line-height: 1.65;
  color: #2c2c3a;
}

.comment-content :deep(.bilibili-video-wrapper) {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin: 12px 0;
  border-radius: 8px;
  background: #000;
}

.comment-content :deep(.bilibili-video-wrapper iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.comment-pid {
  margin-top: 8px;
  color: #adb5bd;
  font-size: 0.82rem;
}

.no-comments {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 1rem;
  background: rgba(248, 249, 250, 0.4);
  border-radius: 12px;
  border: 1px dashed rgba(0, 0, 0, 0.06);
}

/* ---------- 18. Toast 消息提示（浮动底部） ---------- */
.message {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 28px;
  border-radius: 100px;
  text-align: center;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.2);
}

.message.error {
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border-color: rgba(255, 255, 255, 0.15);
}

.message:not(.error) {
  background: rgba(40, 167, 69, 0.9);
  color: white;
  border-color: rgba(255, 255, 255, 0.15);
}

/* toast 动画（配合 Transition 组件） */
.toast-enter-active {
  animation: toastSlideUp 0.35s ease-out;
}

.toast-leave-active {
  animation: toastFadeOut 0.3s ease-in forwards;
}

@keyframes toastSlideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastFadeOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px);
  }
}

/* ---------- 19. 响应式 ---------- */
@media (max-width: 640px) {
  .post-detail-container {
    padding: 24px 16px;
    border-radius: 16px;
  }

  .post-title {
    font-size: 1.5rem;
  }

  .post-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .action-button {
    width: 100%;
    justify-content: center;
    padding: 10px 14px;
    font-size: 0.88rem;
  }

  .post-header {
    gap: 6px;
  }

  .post-date {
    margin-left: 0;
    width: 100%;
  }

  .post-stats {
    gap: 16px;
    flex-wrap: wrap;
  }

  .author-info {
    flex-wrap: wrap;
  }

  .back-button {
    top: 14px;
    left: 14px;
    padding: 6px 14px;
    font-size: 0.82rem;
  }

  .message {
    white-space: normal;
    max-width: 90vw;
    font-size: 0.9rem;
    padding: 12px 20px;
  }
}

@media (max-width: 400px) {
  .post-actions {
    grid-template-columns: 1fr;
  }
}
</style>
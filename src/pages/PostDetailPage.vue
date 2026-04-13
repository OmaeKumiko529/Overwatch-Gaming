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
        <!-- 帖子头部 -->
        <div class="post-header">
          <div class="post-category" :class="getPostCategoryClass(post.category)">
            {{ getCategoryDisplayName(post.category) }}
          </div>
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

        <!-- 帖子内容 -->
        <div class="post-body">
          <div class="post-text" v-html="formatPostContent(post.content)"></div>
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
            <span class="stat-value">{{ post.comments.length }}</span>
            <span class="stat-label">评论</span>
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

          <button class="action-button comment-button" @click="focusCommentInput">
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
        </div>

        <!-- 父帖子显示区域（如果当前帖子是评论/回复） -->
        <div v-if="isComment && parentPost" class="parent-post-section">
          <h3 class="parent-post-title">
            <span class="parent-post-icon">↶</span>
            对以下帖子的回复
          </h3>
          <div class="parent-post-card">
            <div class="parent-post-header">
              <div class="parent-post-category" :class="getPostCategoryClass(parentPost.category)">
                {{ getCategoryDisplayName(parentPost.category) }}
              </div>
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
              <button class="parent-post-view-button" @click="goToParentPost(parentPost.id)">
                查看原帖
              </button>
            </div>
          </div>
        </div>

        <!-- 评论区域 -->
        <div class="comments-section">
          <h3 class="comments-title">评论 ({{ childPosts.length }})</h3>

          <!-- 添加评论 -->
          <div class="add-comment">
            <textarea
              v-model="newComment"
              placeholder="写下您的评论..."
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

          <!-- 评论列表（子帖子瀑布流） -->
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
                  @click="deleteComment(childPost.id)"
                >
                  删除
                </button>
              </div>
              <div class="comment-content" v-html="formatCommentContent(childPost.content)"></div>
              <div class="comment-context" v-if="childPost.context">
                <small>上下文: {{ childPost.context }}</small>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import auth from '../services/auth.js';
import postService from '../services/post.js';
import userService from '../services/user.js';

const route = useRoute();
const router = useRouter();

const postId = computed(() => route.params.id);
const post = ref(null);
const parentPost = ref(null); // 存储父帖子（如果当前帖子是评论/回复）
const childPosts = ref([]); // 存储子帖子（评论）
const loading = ref(true);
const message = ref('');
const isError = ref(false);
const newComment = ref('');
const isLiked = ref(false);

// 获取用户头像
const getUserAvatar = (userId) => {
  if (!userId) return '/Head.png';
  const user = userService.getUserById(userId);
  return user?.avatar || '/Head.png';
};

// 处理头像加载错误
const handleAvatarError = (event) => {
  // 如果头像加载失败，使用默认头像
  event.target.src = '/Head.png';
};

// 检查当前帖子是否为评论/回复
const isComment = computed(() => {
  return post.value && post.value.parentId !== null && post.value.parentId !== undefined;
});

// 检查当前用户是否是帖子作者
const isPostAuthor = computed(() => {
  const currentUser = auth.getCurrentUser();
  return currentUser && post.value && currentUser.id === post.value.userId;
});

// 加载帖子详情
const loadPostDetail = async () => {
  loading.value = true;
  message.value = '';
  parentPost.value = null; // 重置父帖子
  
  try {
    // 使用postService的getPostById函数获取帖子详情
    const foundPost = postService.getPostById(postId.value);
    
    if (foundPost) {
      post.value = foundPost;
      // 检查当前用户是否已点赞（这里需要扩展auth.js功能）
      // 暂时设为false
      isLiked.value = false;
      
      // 获取帖子的所有子帖子（评论）
      childPosts.value = postService.getChildPosts(postId.value);
      
      // 如果当前帖子是评论/回复，获取父帖子
      if (foundPost.parentId) {
        parentPost.value = postService.getPostById(foundPost.parentId);
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

// 格式化帖子内容（支持富文本HTML）
const formatPostContent = (content) => {
  if (!content) return '';
  
  // 如果内容已经是HTML（包含HTML标签），直接返回
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  
  // 否则，将换行符转换为<br>标签
  return content.replace(/\n/g, '<br>');
};

// 从HTML内容中提取纯文本预览
const getPlainTextPreview = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return '';
  
  let plainText = htmlContent;
  // 去除HTML标签
  if (plainText.includes('<') && plainText.includes('>')) {
    plainText = plainText.replace(/<[^>]*>/g, ' ');
    // 合并多个空格
    plainText = plainText.replace(/\s+/g, ' ');
  }
  
  // 截断到指定长度
  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength) + '...';
  }
  
  return plainText;
};

// 格式化评论内容（支持简单的HTML）
const formatCommentContent = (content) => {
  if (!content) return '';
  
  // 如果内容已经是HTML（包含HTML标签），直接返回
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  
  // 否则，将换行符转换为<br>标签
  return content.replace(/\n/g, '<br>');
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

// 格式化相对时间
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

// 返回上一页
const goBack = () => {
  router.go(-1);
};

// 返回首页
const goHome = () => {
  router.push({ name: 'Home' });
};

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { uid: userId } });
};

// 点赞/取消点赞
const toggleLike = () => {
  if (!auth.isLoggedIn()) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  
  // 这里应该调用API进行点赞操作
  // 暂时模拟切换状态
  isLiked.value = !isLiked.value;
  
  if (isLiked.value) {
    post.value.likes += 1;
    message.value = '点赞成功';
    isError.value = false;
  } else {
    post.value.likes -= 1;
    message.value = '已取消点赞';
    isError.value = false;
  }
  
  // 这里应该保存到数据库
  // 暂时只更新本地状态
};

// 聚焦评论输入框
const focusCommentInput = () => {
  if (!auth.isLoggedIn()) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  
  const textarea = document.querySelector('.comment-input');
  if (textarea) {
    textarea.focus();
  }
};

// 添加评论
const addComment = async () => {
  if (!auth.isLoggedIn()) {
    message.value = '请先登录';
    isError.value = true;
    return;
  }
  
  if (!newComment.value.trim()) {
    message.value = '评论内容不能为空';
    isError.value = true;
    return;
  }
  
  const currentUser = auth.getCurrentUser();
  if (!currentUser) {
    message.value = '用户信息获取失败';
    isError.value = true;
    return;
  }
  
  try {
    // 使用postService的addComment函数创建子帖子
    const currentUser = auth.getCurrentUser();
    const result = postService.addComment(postId.value, newComment.value.trim(), currentUser.id, currentUser.username);
    
    if (result.success) {
      // 将新创建的子帖子添加到子帖子列表的开头
      childPosts.value.unshift(result.comment);
      
      // 清空输入框
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

// 检查是否是评论作者
const isCommentAuthor = (comment) => {
  const currentUser = auth.getCurrentUser();
  return currentUser && comment.userId === currentUser.id;
};

// 删除评论（子帖子）
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) {
    return;
  }
  
  try {
    // 调用postService的deleteComment函数
    const currentUser = auth.getCurrentUser();
    const result = postService.deleteComment(commentId, currentUser.id);
    
    if (result.success) {
      // 从子帖子列表中移除
      const commentIndex = childPosts.value.findIndex(c => c.id === commentId);
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

// 删除帖子
const deletePost = () => {
  if (!confirm('确定要删除这篇帖子吗？此操作不可撤销。')) {
    return;
  }
  
  // 这里应该调用API删除帖子
  const currentUser = auth.getCurrentUser();
  const result = postService.deletePost(post.value.id, currentUser.id);
  
  if (result.success) {
    message.value = '帖子删除成功';
    isError.value = false;
    
    // 延迟跳转回首页
    setTimeout(() => {
      router.push({ name: 'Home' });
    }, 1500);
  } else {
    message.value = result.message || '删除失败';
    isError.value = true;
  }
};

// 跳转到父帖子
const goToParentPost = (parentId) => {
  router.push({ name: 'PostDetail', params: { id: parentId } });
};

// 组件挂载时加载帖子详情
onMounted(() => {
  loadPostDetail();
});
</script>

<style scoped>
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
  font-family: 'SmileySans Oblique', sans-serif;
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
  font-family: 'SmileySans Oblique', sans-serif;
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

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.post-category {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  background-color: #f8f9fa;
  color: #495057;
}

.post-category-general { background-color: #6c757d; color: white; }
.post-category-team { background-color: #28a745; color: white; }
.post-category-strategy { background-color: #17a2b8; color: white; }
.post-category-highlight { background-color: #ffc107; color: #212529; }
.post-category-question { background-color: #fd7e14; color: white; }
.post-category-announcement { background-color: #dc3545; color: white; }

.post-date {
  font-size: 0.9rem;
  color: #6c757d;
}

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
  background-color: #f0f2f5; /* 加载时的背景色 */
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
}

.author-username {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
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

.post-body {
  margin-bottom: 30px;
  padding: 25px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.post-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
}

/* 富文本内容样式 */
.post-text h1,
.post-text h2,
.post-text h3 {
  margin: 1em 0 0.5em 0;
  line-height: 1.3;
  font-weight: bold;
}

.post-text h1 {
  font-size: 1.8em;
}

.post-text h2 {
  font-size: 1.5em;
}

.post-text h3 {
  font-size: 1.2em;
}

.post-text ul,
.post-text ol {
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

.post-text strong {
  font-weight: bold;
}

.post-text em {
  font-style: italic;
}

.post-text u {
  text-decoration: underline;
}

.post-text s {
  text-decoration: line-through;
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
  font-family: 'SmileySans Oblique', sans-serif;
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
  margin-bottom: 40px;
}

.action-button {
  padding: 12px 24px;
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

.comments-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #e9ecef;
}

.comments-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
}

.add-comment {
  margin-bottom: 30px;
}

.comment-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s;
}

.comment-input:focus {
  outline: none;
  border-color: #4facfe;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.submit-comment-button {
  padding: 10px 24px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-comment-button:hover:not(:disabled) {
  background-color: #218838;
}

.submit-comment-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  /* 作为头像图片容器 */
}

.comment-author-info {
  display: flex;
  flex-direction: column;
}

.comment-author-name {
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.delete-comment-button {
  padding: 4px 12px;
  background-color: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-comment-button:hover {
  background-color: #dc3545;
  color: white;
}

.comment-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.no-comments {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
}

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

/* 瀑布流布局 */
.waterfall-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.waterfall-item {
  break-inside: avoid;
  page-break-inside: avoid;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #dee2e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.waterfall-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.comment-context {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ced4da;
  font-size: 0.8rem;
  color: #6c757d;
}

.comment-context small {
  font-family: 'SmileySans Oblique', sans-serif;
}

/* 父帖子区域样式 */
.parent-post-section {
  margin: 40px 0;
  padding: 25px;
  background: linear-gradient(135deg, #fff9e6 0%, #ffeaa7 100%);
  border-radius: 16px;
  border: 2px solid #ffd166;
  box-shadow: 0 8px 25px rgba(255, 209, 102, 0.3);
}

.parent-post-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.4rem;
  color: #e17055;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.parent-post-icon {
  font-size: 1.6rem;
}

.parent-post-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #fdcb6e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.parent-post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f2f6;
}

.parent-post-category {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  background-color: #f8f9fa;
  color: #495057;
}

.parent-post-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.parent-post-title-text {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 15px;
  line-height: 1.4;
}

.parent-post-author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.parent-post-avatar {
  width: 36px;
  height: 36px;
  /* 作为头像图片容器 */
}

.parent-post-author-info {
  display: flex;
  flex-direction: column;
}

.parent-post-author-name {
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.parent-post-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.parent-post-content-preview {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #74b9ff;
}

.parent-post-actions {
  display: flex;
  justify-content: flex-end;
}

.parent-post-view-button {
  padding: 8px 20px;
  background-color: #74b9ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.parent-post-view-button:hover {
  background-color: #0984e3;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(116, 185, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .post-detail-container {
    padding: 20px;
  }
  
  .post-title {
    font-size: 1.8rem;
  }
  
  .post-actions {
    flex-wrap: wrap;
  }
  
  .waterfall-layout {
    grid-template-columns: 1fr;
  }
  
  .action-button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}
</style>
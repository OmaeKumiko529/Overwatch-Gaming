// 本地存储键名
const STORAGE_KEYS = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  TEAMS: 'teams',
  POSTS: 'posts'
};

// 帖子管理服务
export const postService = {
  // 获取所有帖子
  getAllPosts() {
    try {
      const postsJson = localStorage.getItem(STORAGE_KEYS.POSTS);
      return postsJson ? JSON.parse(postsJson) : [];
    } catch (error) {
      console.error('读取帖子数据失败:', error);
      return [];
    }
  },

  // 保存所有帖子
  saveAllPosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      return true;
    } catch (error) {
      console.error('保存帖子数据失败:', error);
      return false;
    }
  },

  // 创建新帖子
  createPost(postData, userId, username) {
    const posts = this.getAllPosts();
    
    if (!userId) {
      return { success: false, message: '请先登录' };
    }
    
    // 创建新帖子对象
    const newPost = {
      id: Date.now(),
      userId: userId,
      username: username,
      title: postData.title,
      content: postData.content,
      category: postData.category || 'general',
      likes: 0,
      comments: [],
      context: postData.parentId ? `${postData.parentId}/#` : '#', // 添加上下文属性
      parentId: postData.parentId || null, // 父帖子ID，如果是子帖子
      mentions: postData.mentions || [], // 提及的用户列表
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加到帖子列表
    posts.unshift(newPost); // 添加到开头，最新的帖子在前
    
    // 保存到本地存储
    if (this.saveAllPosts(posts)) {
      return { success: true, post: newPost };
    } else {
      return { success: false, message: '发帖失败，请重试' };
    }
  },

  // 获取用户的所有帖子（包括回复和评论）
  getUserPosts(userId) {
    const posts = this.getAllPosts();
    return posts.filter(post => post.userId === userId);
  },

  // 获取用户的主帖子（不包括回复和评论）
  getUserMainPosts(userId) {
    const posts = this.getAllPosts();
    return posts.filter(post => post.userId === userId && (post.parentId === null || post.parentId === undefined));
  },

  // 获取帖子的所有子帖子（评论）
  getChildPosts(postId) {
    const posts = this.getAllPosts();
    const numericPostId = Number(postId);
    return posts.filter(post => post.parentId === numericPostId);
  },

  // 获取帖子及其所有子帖子
  getPostWithChildren(postId) {
    const post = this.getPostById(postId);
    if (!post) {
      return null;
    }
    
    const childPosts = this.getChildPosts(postId);
    return {
      ...post,
      childPosts: childPosts
    };
  },

  // 根据帖子ID获取帖子详情
  getPostById(postId) {
    const posts = this.getAllPosts();
    const post = posts.find(p => p.id === Number(postId));
    
    if (!post) {
      return null;
    }
    
    // 返回帖子详情（深拷贝避免修改原始数据）
    return JSON.parse(JSON.stringify(post));
  },

  // 删除帖子
  deletePost(postId, userId) {
    const posts = this.getAllPosts();
    
    if (!userId) {
      return { success: false, message: '请先登录' };
    }
    
    const numericPostId = Number(postId);
    const postIndex = posts.findIndex(post => post.id === numericPostId);
    
    if (postIndex === -1) {
      return { success: false, message: '帖子不存在' };
    }
    
    // 检查权限：只有帖子作者可以删除
    if (posts[postIndex].userId !== userId) {
      return { success: false, message: '无权删除此帖子' };
    }
    
    // 删除帖子
    posts.splice(postIndex, 1);
    
    if (this.saveAllPosts(posts)) {
      return { success: true };
    } else {
      return { success: false, message: '删除失败' };
    }
  },

  // 点赞帖子
  likePost(postId) {
    const posts = this.getAllPosts();
    const numericPostId = Number(postId);
    const postIndex = posts.findIndex(post => post.id === numericPostId);
    
    if (postIndex === -1) {
      return { success: false, message: '帖子不存在' };
    }
    
    posts[postIndex].likes += 1;
    posts[postIndex].updatedAt = new Date().toISOString();
    
    if (this.saveAllPosts(posts)) {
      return { success: true, likes: posts[postIndex].likes };
    } else {
      return { success: false, message: '点赞失败' };
    }
  },

  // 添加评论（创建子帖子）
  addComment(postId, commentText, userId, username) {
    const posts = this.getAllPosts();
    
    if (!userId) {
      return { success: false, message: '请先登录' };
    }
    
    // 将postId转换为数字进行比较
    const numericPostId = Number(postId);
    const parentPostIndex = posts.findIndex(post => post.id === numericPostId);
    
    if (parentPostIndex === -1) {
      return { success: false, message: '帖子不存在' };
    }
    
    // 创建子帖子（评论）
    const childPost = {
      id: Date.now(),
      userId: userId,
      username: username,
      title: `回复: ${posts[parentPostIndex].title.substring(0, 30)}...`, // 简化的标题
      content: commentText,
      category: 'comment', // 特殊分类表示评论
      likes: 0,
      comments: [],
      context: `${numericPostId}/#`, // 上下文属性：父帖子id/#
      parentId: numericPostId, // 父帖子ID（数字类型）
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加到帖子列表
    posts.unshift(childPost);
    
    // 保存到本地存储
    if (this.saveAllPosts(posts)) {
      return { success: true, comment: childPost };
    } else {
      return { success: false, message: '评论失败' };
    }
  },

  // 删除评论（子帖子）
  deleteComment(commentId, userId) {
    const posts = this.getAllPosts();
    
    if (!userId) {
      return { success: false, message: '请先登录' };
    }
    
    const numericCommentId = Number(commentId);
    const commentIndex = posts.findIndex(post => post.id === numericCommentId);
    
    if (commentIndex === -1) {
      return { success: false, message: '评论不存在' };
    }
    
    // 检查权限：只有评论作者或帖子作者可以删除评论
    const comment = posts[commentIndex];
    const isCommentAuthor = comment.userId === userId;
    
    // 如果是评论，还需要检查是否是帖子作者
    let isPostAuthor = false;
    if (comment.parentId) {
      const parentPost = posts.find(post => post.id === comment.parentId);
      if (parentPost && parentPost.userId === userId) {
        isPostAuthor = true;
      }
    }
    
    if (!isCommentAuthor && !isPostAuthor) {
      return { success: false, message: '无权删除此评论' };
    }
    
    // 删除评论
    posts.splice(commentIndex, 1);
    
    if (this.saveAllPosts(posts)) {
      return { success: true };
    } else {
      return { success: false, message: '删除失败' };
    }
  },

  // 搜索帖子（按标题或内容）
  searchPosts(query) {
    const posts = this.getAllPosts();
    const lowerQuery = query.toLowerCase();
    
    return posts.filter(post => {
      // 搜索标题
      const titleMatch = post.title.toLowerCase().includes(lowerQuery);
      
      // 搜索内容（去除HTML标签后搜索纯文本）
      let contentText = post.content;
      // 简单去除HTML标签
      if (contentText.includes('<') && contentText.includes('>')) {
        contentText = contentText.replace(/<[^>]*>/g, ' ');
      }
      const contentMatch = contentText.toLowerCase().includes(lowerQuery);
      
      return titleMatch || contentMatch;
    });
  },

  // 获取热门帖子（按点赞数排序）
  getPopularPosts(limit = 10) {
    const posts = this.getAllPosts();
    
    return posts
      .filter(post => !post.parentId) // 只包括主帖子，不包括评论
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  },

  // 获取最新帖子
  getLatestPosts(limit = 20) {
    const posts = this.getAllPosts();
    
    return posts
      .filter(post => !post.parentId) // 只包括主帖子，不包括评论
      .slice(0, limit);
  },

  // 获取帖子分类
  getPostCategories() {
    const posts = this.getAllPosts();
    const categories = new Set();
    
    posts.forEach(post => {
      if (post.category && !post.parentId) { // 只统计主帖子的分类
        categories.add(post.category);
      }
    });
    
    return Array.from(categories);
  },

  // 按分类获取帖子
  getPostsByCategory(category, limit = 20) {
    const posts = this.getAllPosts();
    
    return posts
      .filter(post => post.category === category && !post.parentId)
      .slice(0, limit);
  },

  // 更新帖子内容
  updatePost(postId, updates, userId) {
    const posts = this.getAllPosts();
    const numericPostId = Number(postId);
    const postIndex = posts.findIndex(post => post.id === numericPostId);
    
    if (postIndex === -1) {
      return { success: false, message: '帖子不存在' };
    }
    
    // 检查权限：只有帖子作者可以更新
    if (posts[postIndex].userId !== userId) {
      return { success: false, message: '无权更新此帖子' };
    }
    
    // 更新帖子
    posts[postIndex] = {
      ...posts[postIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (this.saveAllPosts(posts)) {
      return { success: true, post: posts[postIndex] };
    } else {
      return { success: false, message: '更新失败' };
    }
  }
};

// 导出默认实例
export default postService;
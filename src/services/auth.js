// 认证服务模块 - 处理用户认证、注册、登录和用户管理
// 使用localStorage进行数据持久化存储

// 本地存储键名常量定义
const STORAGE_KEYS = {
  USERS: 'users',          // 存储所有用户数据
  CURRENT_USER: 'currentUser', // 存储当前登录用户
  TEAMS: 'teams',          // 存储团队数据
  POSTS: 'posts'           // 存储帖子数据
};

import { ROLE_OPTIONS, validateRoles } from '../constants/roles.js';

// 用户管理工具对象（导出为auth）
export const auth = {
  // 获取所有用户数据
  // @returns {Array} - 用户数组，如果读取失败则返回空数组
  getAllUsers() {
    try {
      // 从localStorage读取用户数据
      const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
      // 解析JSON数据，如果不存在则返回空数组
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      // 捕获并记录JSON解析错误
      console.error('读取用户数据失败:', error);
      return [];
    }
  },

  // 保存所有用户数据到localStorage
  // @param {Array} users - 要保存的用户数组
  // @returns {boolean} - 保存是否成功
  saveAllUsers(users) {
    try {
      // 将用户数组转换为JSON字符串并存储
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    } catch (error) {
      // 捕获并记录存储错误
      console.error('保存用户数据失败:', error);
      return false;
    }
  },

  // 注册新用户
  // @param {Object} userData - 用户注册数据（包含username, email, password等）
  // @returns {Object} - 注册结果对象，包含success属性和可选的message属性
  registerUser(userData) {
    // 获取现有所有用户
    const users = this.getAllUsers();
    
    // 检查用户名是否已存在
    if (users.some(user => user.username === userData.username)) {
      return { success: false, message: '用户名已存在' };
    }
    
    // 检查邮箱是否已存在
    if (users.some(user => user.email === userData.email)) {
      return { success: false, message: '邮箱已被注册' };
    }
    
    // 创建新用户对象
    const newUser = {
      id: Date.now(),  // 使用时间戳作为唯一ID
      username: userData.username,  // 用户名
      email: userData.email,        // 邮箱
      password: userData.password,  // 密码（明文存储，实际应用中应加密）
      role: [ROLE_OPTIONS.FLEXIBLE], // 默认职责为灵活（使用数组）
      avatar: '/Head.png', // 默认头像路径
      createdAt: new Date().toISOString(),  // 创建时间
      updatedAt: new Date().toISOString()   // 更新时间
    };
    
    // 添加到用户列表
    users.push(newUser);
    
    // 保存到本地存储
    if (this.saveAllUsers(users)) {
      return { success: true, user: newUser };
    } else {
      return { success: false, message: '注册失败，请重试' };
    }
  },

  // 用户登录
  login(username, password, rememberMe = false) {
    const users = this.getAllUsers();
    
    // 查找用户（支持用户名或邮箱登录）
    const user = users.find(u =>
      u.username === username || u.email === username
    );
    
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    
    if (user.password !== password) {
      return { success: false, message: '密码错误' };
    }
    
    // 创建会话对象
    const session = {
      id: user.id,
      username: user.username,
      email: user.email,
      // 确保role是数组（处理旧数据可能是字符串的情况）
      role: Array.isArray(user.role) ? user.role : [user.role || 'flexible'],
      avatar: user.avatar || '/Head.png', // 头像字段，默认为默认头像
      loggedIn: true,
      loginTime: new Date().toISOString(),
      rememberMe: rememberMe
    };
    
    // 保存会话
    this.saveSession(session, rememberMe);
    
    return { success: true, user: session };
  },

  // 保存会话
  saveSession(session, rememberMe = false) {
    try {
      if (rememberMe) {
        // 长期保存（30天）
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      } else {
        // 会话级保存
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      }
      return true;
    } catch (error) {
      console.error('保存会话失败:', error);
      return false;
    }
  },

  // 获取当前用户
  getCurrentUser() {
    try {
      // 先检查 sessionStorage
      let sessionJson = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      
      // 如果没有，检查 localStorage
      if (!sessionJson) {
        sessionJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      }
      
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        // 检查会话是否过期（如果是长期保存的）
        if (session.rememberMe) {
          const loginTime = new Date(session.loginTime);
          const now = new Date();
          const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
          
          // 如果超过30天，清除会话
          if (daysDiff > 30) {
            this.logout();
            return null;
          }
        }
        return session;
      }
      return null;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  },

  // 检查是否已登录
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  // 获取当前用户名
  getCurrentUsername() {
    const user = this.getCurrentUser();
    return user ? user.username : null;
  },

  // 注销
  logout() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return true;
    } catch (error) {
      console.error('注销失败:', error);
      return false;
    }
  },

  // 验证密码强度
  validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, message: '密码长度至少为6位' };
    }
    
    // 可以添加更多密码强度规则
    // if (!/[A-Z]/.test(password)) {
    //   return { valid: false, message: '密码必须包含大写字母' };
    // }
    // if (!/[0-9]/.test(password)) {
    //   return { valid: false, message: '密码必须包含数字' };
    // }
    
    return { valid: true };
  },

  // 初始化测试数据（仅用于开发）
  initTestData() {
    const users = this.getAllUsers();
    if (users.length === 0) {
      const testUsers = [
        {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'flexible', // 添加role字段
          avatar: '/Head.png', // 默认头像
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          username: 'demo',
          email: 'demo@example.com',
          password: 'demo123',
          role: 'flexible', // 添加role字段
          avatar: '/Head.png', // 默认头像
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(testUsers));
      console.log('测试数据已初始化');
    }
  }
};

// 导出默认实例
export default auth;
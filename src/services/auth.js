// čŽ¤čŻćĺĄć¨Ąĺ - ĺ¤çç¨ćˇčŽ¤čŻăćł¨ĺăçťĺ˝ĺç¨ćˇçŽĄç
// ä˝żç¨localStoragečżčĄŒć°ćŽćäšĺĺ­ĺ?

// ćŹĺ°ĺ­ĺ¨éŽĺĺ¸¸éĺŽäš
const STORAGE_KEYS = {
  USERS: 'users',          // ĺ­ĺ¨ććç¨ćˇć°ćŽ
  CURRENT_USER: 'currentUser', // ĺ­ĺ¨ĺ˝ĺçťĺ˝ç¨ćˇ
  TEAMS: 'teams',          // ĺ­ĺ¨ĺ˘éŸć°ćŽ
  POSTS: 'posts'           // ĺ­ĺ¨ĺ¸ĺ­ć°ćŽ
};

import { ROLE_OPTIONS, validateRoles } from '../constants/roles.js';

// ç¨ćˇçŽĄçĺˇĽĺˇĺŻščąĄďźĺŻźĺşä¸şauthďź
export const auth = {
  // čˇĺććç¨ćˇć°ćŽ
  // @returns {Array} - ç¨ćˇć°çťďźĺŚćčŻťĺĺ¤ąč´ĽĺčżĺçŠşć°çť
  getAllUsers() {
    try {
      // äťlocalStoragečŻťĺç¨ćˇć°ćŽ
      const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
      // č§ŁćJSONć°ćŽďźĺŚćä¸ĺ­ĺ¨ĺčżĺçŠşć°çť
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      // ćčˇĺšśčŽ°ĺ˝•JSONč§ŁćéčŻŻ
      console.error('čŻťĺç¨ćˇć°ćŽĺ¤ąč´Ľ:', error);
      return [];
    }
  },

  // äżĺ­ććç¨ćˇć°ćŽĺ°localStorage
  // @param {Array} users - čŚäżĺ­çç¨ćˇć°çť
  // @returns {boolean} - äżĺ­ćŻĺŚćĺ
  saveAllUsers(users) {
    try {
      // ĺ°ç¨ćˇć°çťč˝Źć˘ä¸şJSONĺ­çŹŚä¸˛ĺšśĺ­ĺ¨
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    } catch (error) {
      // ćčˇĺšśčŽ°ĺ˝•ĺ­ĺ¨éčŻŻ
      console.error('äżĺ­ç¨ćˇć°ćŽĺ¤ąč´Ľ:', error);
      return false;
    }
  },

  // ćł¨ĺć°ç¨ćˇ
  // @param {Object} userData - ç¨ćˇćł¨ĺć°ćŽďźĺĺŤusername, email, passwordç­ďź
  // @returns {Object} - ćł¨ĺçťćĺŻščąĄďźĺĺŤsuccessĺąć§ĺŒĺŻéçmessageĺąć§
  registerUser(userData) {
    // čˇĺçŽ°ćććç¨ćˇ
    const users = this.getAllUsers();
    
    // ćŁ€ćŸĽç¨ćˇĺćŻĺŚĺˇ˛ĺ­ĺ¨
    if (users.some(user => user.username === userData.username)) {
      return { success: false, message: 'ç¨ćˇĺĺˇ˛ĺ­ĺ¨' };
    }
    
    // ćŁ€ćŸĽéŽçŽąćŻĺŚĺˇ˛ĺ­ĺ¨
    if (users.some(user => user.email === userData.email)) {
      return { success: false, message: 'éŽçŽąĺˇ˛č˘Ťćł¨ĺ' };
    }
    
    // ĺĺťşć°ç¨ćˇĺŻščąĄ
    const newUser = {
      id: Date.now(),  // ä˝żç¨ćśé´ćłä˝œä¸şĺŻä¸€ID
      username: userData.username,  // ç¨ćˇĺ
      email: userData.email,        // éŽçŽą
      password: userData.password,  // ĺŻ†ç ďźćŽć‡ĺ­ĺ¨ďźĺŽé™…ĺş”ç¨ä¸­ĺş”ĺŒ ĺŻ†ďź
      role: [ROLE_OPTIONS.FLEXIBLE], // éťčŽ¤čŒč´Łä¸şçľć´ťďźä˝żç¨ć°çťďź
      avatar: '/default-avatar.webp', // éťčŽ¤ĺ¤´ĺčˇŻĺž„
      createdAt: new Date().toISOString(),  // ĺĺťşćśé´
      updatedAt: new Date().toISOString()   // ć´ć°ćśé´
    };
    
    // ćˇťĺŒ ĺ°ç¨ćˇĺˆ—čĄ¨
    users.push(newUser);
    
    // äżĺ­ĺ°ćŹżĺœ°ĺ­ĺ¨
    if (this.saveAllUsers(users)) {
      return { success: true, user: newUser };
    } else {
      return { success: false, message: 'ćł¨ĺŒĺ¤ąč´ĽďźŒčŻˇé‡čŻ•' };
    }
  },

  // ç¨ćˇçťĺ˝•
  login(username, password, rememberMe = false) {
    const users = this.getAllUsers();
    
    // ćŸĽć‰žç¨ćˇďźćŻćŒç¨ćˇĺćˆ–éŽçŽąçťĺ˝•ďź
    const user = users.find(u =>
      u.username === username || u.email === username
    );
    
    if (!user) {
      return { success: false, message: 'ç¨ćˇä¸ĺ­ĺ¨' };
    }
    
    if (user.password !== password) {
      return { success: false, message: 'ĺŻ†ç é”™čŻŻ' };
    }
    
    // ĺĺťşäźščŻĺŻščąĄ
    const session = {
      id: user.id,
      username: user.username,
      email: user.email,
      // çĄŽäżrolećŻć°çťďźĺ¤„çć—§ć°ćŽĺŻčƒ˝ćŻĺ­—çŹŚä¸˛çš„ćƒ…ĺ†ľďź
      role: Array.isArray(user.role) ? user.role : [user.role || 'flexible'],
      avatar: user.avatar || '/default-avatar.webp', // ĺ¤´ĺĺ­—ćŽľďźŒéťčŽ¤ä¸şéťčŽ¤ĺ¤´ĺ
      loggedIn: true,
      loginTime: new Date().toISOString(),
      rememberMe: rememberMe
    };
    
    // äżĺ­äźščŻ
    this.saveSession(session, rememberMe);
    
    return { success: true, user: session };
  },

  // äżĺ­äźščŻ
  saveSession(session, rememberMe = false) {
    try {
      if (rememberMe) {
        // é•żćœŸäżĺ­ďźˆ30ĺ¤Šďź
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      } else {
        // äźščŻçş§äżĺ­˜
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      }
      return true;
    } catch (error) {
      console.error('äżĺ­äźščŻĺ¤ąč´Ľ:', error);
      return false;
    }
  },

  // čˇĺĺ˝ĺ‰ç¨ćˇ
  getCurrentUser() {
    try {
      // ĺ…ˆćŁ€ćŸĽsessionStorage
      let sessionJson = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      
      // ĺŚ‚ćžœć˛Ąćœ‰ďźŒćŁ€ćŸĽlocalStorage
      if (!sessionJson) {
        sessionJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      }
      
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        // ćŁ€ćŸĽäźščŻć˜ŻĺŚčż‡ćœŸďźˆĺŚ‚ćžœć˜Żé•żćœŸäżĺ­˜çš„ďź‰
        if (session.rememberMe) {
          const loginTime = new Date(session.loginTime);
          const now = new Date();
          const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
          
          // ĺŚ‚ćžœčś…čż‡30ĺ¤ŠďźŒć¸…é™¤äźščŻ
          if (daysDiff > 30) {
            this.logout();
            return null;
          }
        }
        return session;
      }
      return null;
    } catch (error) {
      console.error('čˇĺĺ˝ĺ‰ç¨ćˇĺ¤ąč´Ľ:', error);
      return null;
    }
  },

  // ćŁ€ćŸĽć˜ŻĺŚĺˇ˛çťĺ˝•
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  // čˇĺĺ˝ĺ‰ç¨ćˇĺ
  getCurrentUsername() {
    const user = this.getCurrentUser();
    return user ? user.username : null;
  },

  // ćł¨é”€
  logout() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return true;
    } catch (error) {
      console.error('ćł¨é”€ĺ¤ąč´Ľ:', error);
      return false;
    }
  },

  // éŞŒčŻĺŻ†ç ĺźşĺşŚ
  validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, message: 'ĺŻ†ç é•żĺşŚč‡łĺ°‘ä¸ş6ä˝' };
    }
    
    // ĺŻäťĽćˇťĺŠ ć›´ĺ¤šĺŻ†ç ĺźşĺşŚč§„ĺˆ™
    // if (!/[A-Z]/.test(password)) {
    //   return { valid: false, message: 'ĺŻ†ç ĺż…éĄťĺŒ…ĺŤĺ¤§ĺ†™ĺ­—ćŻ' };
    // }
    // if (!/[0-9]/.test(password)) {
    //   return { valid: false, message: 'ĺŻ†ç ĺż…éĄťĺŒ…ĺŤć•°ĺ­—' };
    // }
    
    return { valid: true };
  },

  // ĺˆĺ§‹ĺŒ–ćľ‹čŻ•ć•°ćŽďźˆäť…ç”¨äşŽĺź€ĺ‘ďź‰
  initTestData() {
    const users = this.getAllUsers();
    if (users.length === 0) {
      const testUsers = [
        {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'flexible', // ćˇťĺŠ roleĺ­—ćŽľ
          avatar: '/default-avatar.webp', // éťčŽ¤ĺ¤´ĺ
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          username: 'demo',
          email: 'demo@example.com',
          password: 'demo123',
          role: 'flexible', // ćˇťĺŠ roleĺ­—ćŽľ
          avatar: '/default-avatar.webp', // éťčŽ¤ĺ¤´ĺ
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(testUsers));
      console.log('ćľ‹čŻ•ć°ćŽĺˇ˛ĺˆĺ§‹ĺŒ–');
    }
  }
};

// ĺŻźĺ‡şéť˜čŽ¤ĺŽžäž‹
export default auth;
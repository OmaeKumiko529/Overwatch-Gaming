/**
 * 从浏览器 localStorage 迁移数据到 SQL 服务端
 * 
 * 使用方法：
 * 1. 登录到网站（http://localhost:5173）
 * 2. 打开浏览器开发者工具 (F12) → Console
 * 3. 复制粘贴整个脚本并按回车运行
 * 
 * 注意：迁移过程中请不要关闭页面
 */

const API_BASE = '/api'

async function request(endpoint, options = {}) {
  const { method = 'GET', body } = options
  const headers = { 'Content-Type': 'application/json' }
  
  // 从当前会话获取 token
  const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
  if (sessionJson) {
    const session = JSON.parse(sessionJson)
    if (session.token) {
      headers['Authorization'] = `Bearer ${session.token}`
    }
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
    return await res.json()
  } catch (e) {
    console.error(`请求失败 ${endpoint}:`, e)
    return { success: false, message: e.message }
  }
}

async function migrate() {
  console.log('🔄 开始从 localStorage 迁移数据到 SQL 服务端...\n')
  
  // 1. 检查登录状态
  const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
  if (!sessionJson) {
    console.error('❌ 请先登录后再运行此脚本')
    return
  }
  const currentUser = JSON.parse(sessionJson)
  console.log(`✅ 当前登录用户: ${currentUser.username} (ID: ${currentUser.id})`)
  console.log(`✅ Token: ${currentUser.token?.substring(0, 20)}...`)
  
  // 2. 迁移用户
  console.log('\n--- 迁移用户 ---')
  const usersJson = localStorage.getItem('users')
  if (usersJson) {
    const users = JSON.parse(usersJson)
    console.log(`找到 ${users.length} 个 localStorage 用户（仅迁移非 Admin 的 API 注册用户）`)
    // 注意：旧系统的密码是明文的，无法迁移到 bcrypt 哈希，只能提示用户重新注册
    console.log('⚠️ 旧系统的密码是明文存储的，无法直接迁移到 bcrypt 加密格式')
    console.log('⚠️ 旧用户需要通过注册页面重新注册')
  } else {
    console.log('❌ 未找到老的 localStorage 用户数据')
  }
  
  // 3. 迁移帖子
  console.log('\n--- 迁移帖子 ---')
  const postsJson = localStorage.getItem('posts')
  if (postsJson) {
    const posts = JSON.parse(postsJson)
    console.log(`找到 ${posts.length} 个帖子`)
    let migrated = 0
    let failed = 0
    
    for (const post of posts) {
      // 只迁移主帖子（跳过评论/回复）
      if (post.parentId || post.category === 'comment') {
        console.log(`⏭️ 跳过评论 #${post.id} (属于帖子 #${post.parentId})`)
        continue
      }
      
      // 检查作者用户是否存在（通过 API 查找）
      const userRes = await request(`/auth/users/${post.userId}`)
      if (!userRes.success) {
        console.log(`⏭️ 跳过帖子 #${post.id} "${post.title}" — 作者 ${post.username}(ID:${post.userId}) 不存在`)
        continue
      }
      
      console.log(`📤 迁移帖子 #${post.id} "${post.title}"...`)
      const res = await request('/posts', {
        method: 'POST',
        body: {
          title: post.title,
          content: post.content,
          category: post.category || 'general',
          mentions: []
        }
      })
      
      if (res.success) {
        migrated++
        // 如果是管理员帖子且有 likes，更新点赞数
        if (post.likes > 0) {
          // likes 通过额外 API 更新（不通知帖主）
          await fetch(`${API_BASE}/posts/${res.post.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ likes: post.likes })
          }).catch(() => {})
        }
        
        // 迁移评论
        const childPosts = posts.filter(p => p.parentId === post.id)
        if (childPosts.length > 0) {
          console.log(`   ⏩ 迁移 ${childPosts.length} 条评论...`)
          for (const child of childPosts) {
            const childRes = await request(`/posts/${res.post.id}/comment`, {
              method: 'POST',
              body: { content: child.content }
            })
            if (childRes.success) migrated++
            else failed++
          }
        }
      } else {
        failed++
        console.error(`❌ 迁移帖子 #${post.id} 失败: ${res.message}`)
      }
    }
    
    console.log(`\n✅ 帖子迁移完成: 成功 ${migrated}, 失败 ${failed}`)
  } else {
    console.log('❌ 未找到老的 localStorage 帖子数据')
  }
  
  // 4. 迁移战队
  console.log('\n--- 迁移战队 ---')
  const teamsJson = localStorage.getItem('teams')
  if (teamsJson) {
    const teams = JSON.parse(teamsJson)
    console.log(`找到 ${teams.length} 个战队`)
    let migrated = 0
    let failed = 0
    
    for (const team of teams) {
      // 检查创建者是否存在
      const creatorRes = await request(`/auth/users/${team.creatorId}`)
      if (!creatorRes.success) {
        console.log(`⏭️ 跳过战队 "${team.displayName}" — 创建者 (ID:${team.creatorId}) 不存在`)
        continue
      }
      
      console.log(`📤 迁移战队 "${team.displayName}"...`)
      const res = await request('/teams', {
        method: 'POST',
        body: { teamName: team.displayName }
      })
      
      if (res.success) {
        migrated++
        // 迁移成员
        if (team.memberIds && team.memberIds.length > 0) {
          for (const memberId of team.memberIds) {
            if (Number(memberId) === Number(team.creatorId)) continue
            const memberRes = await request(`/auth/users/${memberId}`)
            if (memberRes.success) {
              // 注意：新的团队系统通过用户加入机制，这里由用户自行加入
              console.log(`   ⏩ 成员 UID:${memberId} (${memberRes.user.username}) 需要自行搜索加入战队`)
            }
          }
        }
      } else {
        failed++
        console.error(`❌ 迁移战队 "${team.displayName}" 失败: ${res.message}`)
      }
    }
    
    console.log(`\n✅ 战队迁移完成: 成功 ${migrated}, 失败 ${failed}`)
  } else {
    console.log('❌ 未找到老的 localStorage 战队数据')
  }
  
  console.log('\n🎉 迁移完成！')
  console.log('')
  console.log('📌 注意事项:')
  console.log('1. 旧用户（不是通过新注册页面注册的）需要重新注册')
  console.log('2. 旧帖子作者可能不匹配，已自动跳过')
  console.log('3. 战队的旧成员需要自行重新加入战队')
  console.log('4. 刷新页面查看迁移后的数据')
}

// 执行迁移
migrate().catch(e => console.error('迁移脚本出错:', e))
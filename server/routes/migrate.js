import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 迁移端点：接收浏览器 localStorage 数据并写入 SQL 数据库
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 检查是否为管理员 (userrank >= 3)
    const user = getOne('SELECT userrank FROM users WHERE id = ?', [req.user.id])
    if (!user || Number(user.userrank) < 3) {
      return res.json({ success: false, message: '仅管理员可执行迁移' })
    }

    const { users, posts, teams } = req.body
    const result = { users: 0, posts: 0, teams: 0, errors: [] }

    // 1. 迁移用户（旧系统密码为明文，用 bcrypt 加密重新创建）
    if (users && Array.isArray(users)) {
      for (const oldUser of users) {
        try {
          // 跳过已存在的用户（用 Admin 用户登录，不需要迁移 Admin 本身）
          const existing = getOne('SELECT id FROM users WHERE username = ? OR email = ?', [oldUser.username, oldUser.email])
          if (existing) {
            continue
          }
          const passwordHash = await bcrypt.hash(oldUser.password, 10)
          insert(
            'INSERT INTO users (username, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)',
            [oldUser.username, oldUser.email, passwordHash, JSON.stringify(oldUser.role || ['flexible']), oldUser.avatar || '/default-avatar.png']
          )
          result.users++
        } catch (e) {
          result.errors.push(`用户 ${oldUser.username}: ${e.message}`)
        }
      }
    }

    // 2. 迁移帖子
    if (posts && Array.isArray(posts)) {
      // 先迁移主帖子（parent_id 为 null）
      const mainPosts = posts.filter(p => !p.parentId && p.category !== 'comment')
      for (const post of mainPosts) {
        try {
          // 查找作者在新系统中的 ID
          const author = getOne('SELECT id, username FROM users WHERE username = ?', [post.username])
          if (!author) {
            result.errors.push(`帖子 "${post.title}" — 作者 ${post.username} 不存在，跳过`)
            continue
          }
          
          const postResult = insert(
            'INSERT INTO posts (user_id, username, title, content, category, likes, context, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [author.id, author.username, post.title, post.content, post.category || 'general', post.likes || 0, post.context || '#', post.createdAt || new Date().toISOString()]
          )
          const newPostId = postResult.lastInsertRowid
          result.posts++

          // 迁移该主帖子的评论
          const childPosts = posts.filter(p => Number(p.parentId) === Number(post.id))
          if (childPosts.length > 0) {
            for (const child of childPosts) {
              try {
                const childAuthor = getOne('SELECT id, username FROM users WHERE username = ?', [child.username]) || author
                const context = `${newPostId}/#`
                insert(
                  'INSERT INTO posts (user_id, username, title, content, category, context, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  [childAuthor.id, child.username, child.title || `回复: ${post.title.substring(0, 30)}...`, child.content, 'comment', context, newPostId, child.createdAt || new Date().toISOString()]
                )
                result.posts++
              } catch (e) {
                result.errors.push(`评论 #${child.id}: ${e.message}`)
              }
            }
          }
        } catch (e) {
          result.errors.push(`帖子 "${post.title}": ${e.message}`)
        }
      }
    }

    // 3. 迁移战队
    if (teams && Array.isArray(teams)) {
      for (const team of teams) {
        try {
          const creator = getOne('SELECT id, username FROM users WHERE id = ?', [team.creatorId])
          if (!creator) {
            result.errors.push(`战队 "${team.displayName}" — 创建者 (ID:${team.creatorId}) 不存在，跳过`)
            continue
          }
          // 检查是否已存在同名战队
          const existingTeam = getOne('SELECT id FROM teams WHERE name = ?', [team.name])
          if (existingTeam) {
            continue
          }
          const teamResult = insert(
            'INSERT INTO teams (name, display_name, creator_id) VALUES (?, ?, ?)',
            [team.name, team.displayName, creator.id]
          )
          const newTeamId = teamResult.lastInsertRowid

          // 将创建者添加到 team_members
          insert(
            'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
            [newTeamId, creator.id]
          )
          // 更新创建者的 team_id
          run('UPDATE users SET team_id = ? WHERE id = ?', [newTeamId, creator.id])

          // 迁移其他成员
          if (team.memberIds && Array.isArray(team.memberIds)) {
            for (const memberId of team.memberIds) {
              if (Number(memberId) === Number(team.creatorId)) continue
              const member = getOne('SELECT id FROM users WHERE id = ?', [Number(memberId)])
              if (member) {
                try {
                  insert('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [newTeamId, member.id])
                  run('UPDATE users SET team_id = ? WHERE id = ?', [newTeamId, member.id])
                } catch {}
              }
            }
          }
          result.teams++
        } catch (e) {
          result.errors.push(`战队 "${team.displayName}": ${e.message}`)
        }
      }
    }

    res.json({ success: true, result })
  } catch (error) {
    console.error('迁移失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
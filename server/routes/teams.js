import { Router } from 'express'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 获取所有战队
router.get('/', (req, res) => {
  try {
    const teams = getAll(`
      SELECT t.*, u.username as creator_username,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.creator_id = u.id
      ORDER BY t.created_at DESC
    `)

    res.json({
      success: true,
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        displayName: t.display_name,
        creatorId: t.creator_id,
        creatorUsername: t.creator_username,
        memberCount: t.member_count,
        createdAt: t.created_at
      }))
    })
  } catch (error) {
    console.error('获取战队列表失败:', error)
    res.status(500).json({ success: false, message: '获取战队列表失败' })
  }
})

// 创建战队
router.post('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const { teamName } = req.body

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) return res.json({ success: false, message: '用户不存在' })
    if (user.team_id) return res.json({ success: false, message: '您已经加入了其他战队，请先退出' })

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const fullTeamName = `${teamName}#${randomSuffix}`

    const existing = getOne('SELECT id FROM teams WHERE name = ?', [fullTeamName])
    if (existing) return res.json({ success: false, message: '战队名称已存在，请重试' })

    try {
      run('BEGIN TRANSACTION')

      const result = insert(
        'INSERT INTO teams (name, display_name, creator_id) VALUES (?, ?, ?)',
        [fullTeamName, teamName, userId]
      )

      const teamId = result.lastInsertRowid

      insert('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [teamId, userId])
      run("UPDATE users SET team_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [teamId, userId])

      run('COMMIT')

      res.json({
        success: true,
        team: {
          id: teamId,
          name: fullTeamName,
          displayName: teamName,
          creatorId: userId,
          createdAt: new Date().toISOString(),
          memberIds: [userId]
        }
      })
    } catch {
      run('ROLLBACK')
      res.json({ success: false, message: '创建战队失败，请重试' })
    }
  } catch (error) {
    console.error('创建战队失败:', error)
    res.status(500).json({ success: false, message: '创建战队失败' })
  }
})

// 加入战队
router.post('/join', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const { teamName } = req.body

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) return res.json({ success: false, message: '用户不存在' })
    if (user.team_id) return res.json({ success: false, message: '您已经加入了其他战队，请先退出' })

    const team = getOne('SELECT * FROM teams WHERE name = ?', [teamName])
    if (!team) return res.json({ success: false, message: '战队不存在，请检查战队名称' })

    const isMember = getOne('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [team.id, userId])
    if (isMember) return res.json({ success: false, message: '您已经是该战队的成员' })

    try {
      run('BEGIN TRANSACTION')
      insert('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [team.id, userId])
      run("UPDATE users SET team_id = ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [team.id, userId])
      run('COMMIT')

      res.json({ success: true, team: { id: team.id, name: team.name, displayName: team.display_name } })
    } catch {
      run('ROLLBACK')
      res.json({ success: false, message: '加入战队失败' })
    }
  } catch (error) {
    console.error('加入战队失败:', error)
    res.status(500).json({ success: false, message: '加入战队失败' })
  }
})

// 退出战队
router.post('/leave', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) return res.json({ success: false, message: '用户不存在' })
    if (!user.team_id) return res.json({ success: false, message: '您尚未加入任何战队' })

    const team = getOne('SELECT * FROM teams WHERE id = ?', [user.team_id])
    if (!team) {
      run("UPDATE users SET team_id = NULL, updated_at = datetime('now', 'localtime') WHERE id = ?", [userId])
      return res.json({ success: false, message: '战队不存在，已自动清除关联' })
    }

    let teamDeleted = false
    try {
      run('BEGIN TRANSACTION')
      run('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [team.id, userId])
      run("UPDATE users SET team_id = NULL, updated_at = datetime('now', 'localtime') WHERE id = ?", [userId])

      const memberCount = getOne('SELECT COUNT(*) as cnt FROM team_members WHERE team_id = ?', [team.id])
      if (memberCount.cnt === 0) {
        run('DELETE FROM teams WHERE id = ?', [team.id])
        teamDeleted = true
      }
      run('COMMIT')
    } catch {
      run('ROLLBACK')
      return res.json({ success: false, message: '退出战队失败' })
    }

    res.json({ success: true, teamDeleted })
  } catch (error) {
    console.error('退出战队失败:', error)
    res.status(500).json({ success: false, message: '退出战队失败' })
  }
})

// 获取战队详情及成员
router.get('/:id', (req, res) => {
  try {
    const teamId = Number(req.params.id)
    const team = getOne('SELECT * FROM teams WHERE id = ?', [teamId])
    if (!team) return res.json({ success: false, message: '战队不存在' })

    const members = getAll(`
      SELECT u.id, u.username, u.nickname, u.role, u.avatar, tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `, [teamId])

    res.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        displayName: team.display_name,
        creatorId: team.creator_id,
        createdAt: team.created_at,
        members: members.map(m => ({
          id: m.id,
          username: m.username,
          nickname: m.nickname || null,
          displayName: m.nickname || m.username,
          role: JSON.parse(m.role || '["flexible"]'),
          avatar: m.avatar || '/Head.png',
          joinedAt: m.joined_at
        }))
      }
    })
  } catch (error) {
    console.error('获取战队详情失败:', error)
    res.status(500).json({ success: false, message: '获取战队详情失败' })
  }
})

export default router
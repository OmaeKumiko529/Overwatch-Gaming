// 战队 Store - 管理战队 CRUD 操作
import { defineStore } from 'pinia'

const STORAGE_KEYS = {
  TEAMS: 'teams',
  USERS: 'users',
  CURRENT_USER: 'currentUser'
}

export const useTeamStore = defineStore('team', () => {
  function getFromStorage(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`读取 ${key} 数据失败:`, error)
      return []
    }
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error(`保存 ${key} 数据失败:`, error)
      return false
    }
  }

  function getCurrentUser() {
    try {
      let sessionJson = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      if (!sessionJson) {
        sessionJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      }
      return sessionJson ? JSON.parse(sessionJson) : null
    } catch { return null }
  }

  function saveSession(session) {
    try {
      if (session.rememberMe) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session))
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session))
      }
    } catch {}
  }

  function getAllTeams() {
    return getFromStorage(STORAGE_KEYS.TEAMS)
  }

  function saveAllTeams(teams) {
    return saveToStorage(STORAGE_KEYS.TEAMS, teams)
  }

  function createTeam(teamName, creatorId) {
    const teams = getAllTeams()
    const users = getFromStorage(STORAGE_KEYS.USERS)
    const creator = users.find(user => user.id === creatorId)

    if (!creator) return { success: false, message: '用户不存在' }
    if (creator.teamId) return { success: false, message: '您已经加入了其他战队，请先退出' }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const fullTeamName = `${teamName}#${randomSuffix}`

    if (teams.some(team => team.name === fullTeamName)) {
      return { success: false, message: '战队名称已存在，请重试' }
    }

    const newTeam = {
      id: Date.now(),
      name: fullTeamName,
      displayName: teamName,
      creatorId,
      createdAt: new Date().toISOString(),
      memberIds: [creatorId]
    }

    teams.push(newTeam)
    if (!saveAllTeams(teams)) return { success: false, message: '创建战队失败，请重试' }

    creator.teamId = newTeam.id
    if (!saveToStorage(STORAGE_KEYS.USERS, users)) {
      const idx = teams.findIndex(t => t.id === newTeam.id)
      teams.splice(idx, 1)
      saveAllTeams(teams)
      return { success: false, message: '更新用户信息失败' }
    }

    const currentUser = getCurrentUser()
    if (currentUser && currentUser.id === creatorId) {
      currentUser.teamId = newTeam.id
      saveSession(currentUser)
    }

    return { success: true, team: newTeam }
  }

  function joinTeam(teamName, userId) {
    const teams = getAllTeams()
    const users = getFromStorage(STORAGE_KEYS.USERS)
    const user = users.find(u => u.id === userId)

    if (!user) return { success: false, message: '用户不存在' }
    if (user.teamId) return { success: false, message: '您已经加入了其他战队，请先退出' }

    const team = teams.find(t => t.name === teamName)
    if (!team) return { success: false, message: '战队不存在，请检查战队名称' }
    if (team.memberIds.includes(userId)) return { success: false, message: '您已经是该战队的成员' }

    team.memberIds.push(userId)
    if (!saveAllTeams(teams)) return { success: false, message: '加入战队失败，请重试' }

    user.teamId = team.id
    if (!saveToStorage(STORAGE_KEYS.USERS, users)) {
      const idx = team.memberIds.indexOf(userId)
      team.memberIds.splice(idx, 1)
      saveAllTeams(teams)
      return { success: false, message: '更新用户信息失败' }
    }

    const currentUser = getCurrentUser()
    if (currentUser && currentUser.id === userId) {
      currentUser.teamId = team.id
      saveSession(currentUser)
    }

    return { success: true, team }
  }

  function leaveTeam(userId) {
    const teams = getAllTeams()
    const users = getFromStorage(STORAGE_KEYS.USERS)
    const user = users.find(u => u.id === userId)

    if (!user) return { success: false, message: '用户不存在' }
    if (!user.teamId) return { success: false, message: '您尚未加入任何战队' }

    const team = teams.find(t => t.id === user.teamId)
    if (!team) {
      user.teamId = null
      saveToStorage(STORAGE_KEYS.USERS, users)
      return { success: false, message: '战队不存在，已自动清除关联' }
    }

    const memberIndex = team.memberIds.indexOf(userId)
    if (memberIndex === -1) {
      user.teamId = null
      saveToStorage(STORAGE_KEYS.USERS, users)
      return { success: false, message: '您不是该战队的成员，已清除关联' }
    }

    team.memberIds.splice(memberIndex, 1)
    let teamDeleted = false
    if (team.memberIds.length === 0) {
      const teamIndex = teams.findIndex(t => t.id === team.id)
      teams.splice(teamIndex, 1)
      teamDeleted = true
    }

    if (!saveAllTeams(teams)) return { success: false, message: '退出战队失败，请重试' }

    user.teamId = null
    if (!saveToStorage(STORAGE_KEYS.USERS, users)) {
      if (teamDeleted) teams.push(team)
      else team.memberIds.push(userId)
      saveAllTeams(teams)
      return { success: false, message: '更新用户信息失败' }
    }

    const currentUser = getCurrentUser()
    if (currentUser && currentUser.id === userId) {
      currentUser.teamId = null
      saveSession(currentUser)
    }

    return { success: true, teamDeleted }
  }

  function getUserTeam(userId) {
    const users = getFromStorage(STORAGE_KEYS.USERS)
    const user = users.find(u => u.id === userId)
    if (!user || !user.teamId) return null
    const teams = getAllTeams()
    return teams.find(t => t.id === user.teamId) || null
  }

  function getTeamMembers(teamId) {
    const teams = getAllTeams()
    const team = teams.find(t => t.id === teamId)
    if (!team) return []
    const users = getFromStorage(STORAGE_KEYS.USERS)
    return users.filter(user => team.memberIds.includes(user.id))
  }

  return {
    getAllTeams,
    saveAllTeams,
    createTeam,
    joinTeam,
    leaveTeam,
    getUserTeam,
    getTeamMembers
  }
})

export default useTeamStore
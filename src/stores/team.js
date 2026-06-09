// 战队 Store - 管理战队 CRUD 操作
import { defineStore } from 'pinia'
import { teamsApi, authApi } from '../services/api.js'

export const useTeamStore = defineStore('team', () => {
  async function getAllTeams() {
    const res = await teamsApi.getAllTeams()
    return res.success ? res.teams : []
  }

  async function createTeam(teamName, creatorId) {
    return await teamsApi.createTeam(teamName)
  }

  async function joinTeam(teamName, userId) {
    return await teamsApi.joinTeam(teamName)
  }

  async function leaveTeam(userId) {
    return await teamsApi.leaveTeam()
  }

  async function getUserTeam(userId) {
    // 获取所有战队并找出用户所在的战队
    const res = await teamsApi.getAllTeams()
    if (!res.success) return null

    // 需要获取用户信息来查找 teamId
    try {
      const userRes = await authApi.getUserById(userId)
      if (userRes.success && userRes.user.teamId) {
        const team = res.teams.find(t => t.id === userRes.user.teamId)
        return team || null
      }
    } catch {}
    return null
  }

  async function getTeamMembers(teamId) {
    const res = await teamsApi.getTeamById(teamId)
    if (res.success && res.team) {
      return res.team.members || []
    }
    return []
  }

  return {
    getAllTeams,
    createTeam,
    joinTeam,
    leaveTeam,
    getUserTeam,
    getTeamMembers
  }
})

export default useTeamStore
// Teams API
import { request } from './core.js'

export const teamsApi = {
  getAllTeams() {
    return request('/teams')
  },

  createTeam(teamName) {
    return request('/teams', {
      method: 'POST',
      body: { teamName },
      auth: true
    })
  },

  joinTeam(teamName) {
    return request('/teams/join', {
      method: 'POST',
      body: { teamName },
      auth: true
    })
  },

  leaveTeam() {
    return request('/teams/leave', {
      method: 'POST',
      auth: true
    })
  },

  getTeamById(id) {
    return request(`/teams/${id}`)
  }
}
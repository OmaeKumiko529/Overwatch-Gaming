// Git API (代理 GitHub/Gitee 仓库信息)
import { request } from './core.js'

export const gitApi = {
  fetchRepoInfo(url) {
    return request('/git/fetch', {
      method: 'POST',
      body: { url }
    })
  }
}
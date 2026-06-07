import { Router } from 'express'

const router = Router()

// 从 GitHub/Gitee URL 提取 owner 和 repo
function parseGitUrl(url) {
  const trimmed = url.trim()

  // GitHub: https://github.com/owner/repo 或 github.com/owner/repo
  const githubMatch = trimmed.match(/(?:https?:\/\/)?github\.com\/([^/\s?#]+)\/([^/\s?#]+)/)
  if (githubMatch) {
    return { platform: 'github', owner: githubMatch[1], repo: githubMatch[2].replace(/\.git$/, '') }
  }

  // Gitee: https://gitee.com/owner/repo 或 gitee.com/owner/repo
  const giteeMatch = trimmed.match(/(?:https?:\/\/)?gitee\.com\/([^/\s?#]+)\/([^/\s?#]+)/)
  if (giteeMatch) {
    return { platform: 'gitee', owner: giteeMatch[1], repo: giteeMatch[2].replace(/\.git$/, '') }
  }

  return null
}

async function fetchGitHubRepo(owner, repo) {
  const repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`)
  if (!repoRes.ok) {
    const errText = await repoRes.text()
    throw new Error(`GitHub API 返回 ${repoRes.status}: ${errText}`)
  }
  const repoData = await repoRes.json()

  const contribRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=10`)
  let contributors = []
  if (contribRes.ok) {
    const contribData = await contribRes.json()
    contributors = contribData.map(c => ({ login: c.login, avatar_url: c.avatar_url }))
  }

  return {
    title: repoData.full_name || repoData.name || repo,
    description: repoData.description || '',
    url: repoData.html_url || `https://github.com/${owner}/${repo}`,
    platform: 'github',
    contributors
  }
}

async function fetchGiteeRepo(owner, repo) {
  // Gitee API v5
  const repoRes = await fetch(`https://gitee.com/api/v5/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`)
  if (!repoRes.ok) {
    const errText = await repoRes.text()
    throw new Error(`Gitee API 返回 ${repoRes.status}: ${errText}`)
  }
  const repoData = await repoRes.json()

  const contribRes = await fetch(`https://gitee.com/api/v5/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=10`)
  let contributors = []
  if (contribRes.ok) {
    const contribData = await contribRes.json()
    contributors = contribData.map(c => ({ login: c.login, avatar_url: c.avatar_url }))
  }

  return {
    title: repoData.full_name || repoData.name || repo,
    description: repoData.description || '',
    url: repoData.html_url || `https://gitee.com/${owner}/${repo}`,
    platform: 'gitee',
    contributors
  }
}

// POST /api/git/fetch - 根据 Git 仓库 URL 获取仓库信息
router.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: '请提供有效的仓库 URL' })
    }

    const parsed = parseGitUrl(url)
    if (!parsed) {
      return res.status(400).json({ success: false, message: '无法识别的链接，仅支持 GitHub 和 Gitee 仓库链接' })
    }

    let data
    if (parsed.platform === 'github') {
      data = await fetchGitHubRepo(parsed.owner, parsed.repo)
    } else {
      data = await fetchGiteeRepo(parsed.owner, parsed.repo)
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('获取 Git 仓库信息失败:', error)
    res.status(500).json({ success: false, message: `获取仓库信息失败: ${error.message}` })
  }
})

export default router
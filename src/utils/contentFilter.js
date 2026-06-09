/**
 * 内容过滤器 — 解析帖子/评论中的特殊标签为可视化组件
 *
 * <bv>BVxxx</bv> → B站嵌入式视频
 * <git data-*></git> → Git仓库信息卡片
 */

// 匹配 <bv>BVxxx</bv> 标签
const BV_TAG_RE = /<bv[^>]*>([a-zA-Z0-9]+)<\/bv>/gi

// 匹配 <git> 标签（包含子内容）
const GIT_TAG_RE = /<git\s+([^>]*?)>[\s\S]*?<\/git>/gi

function isValidBvid(bvid) {
  return /^BV[a-zA-Z0-9]{10}$/.test(bvid)
}

function buildBilibiliIframe(bvid) {
  var d = '<div class="bilibili-video-wrapper">'
  var i = '<iframe src="//player.bilibili.com/player.html?bvid=' + bvid + '&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
  return d + i + '</div>'
}

// 用字符码解码 HTML 实体，避免自动格式化
var AMP = String.fromCharCode(38) // &
var QUOT = String.fromCharCode(34) // "

function decodeAttrs(s) {
  if (!s) return ''
  // 使用字符码避免编辑器自动转义
  var a = AMP + 'quot;'      // "
  var b = AMP + '#x27;'      // &#x27;
  var c = AMP + '#39;'       // &#39;
  var d = AMP + 'amp;'       // &
  // 先替换 " &#x27; &#39;
  while (s.indexOf(a) !== -1) s = s.replace(a, QUOT)
  while (s.indexOf(b) !== -1) s = s.replace(b, "'")
  while (s.indexOf(c) !== -1) s = s.replace(c, "'")
  // 最后替换 &
  while (s.indexOf(d) !== -1) s = s.replace(d, AMP)
  return s
}

function buildGitCard(attrs) {
  var url = ''
  var platform = 'github'
  var title = ''
  var cstr = '[]'

  var m

  m = attrs.match(/data-url="([^"]*)"/)
  if (m) url = decodeAttrs(m[1])

  m = attrs.match(/data-platform="([^"]*)"/)
  if (m) platform = m[1]

  m = attrs.match(/data-title="([^"]*)"/)
  if (m) title = decodeAttrs(m[1])

  m = attrs.match(/data-contributors="([^"]*)"/)
  if (m) cstr = decodeAttrs(m[1])

  var contributors = []
  try { contributors = JSON.parse(cstr) } catch (e) {}

  var maxShow = 2
  var ch = ''
  var shown = contributors.slice(0, maxShow)
  for (var i = 0; i < shown.length; i++) {
    var c = shown[i]
    var av = c.avatar_url || '/Head.png'
    var lg = c.login || 'Unknown'
    ch += '<img src="' + av + '" alt="' + lg + '" class="git-ca" title="' + lg + '" />'
    ch += '<span class="git-cn">' + lg + '</span>'
  }
  if (contributors.length > maxShow) {
    ch += '<span class="git-cm">...等' + contributors.length + '个贡献者</span>'
  }

  var label = platform === 'github' ? 'GitHub' : 'Gitee'

  var r = '<div class="gcd" data-p="' + platform + '">'
  r += '<div class="gch"><span class="gpi">\uD83D\uDD17</span><span class="gct">' + title + '</span><span class="gpl">' + label + '</span></div>'
  r += '<div class="gcb"><div class="gco">' + ch + '</div></div>'
  if (url) r += '<a href="' + url + '" class="gcl" target="_blank" rel="noopener">查看仓库 \u2192</a>'
  r += '</div>'
  return r
}

/**
 * 核心处理函数
 */
export function processContent(content) {
  if (!content) return ''
  var r = content
  r = r.replace(GIT_TAG_RE, function(m, a) { return buildGitCard(a) })
  r = r.replace(BV_TAG_RE, function(m, b) {
    if (isValidBvid(b)) return buildBilibiliIframe(b)
    return m
  })
  return r
}

export default { processContent }
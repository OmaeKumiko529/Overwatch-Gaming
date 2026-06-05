/**
 * 内容过滤器 — 解析帖子/评论中的 <bv> 标签为 B站嵌入式视频
 *
 * 输入: <bv>BV1NArXB4E5q</bv>
 * 输出: <div class="bilibili-video-wrapper"><iframe src="//player.bilibili.com/player.html?bvid=BV1NArXB4E5q" ...></iframe></div>
 */

// 匹配 <bv>BVxxx</bv> 标签
const BV_TAG_REGEX = /<bv[^>]*>([a-zA-Z0-9]+)<\/bv>/gi

// 验证 BV 号格式
function isValidBvid(bvid) {
  return /^BV[a-zA-Z0-9]{10}$/.test(bvid)
}

// 构建 B站 iframe HTML
function buildBilibiliIframe(bvid) {
  return `<div class="bilibili-video-wrapper">
  <iframe src="//player.bilibili.com/player.html?bvid=${bvid}&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
</div>`
}

/**
 * 核心处理函数：将内容中的 <bv> 标签替换为 B站嵌入式视频
 */
export function processContent(htmlContent) {
  if (!htmlContent) return ''

  return htmlContent.replace(BV_TAG_REGEX, (match, bvid) => {
    if (isValidBvid(bvid)) {
      return buildBilibiliIframe(bvid)
    }
    // 无效的 BV 号则保留原标签
    return match
  })
}

export default {
  processContent
}
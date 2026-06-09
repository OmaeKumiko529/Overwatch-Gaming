// UID/PID URL 编码与解码工具
// UID格式: "u/?=YYYYMMDDxxxx"
// PID格式: "p/?=YYYYMMDDxxxxxx"
// 均包含 "/"，在 Vue Router 路径中必须编码

export function encodeUid(uid) {
  if (!uid) return uid
  return encodeURIComponent(uid)
}

export function encodePid(pid) {
  if (!pid) return pid
  return encodeURIComponent(pid)
}

export function decodeParam(param) {
  if (!param) return param
  return decodeURIComponent(param)
}

export function buildRouterLinkUser(uid) {
  return '/user/' + encodeUid(uid)
}

export function buildRouterLinkPost(pid) {
  return '/post/' + encodePid(pid)
}

export default { encodeUid, encodePid, decodeParam, buildRouterLinkUser, buildRouterLinkPost }
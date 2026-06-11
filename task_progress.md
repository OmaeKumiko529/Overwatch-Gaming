# Bug 修复进度

## 严重 Bug
- [ ] #1 admin.js - sortBy SQL 注入修复
- [ ] #2 admin.js - SQL 查询危险关键字检测改进
- [ ] #3 JoinTeamPage.vue - 修复 userService.getAllUsers() 未 await 的 bug
- [ ] #4 SearchPage.vue - 改用后端搜索而非全量拉取
- [ ] #5 posts.js - 删除帖子添加管理员权限
- [ ] #6 auth.js - 注册接口分开检查用户名和邮箱唯一性

## 中等 Bug
- [ ] #7 posts.js - 黑帖权限与 rankMap.js 对齐 (userrank >= 3)
- [ ] #8 notifications.js - 字段命名统一为小驼峰
- [ ] #9 NotificationPage.vue - 作者名显示优化
- [ ] #10 JoinTeamPage.vue - 使用 router.push 替代 window.location.hash
- [ ] #11 easterEgg.js - 移除 console.clear()

## 优化建议
- [ ] #12 server/index.js - 添加请求日志中间件
- [ ] #13 posts.js - 子帖查询添加 context 索引
- [ ] #14 teams.js - 退出战队时创建者提示
- [ ] #15 seed.js - 修复种子数据路径

// 测试管理面板 API
const API_BASE = 'http://localhost:3001/api'

async function test() {
  try {
    // 1. 登录获取 token
    console.log('=== 1. 测试管理员登录 ===')
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: '88888888' })
    })
    const loginData = await loginRes.json()
    console.log('登录响应:', JSON.stringify(loginData, null, 2))
    
    if (!loginData.success) {
      console.log('❌ 登录失败')
      return
    }
    
    const token = loginData.user.token
    console.log('✅ 登录成功，token:', token.substring(0, 20) + '...')
    
    // 2. 测试获取表列表
    console.log('\n=== 2. 测试获取表列表 ===')
    const tablesRes = await fetch(`${API_BASE}/admin/tables`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const tablesData = await tablesRes.json()
    console.log('表列表响应:', JSON.stringify(tablesData, null, 2))
    
    // 3. 测试获取统计信息
    console.log('\n=== 3. 测试获取统计信息 ===')
    const statsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const statsData = await statsRes.json()
    console.log('统计响应:', JSON.stringify(statsData, null, 2))
    
    // 4. 测试获取 users 表数据
    console.log('\n=== 4. 测试获取 users 表数据 ===')
    const dataRes = await fetch(`${API_BASE}/admin/table/users?page=1&pageSize=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const dataRes_json = await dataRes.json()
    console.log('users表数据:', JSON.stringify(dataRes_json, null, 2))

    console.log('\n🎉 所有管理API测试完成')
  } catch (err) {
    console.error('测试失败:', err.message)
  }
}

test()
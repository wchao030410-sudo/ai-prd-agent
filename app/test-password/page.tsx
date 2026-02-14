'use client'

import { useState } from 'react'

export default function TestPasswordPage() {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function testPassword() {
    setLoading(true)
    setResult('')

    try {
      const res = await fetch('/api/admin/test-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '50px', maxWidth: '600px', margin: '50px auto' }}>
      <h1>密码测试工具</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入密码：admin123"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px'
          }}
        />
        <button
          onClick={testPassword}
          disabled={loading || !password}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {loading ? '测试中...' : '测试密码'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '15px',
          background: result.startsWith('Error') ? '#fee' : '#efe',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          <strong>结果：</strong>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h3>使用说明：</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>在上方输入密码 <code>admin123</code></li>
          <li>点击"测试密码"按钮</li>
          <li>查看返回结果，确认密码验证是否正常</li>
        </ol>
      </div>
    </div>
  )
}

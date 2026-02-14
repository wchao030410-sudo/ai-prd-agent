const bcrypt = require('bcrypt')

// 生成管理员密码哈希
const password = process.argv[2] || 'admin123' // 默认密码

if (!password) {
  console.log('Usage: node scripts/generate-admin-hash.ts <your-password>')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)

console.log('\n=== Admin Password Hash Generated ===\n')
console.log('Password:', password)
console.log('Hash (copy to .env):', hash)
console.log('\nAdd this to your .env file:')
console.log(`ADMIN_PASSWORD_HASH=${hash}`)

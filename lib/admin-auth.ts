import { compare } from 'bcrypt'

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) {
    console.warn('ADMIN_PASSWORD_HASH not set')
    return false
  }

  console.log('=== DEBUG: Password Verification ===')
  console.log('Hash from env:', ADMIN_PASSWORD_HASH)
  console.log('Input password:', password)

  const result = await compare(password, ADMIN_PASSWORD_HASH)
  console.log('Comparison result:', result)

  return result
}

// Generate hash for environment variable
// Run this in Node.js: console.log(require('bcrypt').hashSync('your-password', 10))

import { compare } from 'bcrypt'

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) {
    return false
  }

  return await compare(password, ADMIN_PASSWORD_HASH)
}

// Generate hash for environment variable
// Run: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"

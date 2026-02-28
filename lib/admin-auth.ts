import { compare } from 'bcrypt'
import * as Buffer from 'buffer'

// Support both direct hash and Base64-encoded hash (to avoid $ variable expansion issues)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
const ADMIN_PASSWORD_HASH_B64 = process.env.ADMIN_PASSWORD_HASH_B64

export async function verifyAdminPassword(password: string): Promise<boolean> {
  let hashToUse = ADMIN_PASSWORD_HASH

  // If direct hash is not available or too short (indicating truncation), try Base64 version
  if (!hashToUse || hashToUse.length < 55) {
    if (ADMIN_PASSWORD_HASH_B64) {
      // Decode Base64 to get the actual hash
      hashToUse = Buffer.Buffer.from(ADMIN_PASSWORD_HASH_B64, 'base64').toString('utf-8')
    }
  }

  if (!hashToUse || hashToUse.length < 55) {
    return false
  }

  return await compare(password, hashToUse)
}

// Generate hash for environment variable
// Run: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
// For Base64 encoding (to avoid $ expansion issues):
// Run: node -e "console.log(Buffer.from(require('bcrypt').hashSync('admin123', 10)).toString('base64'))"

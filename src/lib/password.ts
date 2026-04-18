import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCallback)

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer

  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const [salt, storedKey] = hashedPassword.split(':')

  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const storedBuffer = Buffer.from(storedKey, 'hex')

  if (storedBuffer.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedBuffer, derivedKey)
}
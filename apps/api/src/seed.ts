import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'

import { db, pool } from './db/client.js'
import { users } from './db/schema.js'

const adminLogin = (process.env.ADMIN_LOGIN ?? 'admin').toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'
const fieldLogin = (process.env.FIELD_LOGIN ?? 'campo').toLowerCase()
const fieldPassword = process.env.FIELD_PASSWORD ?? 'campo123'

try {
  const [admin] = await db.select().from(users).where(eq(users.login, adminLogin)).limit(1)
  if (!admin) await db.insert(users).values({ name: 'Administrador Sanetes', login: adminLogin, passwordHash: await hash(adminPassword, 12), role: 'admin' })

  const [field] = await db.select().from(users).where(eq(users.login, fieldLogin)).limit(1)
  if (!field) {
    await db.insert(users).values({ name: 'Responsável de campo', login: fieldLogin, passwordHash: await hash(fieldPassword, 12), role: 'field' })
  }
  console.log('Dados iniciais verificados')
} finally {
  await pool.end()
}

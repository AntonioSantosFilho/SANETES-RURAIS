import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { db, pool } from './db/client.js'

try {
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_PATH ?? './drizzle' })
  console.log('Migrações aplicadas com sucesso')
} finally {
  await pool.end()
}

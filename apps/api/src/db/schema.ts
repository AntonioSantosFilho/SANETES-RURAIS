import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const systemStatus = pgEnum('system_status', ['active', 'inactive'])
export const userRole = pgEnum('user_role', ['admin', 'field'])
export const monitoringStatus = pgEnum('monitoring_status', ['draft', 'synced'])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    login: text('login').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').default('field').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_login_uidx').on(table.login)],
)

export const systems = pgTable(
  'systems',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    responsibleName: text('responsible_name').notNull(),
    coordinates: text('coordinates'),
    residentsCount: integer('residents_count'),
    fieldUserId: uuid('field_user_id').references(() => users.id, { onDelete: 'set null' }),
    lastVisitAt: timestamp('last_visit_at', { withTimezone: true }),
    status: systemStatus('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('systems_created_at_idx').on(table.createdAt),
    index('systems_field_user_idx').on(table.fieldUserId),
  ],
)

export type MonitoringAnswer = {
  value: string
  date?: string
  detail?: string
}

export const monitorings = pgTable(
  'monitorings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systems.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    answers: jsonb('answers').$type<Record<string, MonitoringAnswer>>().notNull(),
    report: text('report'),
    feedback: jsonb('feedback').$type<{ quality: string; recommendations: string[] }>().notNull(),
    status: monitoringStatus('status').default('synced').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('monitorings_system_idx').on(table.systemId),
    index('monitorings_created_at_idx').on(table.createdAt),
  ],
)

export const monitoringPhotos = pgTable(
  'monitoring_photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    monitoringId: uuid('monitoring_id')
      .notNull()
      .references(() => monitorings.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    originalName: text('original_name').notNull(),
    storageName: text('storage_name').notNull(),
    mimeType: text('mime_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('monitoring_photos_monitoring_idx').on(table.monitoringId)],
)

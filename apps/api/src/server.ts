import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { compare, hash } from 'bcryptjs'
import { and, desc, eq, sql } from 'drizzle-orm'
import Fastify, { type FastifyRequest } from 'fastify'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { db, pool } from './db/client.js'
import {
  accessLogs,
  monitoringPhotos,
  monitorings,
  systems,
  users,
  type MonitoringAnswer,
} from './db/schema.js'

type AuthUser = { id: string; role: 'admin' | 'field'; login: string }

const app = Fastify({ logger: true, bodyLimit: 110 * 1024 * 1024, trustProxy: true })
const uploadDirectory = process.env.UPLOAD_DIR ?? './uploads'
const uploadRoot = isAbsolute(uploadDirectory) ? uploadDirectory : join(process.cwd(), uploadDirectory)
await mkdir(uploadRoot, { recursive: true })

await app.register(cors, {
  origin: (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((item) => item.trim()),
})
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'local-development-secret-change-me' })
await app.register(multipart, {
  limits: { files: 4, fileSize: 25 * 1024 * 1024, fields: 4 },
})
await app.register(fastifyStatic, {
  root: uploadRoot,
  prefix: '/uploads/',
  decorateReply: false,
})

function currentUser(request: FastifyRequest) {
  return request.user as AuthUser
}

async function authenticate(request: FastifyRequest) {
  await request.jwtVerify()
}

async function requireAdmin(request: FastifyRequest) {
  await request.jwtVerify()
  if (currentUser(request).role !== 'admin') {
    const error = new Error('Acesso administrativo necessário') as Error & { statusCode: number }
    error.statusCode = 403
    throw error
  }
}

const loginSchema = z.object({ login: z.string().trim().min(2), password: z.string().min(4) })

async function registerAccess(request: FastifyRequest, login: string, user: typeof users.$inferSelect | undefined, success: boolean) {
  try {
    await db.insert(accessLogs).values({
      userId: user?.id,
      login,
      role: user?.role,
      success,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    })
  } catch (error) {
    request.log.error({ error }, 'Não foi possível registrar o acesso')
  }
}

app.get('/health', async () => {
  await db.execute(sql`select 1`)
  return { status: 'ok', service: 'sanetes-api', database: 'connected', timestamp: new Date().toISOString() }
})

app.post('/auth/login', async (request, reply) => {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Informe login e senha.' })

  const normalizedLogin = parsed.data.login.toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.login, normalizedLogin)).limit(1)
  if (!user || !user.active || !(await compare(parsed.data.password, user.passwordHash))) {
    await registerAccess(request, normalizedLogin, user, false)
    return reply.status(401).send({ message: 'Login ou senha inválidos.' })
  }

  await registerAccess(request, normalizedLogin, user, true)

  const assignedSystems = user.role === 'field'
    ? await db.select().from(systems).where(and(eq(systems.fieldUserId, user.id), eq(systems.status, 'active')))
    : []
  const token = app.jwt.sign({ id: user.id, role: user.role, login: user.login }, { expiresIn: '12h' })
  return { token, user: { id: user.id, name: user.name, login: user.login, role: user.role }, systems: assignedSystems }
})

app.get('/access-logs', { preHandler: requireAdmin }, async () => {
  return db.select().from(accessLogs).orderBy(desc(accessLogs.createdAt)).limit(500)
})

app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
  const auth = currentUser(request)
  const [user] = await db.select().from(users).where(eq(users.id, auth.id)).limit(1)
  if (!user || !user.active) return reply.status(401).send({ message: 'Sessão inválida.' })
  const assignedSystems = user.role === 'field'
    ? await db.select().from(systems).where(and(eq(systems.fieldUserId, user.id), eq(systems.status, 'active')))
    : []
  return { user: { id: user.id, name: user.name, login: user.login, role: user.role }, systems: assignedSystems }
})

app.get('/systems', { preHandler: authenticate }, async (request) => {
  const user = currentUser(request)
  const rows = user.role === 'admin'
    ? await db.select().from(systems).orderBy(desc(systems.createdAt))
    : await db.select().from(systems).where(and(eq(systems.fieldUserId, user.id), eq(systems.status, 'active')))
  return rows
})

const createSystemSchema = z.object({
  name: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(120),
  responsibleName: z.string().trim().min(2).max(160),
  coordinates: z.string().trim().max(160).optional(),
  residentsCount: z.preprocess((value) => value === '' || value == null ? undefined : value, z.coerce.number().int().positive().max(10000).optional()),
  login: z.string().trim().min(3).max(80).transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(100),
})

app.post('/systems', { preHandler: requireAdmin }, async (request, reply) => {
  const parsed = createSystemSchema.safeParse(request.body)
  if (!parsed.success) return reply.status(400).send({ message: 'Dados inválidos.', issues: parsed.error.issues })
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.login, parsed.data.login)).limit(1)
  if (existing.length) return reply.status(409).send({ message: 'Este login já está em uso.' })

  const created = await db.transaction(async (tx) => {
    const [fieldUser] = await tx.insert(users).values({
      name: parsed.data.responsibleName,
      login: parsed.data.login,
      passwordHash: await hash(parsed.data.password, 12),
      role: 'field',
    }).returning()
    if (!fieldUser) throw new Error('Falha ao criar usuário')
    const [system] = await tx.insert(systems).values({
      name: parsed.data.name,
      city: parsed.data.city,
      responsibleName: parsed.data.responsibleName,
      coordinates: parsed.data.coordinates,
      residentsCount: parsed.data.residentsCount,
      fieldUserId: fieldUser.id,
    }).returning()
    return system
  })
  return reply.status(201).send(created)
})

app.post('/systems/:id/visit', { preHandler: requireAdmin }, async (request, reply) => {
  const id = z.string().uuid().safeParse((request.params as { id?: string }).id)
  if (!id.success) return reply.status(400).send({ message: 'Sistema inválido.' })
  const [updated] = await db.update(systems).set({ lastVisitAt: new Date(), updatedAt: new Date() })
    .where(eq(systems.id, id.data)).returning()
  if (!updated) return reply.status(404).send({ message: 'Sistema não encontrado.' })
  return updated
})

app.delete('/systems/:id', { preHandler: requireAdmin }, async (request, reply) => {
  const id = z.string().uuid().safeParse((request.params as { id?: string }).id)
  if (!id.success) return reply.status(400).send({ message: 'Sistema inválido.' })
  const [system] = await db.select().from(systems).where(eq(systems.id, id.data)).limit(1)
  if (!system) return reply.status(404).send({ message: 'Sistema não encontrado.' })

  const photos = await db.select({ storageName: monitoringPhotos.storageName })
    .from(monitoringPhotos)
    .innerJoin(monitorings, eq(monitoringPhotos.monitoringId, monitorings.id))
    .where(eq(monitorings.systemId, system.id))

  await db.transaction(async (tx) => {
    await tx.delete(systems).where(eq(systems.id, system.id))
    if (system.fieldUserId) {
      const remaining = await tx.select({ id: systems.id }).from(systems).where(eq(systems.fieldUserId, system.fieldUserId)).limit(1)
      if (!remaining.length) await tx.delete(users).where(and(eq(users.id, system.fieldUserId), eq(users.role, 'field')))
    }
  })
  await Promise.all(photos.map((photo) => unlink(join(uploadRoot, photo.storageName)).catch(() => undefined)))
  return reply.status(204).send()
})

const answerSchema = z.object({ value: z.string().min(1), date: z.string().optional(), detail: z.string().optional() })
const answersSchema = z.record(z.string(), answerSchema).superRefine((answers, context) => {
  for (let number = 1; number <= 17; number += 1) {
    if (!answers[`q${number}`]) context.addIssue({ code: 'custom', message: `Q${number} é obrigatória.` })
  }
  for (const key of ['q5', 'q6', 'q7', 'q16', 'q17']) {
    if (answers[key]?.value === 'sim' && !answers[key]?.date) context.addIssue({ code: 'custom', message: `${key.toUpperCase()} exige uma data.` })
  }
  if (!answers.q14?.detail?.trim()) context.addIssue({ code: 'custom', message: 'Q14 exige um complemento.' })
})

function buildFeedback(answers: Record<string, MonitoringAnswer>) {
  const recommendations: string[] = []
  const cluster = answers.q12?.value
  const quality = cluster === 'NENHUM CLUSTER'
    ? 'O seu sistema necessita de visita para adequação e avaliação. Em breve você receberá visita do IRPAA.'
    : 'De acordo com os dados preenchidos no questionário, a situação do seu sistema é considerada boa!'
  if (answers.q15?.value === 'Menos de 7 dias') recommendations.push('Aumente o tempo de permanência do efluente na lagoa de estabilização para 7 dias.')
  if (answers.q15?.value === 'Acima de 9 dias') recommendations.push('Diminua o tempo de permanência do esgoto na lagoa de estabilização para 7 dias.')
  if (answers.q9?.value === 'Odor desagradável') recommendations.push('Quanto ao odor desagradável, em breve você receberá uma visita do IRPAA.')
  return { quality, recommendations }
}

app.post('/monitorings', { preHandler: authenticate }, async (request, reply) => {
  const fields: Record<string, string> = {}
  const files: Array<{ category: string; originalName: string; mimeType: string; buffer: Buffer }> = []
  for await (const part of request.parts()) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer()
      files.push({ category: part.fieldname, originalName: part.filename, mimeType: part.mimetype, buffer })
    } else fields[part.fieldname] = String(part.value)
  }

  const systemId = z.string().uuid().safeParse(fields.systemId)
  let rawAnswers: unknown
  try { rawAnswers = JSON.parse(fields.answers ?? '') } catch { rawAnswers = null }
  const parsedAnswers = answersSchema.safeParse(rawAnswers)
  const requiredPhotos = ['greaseTrap', 'lagoon', 'inletSample', 'outletSample']
  if (!systemId.success || !parsedAnswers.success || requiredPhotos.some((name) => !files.some((file) => file.category === name)) || files.some((file) => !file.mimeType.startsWith('image/'))) {
    return reply.status(400).send({ message: 'Complete as 17 respostas e as quatro fotografias.' })
  }

  const auth = currentUser(request)
  const [system] = await db.select().from(systems).where(eq(systems.id, systemId.data)).limit(1)
  if (!system || (auth.role !== 'admin' && system.fieldUserId !== auth.id)) return reply.status(403).send({ message: 'Sistema não autorizado.' })

  const savedNames: string[] = []
  try {
    const photoRows: Array<{ category: string; originalName: string; mimeType: string; storageName: string }> = []
    for (const file of files) {
      const mimeExtensions: Record<string, string> = { 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/heic': '.heic', 'image/heif': '.heif' }
      const extension = mimeExtensions[file.mimeType] ?? '.jpg'
      const storageName = `${randomUUID()}${extension}`
      await writeFile(join(uploadRoot, storageName), file.buffer)
      savedNames.push(storageName)
      photoRows.push({ category: file.category, originalName: file.originalName, mimeType: file.mimeType, storageName })
    }
    const feedback = buildFeedback(parsedAnswers.data)
    const created = await db.transaction(async (tx) => {
      const [monitoring] = await tx.insert(monitorings).values({
        systemId: system.id,
        userId: auth.id,
        answers: parsedAnswers.data,
        report: fields.report?.trim() || null,
        feedback,
      }).returning()
      if (!monitoring) throw new Error('Falha ao criar monitoramento')
      const photos = await tx.insert(monitoringPhotos).values(photoRows.map((photo) => ({ ...photo, monitoringId: monitoring.id }))).returning()
      return { ...monitoring, system, photos, feedback }
    })
    return reply.status(201).send(created)
  } catch (error) {
    await Promise.all(savedNames.map((name) => unlink(join(uploadRoot, name)).catch(() => undefined)))
    throw error
  }
})

app.get('/monitorings', { preHandler: authenticate }, async (request) => {
  const auth = currentUser(request)
  const rows = auth.role === 'admin'
    ? await db.select().from(monitorings).orderBy(desc(monitorings.createdAt))
    : await db.select().from(monitorings).where(eq(monitorings.userId, auth.id)).orderBy(desc(monitorings.createdAt))
  const systemRows = await db.select().from(systems)
  const systemMap = new Map(systemRows.map((system) => [system.id, system]))
  return rows.map((row) => ({ ...row, system: systemMap.get(row.systemId) }))
})

app.get('/monitorings/:id', { preHandler: authenticate }, async (request, reply) => {
  const id = z.string().uuid().safeParse((request.params as { id?: string }).id)
  if (!id.success) return reply.status(400).send({ message: 'Monitoramento inválido.' })
  const [monitoring] = await db.select().from(monitorings).where(eq(monitorings.id, id.data)).limit(1)
  if (!monitoring) return reply.status(404).send({ message: 'Monitoramento não encontrado.' })
  const auth = currentUser(request)
  if (auth.role !== 'admin' && monitoring.userId !== auth.id) return reply.status(403).send({ message: 'Acesso negado.' })
  const [system] = await db.select().from(systems).where(eq(systems.id, monitoring.systemId)).limit(1)
  const photos = await db.select().from(monitoringPhotos).where(eq(monitoringPhotos.monitoringId, monitoring.id))
  return { ...monitoring, system, feedback: buildFeedback(monitoring.answers), photos: photos.map((photo) => ({ ...photo, url: `/api/uploads/${photo.storageName}` })) }
})

app.delete('/monitorings/:id', { preHandler: requireAdmin }, async (request, reply) => {
  const id = z.string().uuid().safeParse((request.params as { id?: string }).id)
  if (!id.success) return reply.status(400).send({ message: 'Monitoramento inválido.' })
  const [monitoring] = await db.select({ id: monitorings.id }).from(monitorings).where(eq(monitorings.id, id.data)).limit(1)
  if (!monitoring) return reply.status(404).send({ message: 'Monitoramento não encontrado.' })
  const photos = await db.select({ storageName: monitoringPhotos.storageName }).from(monitoringPhotos).where(eq(monitoringPhotos.monitoringId, monitoring.id))
  await db.delete(monitorings).where(eq(monitorings.id, monitoring.id))
  await Promise.all(photos.map((photo) => unlink(join(uploadRoot, photo.storageName)).catch(() => undefined)))
  return reply.status(204).send()
})

app.addHook('onClose', async () => pool.end())

try {
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: process.env.HOST ?? '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}

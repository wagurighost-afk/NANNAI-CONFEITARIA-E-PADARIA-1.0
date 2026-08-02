import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { initDatabase, isPostgresEnabled } from './db/index.js'
import { seedDatabase } from './seed.js'
import { authRouter } from './routes/auth.routes.js'
import { breadControlRouter } from './routes/breadControl.routes.js'
import { wasteControlRouter } from './routes/wasteControl.routes.js'
import { eventsRouter } from './routes/events.routes.js'
import { productionRouter } from './routes/production.routes.js'
import { monthlyScheduleRouter } from './routes/monthlySchedule.routes.js'
import { recipesRouter } from './routes/recipes.routes.js'
import { intelligenceRouter } from './routes/intelligence.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', '..', 'dist')
const isProduction = process.env.NODE_ENV === 'production'

const app = express()

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use('/api/uploads', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
}, express.static(config.uploadsDir))

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nannai-api',
    mode: isProduction ? 'production' : 'development',
    database: isPostgresEnabled() ? 'postgresql' : 'json-file',
  })
})

app.use('/api/auth', authRouter)
app.use('/api/production', productionRouter)
app.use('/api/recipes', recipesRouter)
app.use('/api/monthly-schedules', monthlyScheduleRouter)
app.use('/api/bread-control', breadControlRouter)
app.use('/api/waste-control', wasteControlRouter)
app.use('/api/intelligence', intelligenceRouter)
app.use('/api/events', eventsRouter)

if (isProduction && fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)
  res.status(500).json({ message: 'Erro interno do servidor.' })
})

async function startServer(): Promise<void> {
  await initDatabase()
  await seedDatabase()

  app.listen(config.port, () => {
    console.log(`NANNAI API rodando em http://localhost:${config.port}`)
    console.log(`Banco: ${isPostgresEnabled() ? 'PostgreSQL' : 'arquivo JSON local'}`)
    if (isProduction && fs.existsSync(distPath)) {
      console.log('App PWA servido a partir de /dist')
    }
    console.log(`Senha padrão da equipe: ${config.defaultPassword}`)
  })
}

startServer().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error)
  process.exit(1)
})

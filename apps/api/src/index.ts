import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { urlsRouter } from './routes/urls'
import { redirectRouter } from './routes/redirect'
import { errorHandler } from './middlewares/errorHandler'

const app = express()

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.use(express.json())

app.use(cors({ origin: CORS_ORIGIN }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use(urlsRouter)

app.use(redirectRouter)

app.use(errorHandler)

app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))

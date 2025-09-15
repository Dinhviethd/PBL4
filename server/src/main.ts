import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import router from './routes/index'
import { initDatabase } from '@/configs/database.config'
import errorHandler from "@/middlewares/errorHandlermiddleware"
import { setupVideoCallWebSocket } from '@/services/websocket.service'

dotenv.config()

const app = express()
const server = createServer(app)

const wss = new WebSocketServer({ server })

app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["POST", "PUT", "GET", "DELETE"],
}))

initDatabase()
app.use("/api", router)
app.use(errorHandler.notFound)
app.use(errorHandler.errorHandler)

setupVideoCallWebSocket(wss)

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
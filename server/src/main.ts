import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cookieParser from 'cookie-parser'
import path from 'path'
import router from './routes/index'
import { initDatabase } from '@/configs/database.config'
import errorHandler from "@/middlewares/errorHandlermiddleware";

dotenv.config()
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser()); 

// Serve static files từ thư mục upload
app.use('/upload', express.static(path.join(__dirname, '../upload')));

// Enable CORS (cho phép cookie đi kèm)
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

initDatabase()
app.use("/api", router)
// Route for root path
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});

app.use(errorHandler.notFound)
app.use(errorHandler.errorHandler)

const PORT = process.env.PORT || 8000
 

wss.on('connection', (ws) => {
    console.log("Connect to websocket successfully")
})
server.listen(PORT, () => {
    console.log(`Server run at http://localhost:${PORT}`)
})
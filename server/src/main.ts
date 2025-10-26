import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cookieParser from 'cookie-parser'
import path from 'path'
import jwt from 'jsonwebtoken'
import router from './routes/index'
import { initDatabase } from '@/configs/database.config'
import errorHandler from "@/middlewares/errorHandlermiddleware";
import { wsService } from '@/services/websocket.service'

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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
    console.log("New WebSocket connection");
    
    // Xử lý tin nhắn từ client
    ws.on('message', (message) => {
        try {
            const rawMessage = message.toString();
            console.log("Raw WebSocket message:", rawMessage);
            
            const data = JSON.parse(rawMessage);
            console.log("Parsed WebSocket data:", data);
            
            if (data.type === 'auth') {
                const token = data.token;
                const userId = data.userId;
                
                console.log("Auth attempt - token:", token ? 'present' : 'missing');
                console.log("Auth attempt - userId:", userId, typeof userId);
                
                if (!token || !userId) {
                    console.log("Authentication failed - missing token or userId");
                    ws.close(1008, 'Authentication required');
                    return;
                }

                try {
                    // Verify JWT token
                    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret');
                    console.log("JWT decoded:", decoded);
                    
    

                    // Thêm client vào WebSocket service
                    wsService.addClient(userId, ws);
                    
                    // Gửi xác nhận authentication thành công
                    ws.send(JSON.stringify({
                        type: 'auth_success',
                        message: 'Authentication successful',
                        onlineUsers: wsService.getOnlineUsers()
                    }));
                    
                    console.log(`User ${userId} authenticated successfully`);
                    
                } catch (error) {
                    console.error('WebSocket authentication failed:', error);
                    ws.close(1008, 'Invalid token');
                    return;
                }
            }
            
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });
    
    // Xử lý khi connection đóng
    ws.on('close', () => {
        console.log("WebSocket disconnected");
        // wsService sẽ tự động xử lý việc remove client khi socket đóng
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

server.listen(PORT, () => {
    console.log(`Server run at http://localhost:${PORT}`)
})
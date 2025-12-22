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
import callSignalingManager from '@/services/callSignaling.service'

dotenv.config()
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

//deploy client build static files
const clientBuildPath = path.resolve('/app/public');
app.use(express.static(clientBuildPath));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser()); 

// Serve static files từ thư mục upload
app.use('/upload', express.static(path.join(__dirname, '../upload')));

// Enable CORS (cho phép cookie đi kèm)
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

initDatabase().catch(err => {
    console.error("WRONG PASSWORD: Cannot connect to Database!");
    console.error(err);
    process.exit(1);
});

app.use("/api", router)

// Route for root path
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});

//for deploy client build
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handling middleware
app.use(errorHandler.notFound)
app.use(errorHandler.errorHandler)

const PORT = process.env.PORT || 8000

wss.on('connection', (ws) => {
    
    let userId: number | null = null;
    
    // Xử lý tin nhắn từ client
    ws.on('message', (message) => {
        try {
            const rawMessage = message.toString();
            
            const data = JSON.parse(rawMessage);
            
            if (data.type === 'auth') {
                const token = data.token;
                userId = data.userId;
                
                if (!token || !userId) {
                    ws.close(1008, 'Authentication required');
                    return;
                }

                try {
                    // Verify JWT token
                    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret');
                    
                    // Thêm client vào WebSocket service
                    wsService.addClient(userId, ws);
                    console.log(`WebSocket authenticated for user ${userId}`);
                    console.log("number of online users:", wsService.getOnlineUsers().length);
                    // Đăng ký cho Call Signaling
                    callSignalingManager.registerConnection(userId, ws);
                    
                    // Gửi xác nhận authentication thành công
                    ws.send(JSON.stringify({
                        type: 'auth_success',
                        message: 'Authentication successful',
                        onlineUsers: wsService.getOnlineUsers()
                    }));
                    console.log(`Authentication successful`);

                    
                } catch (error) {
                    console.error('WebSocket authentication failed:', error);
                    ws.close(1008, 'Invalid token');
                    return;
                }
            } else if (userId) {
                // Xử lý các message khác sau khi xác thực
                if (data.type && data.type.startsWith('CALL_')) {
                    console.log(` [User ${userId}] ${data.type} message`);
                    console.log(`   Full message data:`, JSON.stringify(data, null, 2));
                    // Xử lý call signaling messages
                    callSignalingManager.handleSignalingMessage(userId, data).catch(err => {
                        console.error('Error handling call signaling:', err);
                    });
                }
            }
            
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        if (userId) {
            console.log(`👤 User ${userId} disconnected`);
            callSignalingManager.unregisterConnection(userId);
        }
    });
    
    ws.on('error', (error) => {
        console.error(' WebSocket error:', error);
    });
});

server.listen(PORT, () => {
    console.log(`Server run at http://localhost:${PORT}`)
})
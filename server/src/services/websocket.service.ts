import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'

interface User {
  id: string
  socketId: string
  name: string
  avatar?: string
}

interface Room {
  id: string
  name: string
  users: Map<string, User>
  createdAt: Date
  maxUsers?: number
}

interface WebSocketMessage {
  type: string
  data: any
  messageId?: string
}

interface SignalData {
  signal: any
  from: string
  to: string
  type: 'offer' | 'answer' | 'ice-candidate'
}

interface ExtendedWebSocket extends WebSocket {
  id: string
  userId?: string
  roomId?: string
  isAlive: boolean
}

class VideoCallManager {
  private rooms = new Map<string, Room>()
  private clients = new Map<string, ExtendedWebSocket>()
  private userSocketMap = new Map<string, string>() // socketId -> userId

  addClient(ws: ExtendedWebSocket) {
    this.clients.set(ws.id, ws)
  }

  removeClient(socketId: string) {
    this.clients.delete(socketId)
    const { roomId, userId } = this.leaveRoom(socketId)
    return { roomId, userId }
  }

  getClient(socketId: string): ExtendedWebSocket | undefined {
    return this.clients.get(socketId)
  }

  createRoom(roomId: string, roomName: string, maxUsers = 10): Room {
    const room: Room = {
      id: roomId,
      name: roomName,
      users: new Map(),
      createdAt: new Date(),
      maxUsers
    }
    this.rooms.set(roomId, room)
    return room
  }

  joinRoom(roomId: string, user: User): { success: boolean; room?: Room; error?: string } {
    let room = this.rooms.get(roomId)
    
    if (!room) {
      room = this.createRoom(roomId, `Room ${roomId}`)
    }

    if (room.users.size >= (room.maxUsers || 10)) {
      return { success: false, error: 'Room is full' }
    }

    room.users.set(user.id, user)
    this.userSocketMap.set(user.socketId, user.id)
    
    // Update client info
    const client = this.getClient(user.socketId)
    if (client) {
      client.userId = user.id
      client.roomId = roomId
    }
    
    return { success: true, room }
  }

  leaveRoom(socketId: string): { roomId?: string; userId?: string } {
    const userId = this.userSocketMap.get(socketId)
    if (!userId) return {}

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(userId)) {
        room.users.delete(userId)
        this.userSocketMap.delete(socketId)
        
        // Delete room if empty
        if (room.users.size === 0) {
          this.rooms.delete(roomId)
        }
        
        return { roomId, userId }
      }
    }
    
    return {}
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  getUsersInRoom(roomId: string): User[] {
    const room = this.rooms.get(roomId)
    return room ? Array.from(room.users.values()) : []
  }

  getClientsInRoom(roomId: string): ExtendedWebSocket[] {
    return Array.from(this.clients.values()).filter(client => client.roomId === roomId)
  }

  broadcastToRoom(roomId: string, message: WebSocketMessage, excludeId?: string) {
    const clients = this.getClientsInRoom(roomId)
    clients.forEach(client => {
      if (client.id !== excludeId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.getClient(clientId)
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  }
}

const videoCallManager = new VideoCallManager()

export function setupVideoCallWebSocket(wss: WebSocketServer) {
  // Heartbeat mechanism
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
    const ws = client as ExtendedWebSocket
      if (!ws.isAlive) {
        console.log('Terminating dead connection:', ws.id)
        const { roomId, userId } = videoCallManager.removeClient(ws.id)
        if (roomId && userId) {
          videoCallManager.broadcastToRoom(roomId, {
            type: 'user-left',
            data: {
              userId,
              users: videoCallManager.getUsersInRoom(roomId)
            }
          })
        }
        return ws.terminate()
      }
      
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.id = uuidv4()
    ws.isAlive = true
    
    videoCallManager.addClient(ws)
    console.log('Client connected:', ws.id)

    // Heartbeat
    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString())
        handleMessage(ws, message)
      } catch (error) {
        console.error('Error parsing message:', error)
        sendError(ws, 'Invalid message format')
      }
    })

    ws.on('close', () => {
      console.log('Client disconnected:', ws.id)
      const { roomId, userId } = videoCallManager.removeClient(ws.id)
      
      if (roomId && userId) {
        videoCallManager.broadcastToRoom(roomId, {
          type: 'user-left',
          data: {
            userId,
            users: videoCallManager.getUsersInRoom(roomId)
          }
        })
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })

  wss.on('close', () => {
    clearInterval(interval)
  })
}

function handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
  const { type, data } = message

  switch (type) {
    case 'join-room':
      handleJoinRoom(ws, data)
      break
    
    case 'leave-room':
      handleLeaveRoom(ws)
      break
    
    case 'signal':
      handleSignal(ws, data)
      break
    
    case 'send-offer':
      handleSendOffer(ws, data)
      break
    
    case 'send-answer':
      handleSendAnswer(ws, data)
      break
    
    case 'ice-candidate':
      handleIceCandidate(ws, data)
      break
    
    case 'toggle-media':
      handleToggleMedia(ws, data)
      break
    
    case 'start-screen-share':
      handleStartScreenShare(ws, data)
      break
    
    case 'stop-screen-share':
      handleStopScreenShare(ws, data)
      break
    
    case 'send-message':
      handleSendMessage(ws, data)
      break
    
    default:
      sendError(ws, `Unknown message type: ${type}`)
  }
}

function handleJoinRoom(ws: ExtendedWebSocket, data: { roomId: string; user: Omit<User, 'socketId'> }) {
  try {
    const user: User = {
      ...data.user,
      socketId: ws.id
    }

    const result = videoCallManager.joinRoom(data.roomId, user)
    
    if (!result.success) {
      ws.send(JSON.stringify({
        type: 'join-room-error',
        data: { error: result.error }
      }))
      return
    }

    // Notify user of successful join
    ws.send(JSON.stringify({
      type: 'joined-room',
      data: {
        roomId: data.roomId,
        user,
        users: videoCallManager.getUsersInRoom(data.roomId)
      }
    }))

    // Notify other users in room
    videoCallManager.broadcastToRoom(data.roomId, {
      type: 'user-joined',
      data: {
        user,
        users: videoCallManager.getUsersInRoom(data.roomId)
      }
    }, ws.id)

    console.log(`User ${user.name} joined room ${data.roomId}`)
  } catch (error) {
    console.error('Error joining room:', error)
    sendError(ws, 'Failed to join room')
  }
}

function handleLeaveRoom(ws: ExtendedWebSocket) {
  const { roomId, userId } = videoCallManager.removeClient(ws.id)
  
  if (roomId && userId) {
    videoCallManager.broadcastToRoom(roomId, {
      type: 'user-left',
      data: {
        userId,
        users: videoCallManager.getUsersInRoom(roomId)
      }
    })
    console.log(`User ${userId} left room ${roomId}`)
  }
}

function handleSignal(ws: ExtendedWebSocket, data: SignalData) {
  videoCallManager.sendToClient(data.to, {
    type: 'signal',
    data: {
      signal: data.signal,
      from: data.from,
      type: data.type
    }
  })
}

function handleSendOffer(ws: ExtendedWebSocket, data: { offer: any; to: string; from: string }) {
  videoCallManager.sendToClient(data.to, {
    type: 'receive-offer',
    data: {
      offer: data.offer,
      from: data.from
    }
  })
}

function handleSendAnswer(ws: ExtendedWebSocket, data: { answer: any; to: string; from: string }) {
  videoCallManager.sendToClient(data.to, {
    type: 'receive-answer',
    data: {
      answer: data.answer,
      from: data.from
    }
  })
}

function handleIceCandidate(ws: ExtendedWebSocket, data: { candidate: any; to: string; from: string }) {
  videoCallManager.sendToClient(data.to, {
    type: 'ice-candidate',
    data: {
      candidate: data.candidate,
      from: data.from
    }
  })
}

function handleToggleMedia(ws: ExtendedWebSocket, data: { roomId: string; userId: string; mediaType: 'video' | 'audio'; enabled: boolean }) {
  if (ws.roomId) {
    videoCallManager.broadcastToRoom(ws.roomId, {
      type: 'media-toggled',
      data: {
        userId: data.userId,
        mediaType: data.mediaType,
        enabled: data.enabled
      }
    }, ws.id)
  }
}

function handleStartScreenShare(ws: ExtendedWebSocket, data: { roomId: string; userId: string }) {
  if (ws.roomId) {
    videoCallManager.broadcastToRoom(ws.roomId, {
      type: 'screen-share-started',
      data: {
        userId: data.userId
      }
    }, ws.id)
  }
}

function handleStopScreenShare(ws: ExtendedWebSocket, data: { roomId: string; userId: string }) {
  if (ws.roomId) {
    videoCallManager.broadcastToRoom(ws.roomId, {
      type: 'screen-share-stopped',
      data: {
        userId: data.userId
      }
    }, ws.id)
  }
}

function handleSendMessage(ws: ExtendedWebSocket, data: { roomId: string; message: string; user: User }) {
  const messageData = {
    id: Date.now().toString(),
    message: data.message,
    user: data.user,
    timestamp: new Date()
  }
  
  if (ws.roomId) {
    videoCallManager.broadcastToRoom(ws.roomId, {
      type: 'receive-message',
      data: messageData
    })
  }
}

function sendError(ws: ExtendedWebSocket, error: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error }
    }))
  }
}
import { WebSocket } from 'ws';
import { WSMessageType } from '@/constants/constants';

interface ConnectedClient {
  userId: number;
  socket: WebSocket;
  lastActivity: Date;
}

interface WebSocketMessage {
  type: WSMessageType;
  userId?: number;
  from?: number;
  to?: number;
  roomId?: number;
  message?: any;
  data?: any;
}

class WebSocketService {
  private clients: Map<number, WebSocket> = new Map();

  addClient(userId: number, socket: WebSocket) {
    // Xóa kết nối cũ nếu có
    const existingSocket = this.clients.get(userId);
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      existingSocket.close();
    }

    this.clients.set(userId, socket);
    console.log(`User ${userId} connected. Total clients: ${this.clients.size}`);

    // Thông báo cho tất cả users khác rằng user này đã online
    this.broadcastUserStatus(userId, WSMessageType.USER_ONLINE);
  }

  removeClient(userId: number) {
    const socket = this.clients.get(userId);
    if (socket) {
      this.clients.delete(userId);
      console.log(`User ${userId} disconnected. Total clients: ${this.clients.size}`);
      
      // Thông báo cho tất cả users khác rằng user này đã offline
      this.broadcastUserStatus(userId, WSMessageType.USER_OFFLINE);
    }
  }

  getClient(userId: number): WebSocket | undefined {
    return this.clients.get(userId);
  }

  isUserOnline(userId: number): boolean {
    const socket = this.clients.get(userId);
    return socket !== undefined && socket.readyState === WebSocket.OPEN;
  }

  getOnlineUsers(): number[] {
    return Array.from(this.clients.keys());
  }

  // Gửi tin nhắn 1-1
  sendPrivateMessage(fromUserId: number, toUserId: number, data: any) {
    const receiverSocket = this.clients.get(toUserId);
    
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: WSMessageType.PRIVATE_MESSAGE,
        from: fromUserId,
        ...data
      };
      
      receiverSocket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Gửi tin nhắn nhóm
  sendGroupMessage(fromUserId: number, memberIds: number[], data: any) {
    let sentCount = 0;
    memberIds.forEach(memberId => {
      if (memberId !== fromUserId) {
        const socket = this.clients.get(memberId);
        if (socket && socket.readyState === WebSocket.OPEN) {
          const message: WebSocketMessage = {
            type: WSMessageType.GROUP_MESSAGE,
            from: fromUserId,
            ...data
          };
          socket.send(JSON.stringify(message));
          sentCount++;
        }
      }
    });

    return sentCount;
  }
  // Gửi thông báo typing
  sendTypingIndicator(fromUserId: number, toUserId: number, isTyping: boolean) {
    const receiverSocket = this.clients.get(toUserId);
    
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: WSMessageType.TYPING,
        from: fromUserId,
        data: { isTyping }
      };
      receiverSocket.send(JSON.stringify(message));
    }
  }
  // Gửi thông báo đã đọc tin nhắn
  sendMessageRead(fromUserId: number, toUserId: number, messageId: number) {
    const receiverSocket = this.clients.get(toUserId);
    
    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: WSMessageType.MESSAGE_READ,
        from: fromUserId,
        data: { messageId }
      };
      receiverSocket.send(JSON.stringify(message));
    }
  }
  // Broadcast trạng thái online/offline của user
  private broadcastUserStatus(userId: number, status: WSMessageType) {
    const message: WebSocketMessage = {
      type: status,
      userId
    };

    this.clients.forEach((socket, clientId) => {
      if (clientId !== userId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  }
  // Gửi tin nhắn cho nhiều users
  broadcast(message: any, excludeUserId?: number) {
    this.clients.forEach((socket, userId) => {
      if (userId !== excludeUserId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  }

  // Gửi tin nhắn cho một user
  sendToUser(userId: number, message: any) {
    const socket = this.clients.get(userId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
  cleanupInactiveConnections() {
    this.clients.forEach((socket, userId) => {
      if (socket.readyState !== WebSocket.OPEN) {
        this.removeClient(userId);
      }
    });
  }
}

export const wsService = new WebSocketService();
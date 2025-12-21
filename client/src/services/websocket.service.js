class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isManuallyDisconnected = false;
    this.messageHandlers = new Map();
  }

  // connect() {
  //   const { user, accessToken } = useAuthStore.getState();

  //   if (!user || !accessToken) {

  //     console.log('No user or token, cannot connect to WebSocket');
  //     return;
  //   }

  //   if (this.socket?.readyState === WebSocket.OPEN) {
  //     console.log('WebSocket already connected');
  //     return;
  //   }

  //   try {
  //     const wsUrl = `${'ws://localhost:8000'}`;
  //     this.socket = new WebSocket(wsUrl);
  //     this.isManuallyDisconnected = false;
  //     this.socket.onopen = () => {
  //       console.log('WebSocket connected');
  //       this.reconnectAttempts = 0;
        
  //       // Authenticate với server
  //       this.send({
  //         type: 'auth',
  //         token: accessToken,
  //         userId: user.id
  //       });
  //     };

  //     this.socket.onmessage = (event) => {
  //       try {
  //         const data = JSON.parse(event.data);
  //         this.handleMessage(data);
  //       } catch (error) {
  //         console.error('Error parsing WebSocket message:', error);
  //       }
  //     };

  //     this.socket.onclose = (event) => {
  //       console.log('WebSocket disconnected:', event.code, event.reason);
  //       this.socket = null;
        
  //       if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
  //         setTimeout(() => {
  //           this.reconnectAttempts++;
  //           console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
  //           this.connect();
  //         }, this.reconnectDelay);
  //       }
  //     };

  //     this.socket.onerror = (error) => {
  //       console.error('WebSocket error:', error);
  //     };

  //   } catch (error) {
  //     console.error('Error creating WebSocket connection:', error);
  //   }
  // }

  disconnect() {
    this.isManuallyDisconnected = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  handleMessage(data) {
    const { type } = data;
    
    // Gọi các handler đã đăng ký
    const handlers = this.messageHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  // Đăng ký handler cho một loại message
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
    
    // Trả về function để hủy đăng ký
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Gửi tin nhắn riêng tư
  sendPrivateMessage(receiverId, content, type = 'text', fileURL = null) {
    this.send({
      type: 'private_message',
      data: {
        receiverId,
        content,
        type,
        fileURL
      }
    });
  }

  // Gửi tin nhắn nhóm
  sendGroupMessage(groupId, content, type = 'text', fileURL = null) {
    this.send({
      type: 'group_message',
      data: {
        groupId,
        content,
        type,
        fileURL
      }
    });
  }

  // Gửi trạng thái đang gõ
  sendTyping(receiverId, isTyping) {
    this.send({
      type: 'typing',
      data: {
        receiverId,
        isTyping
      }
    });
  }

  // Đánh dấu tin nhắn đã đọc
  markMessageRead(senderId, messageId) {
    this.send({
      type: 'message_read',
      data: {
        senderId,
        messageId
      }
    });
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export default  WebSocketService;
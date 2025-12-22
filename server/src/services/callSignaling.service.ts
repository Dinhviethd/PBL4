import { WebSocket } from 'ws';
import CallService from '@/services/call.service';
import { WSMessageType } from '@/constants/constants';
import { AppDataSource } from '@/configs/database.config';
import { User } from '@/models/users.model';

interface ClientInfo {
  userId: number;
  ws: WebSocket;
}

interface CallSignalingData {
  type: string;
  fromUserId: number;
  toUserId: number;
  callId?: number;
  callType?: 'audio' | 'video';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

/**
 * Quản lý signaling cho cuộc gọi WebRTC
 */
class CallSignalingManager {
  private activeConnections = new Map<number, ClientInfo>();
  private activeCalls = new Map<number, any>();
  private processedDeclines = new Set<number>(); // Track processed decline for each callId

  /**
   * Đăng ký kết nối người dùng
   */
  registerConnection(userId: number, ws: WebSocket) {
    this.activeConnections.set(userId, { userId, ws });
    this.logActiveConnections();
  }

  /**
   * Hủy đăng ký kết nối
   */
  unregisterConnection(userId: number) {
    this.activeConnections.delete(userId);
    this.logActiveConnections();
  }

  /**
   * Log danh sách kết nối hiện tại
   */
  private logActiveConnections() {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Active WebSocket Connections:');
    
    if (this.activeConnections.size === 0) {
      console.log('   ℹ️  No active connections');
    } else {
      console.log(`   Total: ${this.activeConnections.size}`);
      let index = 1;
      this.activeConnections.forEach((client, userId) => {
        const wsStatus = client.ws.readyState === WebSocket.OPEN ? '🟢' : '🔴';
        console.log(`   ${index}. User ${userId} ${wsStatus}`);
        index++;
      });
    }
    console.log('═══════════════════════════════════════\n');
  }

  /**
   * Lấy danh sách tất cả kết nối
   */
  getActiveConnections() {
    const connections: any[] = [];
    this.activeConnections.forEach((client, userId) => {
      connections.push({
        userId,
        readyState: client.ws.readyState,
        status: client.ws.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'
      });
    });
    return connections;
  }

  /**
   * Gửi data tới người dùng khác
   */
  private sendToUser(toUserId: number, data: any) {
    const client = this.activeConnections.get(toUserId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  /**
   * Bắt đầu cuộc gọi - gửi offer đến người nhận
   */
  async handleCallInitiate(data: CallSignalingData) {
    try {
      const { fromUserId, toUserId, callType } = data;

    
      // Log active connections
      this.logActiveConnections();

      // Kiểm tra người dùng nhận có online không
      const recipientConnected = this.activeConnections.has(toUserId);

      if (!recipientConnected) {
        return {
          success: false,
          error: 'User is offline',
          data: { fromUserId, toUserId }
        };
      }

      // Tạo bản ghi cuộc gọi trong DB
      const call = await CallService.initiateCall(
        fromUserId,
        toUserId,
        callType || 'audio'
      );

      // Lấy thông tin người gọi từ DB
      let callerInfo: any = null;
      try {
        // Try to get caller info from database
        const callerUser = await AppDataSource.getRepository(User).findOne({
          where: { idUser: fromUserId },
          select: ['idUser', 'name', 'avatarUrl', 'email']
        });
        
        console.log('📞 Caller user from DB:', callerUser);
        
        if (callerUser) {
          callerInfo = {
            idUser: callerUser.idUser,
            name: callerUser.name,
            avatarUrl: callerUser.avatarUrl,
            email: callerUser.email
          };
        }
      } catch (err) {
        console.log('⚠️ Could not fetch caller info from DB:', err);
      }

      console.log('📞 Sending CALL_INITIATE to user', toUserId, 'with callerInfo:', callerInfo);

      // Gửi thông báo cuộc gọi đến người nhận
      this.sendToUser(toUserId, {
        type: WSMessageType.CALL_INITIATE,
        data: {
          callId: call.idCall,
          callType: call.callType,
          fromUserId,
          caller: callerInfo || {
            idUser: fromUserId
          }
        }
      });

      // Gửi response về cho caller để confirm call đã được tạo
      this.sendToUser(fromUserId, {
        type: 'CALL_INITIATE_RESPONSE',
        data: {
          callId: call.idCall,
          success: true,
          toUserId
        }
      });

      return {
        success: true,
        data: { callId: call.idCall }
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      return {
        success: false,
        error: 'Failed to initiate call'
      };
    }
  }

  /**
   * Xử lý SDP Offer từ caller
   */
  handleOffer(data: CallSignalingData) {
    const { fromUserId, toUserId, callId, offer } = data;

    const sent = this.sendToUser(toUserId, {
      type: WSMessageType.CALL_OFFER,
      data: {
        callId,
        fromUserId,
        offer
      }
    });

    return { success: sent };
  }

  /**
   * Xử lý SDP Answer từ callee
   */
  handleAnswer(data: CallSignalingData) {
    const { fromUserId, toUserId, callId, answer } = data;

    // Cập nhật trạng thái cuộc gọi - đã chấp nhận
    CallService.acceptCall(callId!).catch(err => 
      console.error('Error accepting call:', err)
    );

    const sent = this.sendToUser(toUserId, {
      type: WSMessageType.CALL_ANSWER,
      data: {
        callId,
        fromUserId,
        answer
      }
    });

    return { success: sent };
  }

  /**
   * Xử lý ICE Candidate
   */
  handleIceCandidate(data: CallSignalingData) {
    const { fromUserId, toUserId, callId, candidate } = data;

    const sent = this.sendToUser(toUserId, {
      type: WSMessageType.CALL_ICE_CANDIDATE,
      data: {
        callId,
        fromUserId,
        candidate
      }
    });

    return { success: sent };
  }

  /**
   * Người nhận chấp nhận cuộc gọi
   */
  async handleCallAccept(data: CallSignalingData) {
    try {
      const { callId, fromUserId, toUserId } = data;

    
      // Check if already processed this accept
      if (this.processedDeclines.has(callId!)) {
        console.log(`   ⚠️  Already processed for this callId, ignoring duplicate`);
        return { success: false, error: 'Accept already processed' };
      }

      // Mark as processed
      this.processedDeclines.add(callId!);

      // Update database
      await CallService.acceptCall(callId!);

      // Send CALL_ACCEPT to Caller
      const sent = this.sendToUser(toUserId, {
        type: 'CALL_ACCEPT',
        data: {
          callId,
          fromUserId
        }
      });

      
      if (!sent) {
        this.logActiveConnections();
      }

      // Clean up after 5 seconds
      setTimeout(() => {
        this.processedDeclines.delete(callId!);
      }, 5000);

      return { success: sent };
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      return { success: false, error: 'Failed to accept call' };
    }
  }

  /**
   * Người nhận từ chối cuộc gọi
   */
  handleCallDecline(data: CallSignalingData) {
    const { callId, fromUserId, toUserId } = data;

    // Check if already processed this decline
    if (this.processedDeclines.has(callId!)) {
      return { success: false, error: 'Decline already processed' };
    }


    // Mark as processed
    this.processedDeclines.add(callId!);

    // Update call status in DB to 'declined'
    CallService.endCall(callId!)
      .catch(err => console.error('Error updating call status on decline:', err));

    // Send decline notification to caller
    const sentToCaller = this.sendToUser(toUserId, {
      type: WSMessageType.CALL_DECLINE,
      data: {
        callId,
        fromUserId
      }
    });


    // Clean up after 5 seconds`
    setTimeout(() => {
      this.processedDeclines.delete(callId!);
    }, 5000);

    return { success: sentToCaller };
  }

  /**
   * Kết thúc cuộc gọi
   */
  async handleCallEnd(data: CallSignalingData) {
    try {
      const { callId, fromUserId, toUserId } = data;


      await CallService.endCall(callId!);

      // Notify both parties (caller and callee) about call end to ensure
      // all client instances (possibly mounted in different components)
      // receive the termination signal and clean up media/peer connections.
      const payload = {
        type: WSMessageType.CALL_END,
        data: {
          callId,
          fromUserId
        }
      };

      const sentToCallee = this.sendToUser(toUserId, payload);
      const sentToCaller = this.sendToUser(fromUserId, payload);

      return { success: sentToCallee || sentToCaller };
    } catch (error) {
      console.error('Error ending call:', error);
      return { success: false, error: 'Failed to end call' };
    }
  }

  /**
   * Xử lý lỗi trong cuộc gọi
   */
  handleCallError(data: CallSignalingData) {
    const { callId, fromUserId, toUserId } = data;

    const sent = this.sendToUser(toUserId, {
      type: WSMessageType.CALL_ERROR,
      data: {
        callId,
        fromUserId,
        error: (data as any).error
      }
    });

    return { success: sent };
  }

  /**
   * Xử lý message từ signaling
   */
  async handleSignalingMessage(userId: number, data: CallSignalingData) {
    const { type } = data;

    // Gắn userId từ người gửi
    data.fromUserId = userId;

    // Convert toUserId từ string sang number
    if (data.toUserId && typeof data.toUserId === 'string') {
      data.toUserId = parseInt(data.toUserId, 10);
    }

    switch (type) {
      case 'CALL_INITIATE':
        return await this.handleCallInitiate(data);

      case 'CALL_OFFER':
        return this.handleOffer(data);

      case 'CALL_ANSWER':
        return this.handleAnswer(data);

      case 'CALL_ICE_CANDIDATE':
        return this.handleIceCandidate(data);

      case 'CALL_ACCEPT':
        return await this.handleCallAccept(data);

      case 'CALL_DECLINE':
        return this.handleCallDecline(data);

      case 'CALL_END':
        return await this.handleCallEnd(data);

      case 'CALL_ERROR':
        return this.handleCallError(data);

      default:
        return { success: false, error: 'Unknown signaling message type' };
    }
  }

  /**
   * Kiểm tra người dùng có online không
   */
  isUserOnline(userId: number): boolean {
    return this.activeConnections.has(userId);
  }

  /**
   * Lấy trạng thái kết nối của người dùng
   */
  getConnectionStatus(userId: number) {
    const client = this.activeConnections.get(userId);
    return {
      isOnline: !!client,
      connectionState: client?.ws.readyState
    };
  }

  /**
   * Đảm bảo các tin nhắn CAMERA_TOGGLE được xử lý và chuyển tiếp đến các peer
   */
  handleCameraToggle(callId: string, userId: string, isCameraOn: boolean) {
    const message = {
      type: 'CAMERA_TOGGLE',
      data: {
        userId,
        isCameraOn,
      },
    };
    this.sendToUser(Number(userId), message);
  }
}

export default new CallSignalingManager();

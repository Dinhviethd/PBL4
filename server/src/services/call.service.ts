import { AppDataSource } from '@/configs/database.config';
import { Call } from '@/models/call.model';
import { CallStatus } from '@/constants/constants';
import { Repository } from 'typeorm';

class CallService {
  private callRepository: Repository<Call>;

  constructor() {
    this.callRepository = AppDataSource.getRepository(Call);
  }

  /**
   * Tạo bản ghi cuộc gọi mới
   */
  async initiateCall(
    callerId: number,
    receiverId: number,
    callType: 'audio' | 'video'
  ): Promise<Call> {
    const call = this.callRepository.create({
      caller_id: callerId,
      receiver_id: receiverId,
      callType,
      callStatus: CallStatus.MISSED,
      startedAt: new Date()
    });

    return await this.callRepository.save(call);
  }

  /**
   * Cập nhật trạng thái khi người dùng chấp nhận cuộc gọi
   */
  async acceptCall(callId: number): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { idCall: callId }
    });

    if (!call) {
      throw new Error('Call not found');
    }

    call.callStatus = CallStatus.ONGOING;
    call.answeredAt = new Date();

    return await this.callRepository.save(call);
  }

  /**
   * Kết thúc cuộc gọi
   */
  async endCall(callId: number): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { idCall: callId }
    });

    if (!call) {
      throw new Error('Call not found');
    }

    const endedAt = new Date();
    const startedAt = call.answeredAt || call.startedAt;
    const duration = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000
    );

    call.callStatus = CallStatus.ENDED;
    call.endedAt = endedAt;
    call.duration = duration;

    return await this.callRepository.save(call);
  }

  /**
   * Lấy lịch sử cuộc gọi giữa 2 người dùng
   */
  async getCallHistory(userId1: number, userId2: number, limit: number = 50) {
    const calls = await this.callRepository.find({
      where: [
        {
          caller_id: userId1,
          receiver_id: userId2
        },
        {
          caller_id: userId2,
          receiver_id: userId1
        }
      ],
      order: {
        startedAt: 'DESC'
      },
      take: limit
    });

    return calls;
  }

  /**
   * Lấy cuộc gọi theo ID
   */
  async getCallById(callId: number): Promise<Call | null> {
    return await this.callRepository.findOne({
      where: { idCall: callId }
    });
  }

  /**
   * Lấy tất cả cuộc gọi đã nhận của người dùng
   */
  async getReceivedCalls(userId: number, limit: number = 50) {
    return await this.callRepository.find({
      where: {
        receiver_id: userId
      },
      order: {
        startedAt: 'DESC'
      },
      take: limit
    });
  }

  /**
   * Lấy tất cả cuộc gọi đã gửi của người dùng
   */
  async getSentCalls(userId: number, limit: number = 50) {
    return await this.callRepository.find({
      where: {
        caller_id: userId
      },
      order: {
        startedAt: 'DESC'
      },
      take: limit
    });
  }
}

export default new CallService();

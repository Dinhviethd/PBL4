import axios from '@/services/axios.config';

const API_BASE_URL = '/calls';

class CallService {
  /**
   * Lấy lịch sử cuộc gọi với một người dùng
   */
  getCallHistory(userId) {
    return axios.get(`${API_BASE_URL}/history/${userId}`);
  }

  /**
   * Lấy tất cả cuộc gọi đã nhận
   */
  getReceivedCalls() {
    return axios.get(`${API_BASE_URL}/received`);
  }

  /**
   * Lấy tất cả cuộc gọi đã gửi
   */
  getSentCalls() {
    return axios.get(`${API_BASE_URL}/sent`);
  }

  /**
   * Lấy thông tin chi tiết cuộc gọi
   */
  getCall(callId) {
    return axios.get(`${API_BASE_URL}/${callId}`);
  }
}

export default new CallService();

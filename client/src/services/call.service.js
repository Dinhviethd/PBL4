import instance from "./axios.config";

const callService = {
  /**
   * Lấy lịch sử cuộc gọi với một người dùng (có pagination)
   */
  async getCallHistory(userId, page = 1, limit = 20) {
    const res = await instance.get(`/calls/history/${userId}`, {
      params: { page, limit }
    });
    return res.data.data;
  },

  /**
   * Lấy tất cả cuộc gọi đã nhận
   */
  async getReceivedCalls(page = 1, limit = 20) {
    const res = await instance.get("/calls/received", {
      params: { page, limit }
    });
    return res.data.data;
  },

  /**
   * Lấy tất cả cuộc gọi đã gửi
   */
  async getSentCalls(page = 1, limit = 20) {
    const res = await instance.get("/calls/sent", {
      params: { page, limit }
    });
    return res.data.data;
  },

  /**
   * Lấy thông tin chi tiết cuộc gọi
   */
  async getCall(callId) {
    const res = await instance.get(`/calls/${callId}`);
    return res.data.data;
  },

  /**
   * Lấy lịch sử cuộc gọi của user hiện tại
   */
  async getMyCallHistory(page = 1, limit = 20) {
    const res = await instance.get("/calls/my-history", {
      params: { page, limit }
    });
    return res.data.data;
  },

  /**
   * Tạo record cuộc gọi mới
   */
  async createCall(data) {
    const res = await instance.post("/calls", data);
    return res.data.data;
  },

  /**
   * Cập nhật thông tin cuộc gọi
   */
  async updateCall(callId, data) {
    const res = await instance.put(`/calls/${callId}`, data);
    return res.data.data;
  },

  /**
   * Xóa cuộc gọi
   */
  async deleteCall(callId) {
    const res = await instance.delete(`/calls/${callId}`);
    return res.data.data;
  }
};

export default callService;

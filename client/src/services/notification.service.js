import instance from "./axios.config";

const notificationService = {
  async getNotifications() {
    const response = await instance.get("/notifications");
    return response.data;
  },

  async markNotificationAsSeen(notificationId) {
    const response = await instance.patch(`/notifications/${notificationId}/seen`);
    return response.data;
  }
};

export default notificationService;
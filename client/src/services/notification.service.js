import instance from "./axios.config";

const notificationService = {
  async getNotifications() {
    const response = await instance.get("/notifications");
    return response.data;
  }
};

export default notificationService;
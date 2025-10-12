import instance from "./axios.config";

const userService = {
  async getProfile() {
    const res = await instance.get("/users/me");
    return res.data.data;
  },

  async updateProfile(data) {
    const res = await instance.put("/users/me", data);
    return res.data.data;
  },

  async uploadAvatar(file) {
    if (!file) throw new Error("File không hợp lệ!");
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await instance.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async changePassword(data) {
    const res = await instance.put("/users/change-password", data);
    return res.data;
  },

  async deactivateAccount(data) {
    const res = await instance.put("/users/deactivate", data);
    return res.data;
  },

  async reactivateAccount() {
    const res = await instance.put("/users/reactivate");
    return res.data;
  },

  async getAccountStatus() {
    const res = await instance.get("/users/status");
    return res.data;
  },

  async deleteAccount(data) {
    const res = await instance.delete("/users/me", { data });
    return res.data;
  },
};

export default userService;

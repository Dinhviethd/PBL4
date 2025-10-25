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

	async deleteAccount(data) {
		const res = await instance.delete("/users/me", {
			data: data
		});
		return res.data;
	},

	// Search users - sử dụng lookup endpoint
	searchUsers: async (query) => {
		try {
			const isEmail = query.includes('@');
			const params = {};
			
			if (isEmail) {
				params.email = query;
			} else {
				params.phone = query;
			}
			
			const response = await instance.get("/users/lookup", { params });
			
			return {
				success: true,
				data: response.data?.data ? [response.data.data] : []
			};
		} catch (error) {
			// Nếu không tìm thấy, trả về mảng rỗng thay vì throw error
			if (error.response?.status === 404) {
				return {
					success: true,
					data: []
				};
			}
			throw error.response?.data || { message: "Failed to search users" };
		}
	},

	// Get user profile
	getProfile: async () => {
		try {
			const response = await instance.get("/users/profile");
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to get profile" };
		}
	},

	// Get account status
	getAccountStatus: async () => {
		try {
			const response = await instance.get("/users/status");
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to get account status" };
		}
	},

	// Reactivate account
	reactivateAccount: async () => {
		try {
			const response = await instance.post("/users/reactivate");
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to reactivate account" };
		}
	},

   deleteAccount: async (data) => {
    const res = await instance.delete("/users/me", { data });
    return res.data;
  },
 
  async lookup({ email, phone } = {}) {
    const params = {};
    if (email) params.email = email;
    if (phone) params.phone = phone;
    const res = await instance.get('/users/lookup', { params });
    return res.data?.data;
  }
};

export default userService;

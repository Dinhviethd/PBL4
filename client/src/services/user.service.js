import instance from "./axios.config";

const userService = {
	async getProfile() {
		const res = await instance.get("/users/me");
		return res.data.data; // Trả về user data trực tiếp
	},
	

	async updateProfile(data) {
		const res = await instance.put("/users/me", data);
		return res.data.data; // Trả về user data trực tiếp
	},

	uploadAvatar: async(file) => {
		try {const formData = new FormData();
		formData.append('avatar', file);
		
		const res = await instance.post("/users/avatar", formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
		return res.data.data; 
		}
		catch(error){
			console.log("Loi update avatar")
		}
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
		const res = await instance.delete("/users/me", {
			data: data
		});
		return res.data;
	},

	// Search users
	searchUsers: async (query) => {
		try {
			const response = await instance.get("/users/search", {
				params: { q: query, limit: 20 }
			});
			return response.data;
		} catch (error) {
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
	}
};

export default userService;

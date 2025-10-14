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
};

export default userService;

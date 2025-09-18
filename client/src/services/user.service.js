import instance from "./axios.config";

const userService = {
	async getProfile() {
		const res = await instance.get("/users/me");
		return res.data;
	},

	async updateProfile(data) {
		const res = await instance.put("/users/me", data);
		return res.data;
	},
};

export default userService;

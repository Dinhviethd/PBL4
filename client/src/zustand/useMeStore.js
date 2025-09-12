import { create } from 'zustand'

const userMeStore = create((set) => ({
    token: null,
    info: null,
    setToken: (token) => set(() => ({token: token})),
    setInfo: (info) => set(() => ({info: info}))
    // getInfo
}))
export default userMeStore

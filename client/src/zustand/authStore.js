import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setAuth: (data) =>
        set({
          user: data.user || null,
          accessToken: data.accessToken || null,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
        }),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({ 
        user: state.user,
        accessToken: state.accessToken 
      }),
    }
  )
);

export default useAuthStore;

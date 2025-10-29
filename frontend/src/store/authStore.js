import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      
      setAuth: (usuario, token) => set({ usuario, token }),
      
      logout: () => set({ usuario: null, token: null }),
      
      isAuthenticated: () => {
        const state = useAuthStore.getState()
        return !!state.token
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)

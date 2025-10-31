import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      
      setAuth: (usuario, token) => {
        set({ usuario, token })
        // Força sincronização imediata com localStorage
        localStorage.setItem('auth-storage', JSON.stringify({
          state: { usuario, token },
          version: 0
        }))
      },
      
      logout: () => {
        set({ usuario: null, token: null })
        // Limpa localStorage imediatamente
        localStorage.removeItem('auth-storage')
      },
      
      isAuthenticated: () => {
        const state = get()
        return !!state.token
      }
    }),
    {
      name: 'auth-storage',
      skipHydration: false,
    }
  )
)

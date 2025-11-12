import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      
      setAuth: (usuario, token) => {
        console.log('🔐 setAuth chamado:', { usuario: usuario?.nome, hasToken: !!token })
        set({ usuario, token })
      },
      
      logout: () => {
        console.log('🚪 Logout chamado')
        set({ usuario: null, token: null })
        // Limpar localStorage imediatamente
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
      // Versão do storage para forçar limpeza se necessário
      version: 1,
    }
  )
)

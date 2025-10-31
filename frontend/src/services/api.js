import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 segundos timeout
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Tempo limite excedido. Tente novamente.'))
    }
    
    // Network error
    if (!error.response) {
      return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'))
    }
    
    const originalRequest = error.config
    
    // Só redirecionar para login se NÃO for uma requisição de login/register
    // e se o usuário estiver autenticado (tem token)
    if (error.response?.status === 401 && 
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/register') &&
        !originalRequest._retry) {
      
      originalRequest._retry = true
      
      const hasToken = useAuthStore.getState().token
      if (hasToken) {
        // Limpar estado
        useAuthStore.getState().logout()
        
        // Redirecionar apenas se não estiver na página de login
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

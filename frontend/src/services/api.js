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
  (error) => {
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout')
      return Promise.reject(new Error('Tempo limite excedido. Verifique sua conexão.'))
    }
    
    // Só redirecionar para login se NÃO for uma requisição de login
    // e se o usuário estiver autenticado (tem token)
    if (error.response?.status === 401 && 
        !error.config.url.includes('/auth/login') &&
        !error.config.url.includes('/auth/register') &&
        useAuthStore.getState().token) {
      useAuthStore.getState().logout()
      
      // Evitar múltiplos redirects
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

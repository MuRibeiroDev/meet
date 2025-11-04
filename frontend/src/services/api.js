import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 segundos timeout
})

// Log da URL da API (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
}

// Cache simples para requisições GET
const cache = new Map()
const CACHE_DURATION = 3000 // 3 segundos

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Verificar cache para requisições GET
    if (config.method === 'get' && !config.params?.nocache) {
      const cacheKey = config.url + JSON.stringify(config.params)
      const cached = cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        })
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação e cachear respostas
api.interceptors.response.use(
  (response) => {
    // Cachear respostas GET bem-sucedidas
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = response.config.url + JSON.stringify(response.config.params)
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })
      
      // Limpar cache antigo (mais de 30 segundos)
      if (cache.size > 50) {
        const now = Date.now()
        for (const [key, value] of cache.entries()) {
          if (now - value.timestamp > 30000) {
            cache.delete(key)
          }
        }
      }
    }
    
    return response
  },
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

// Função para limpar cache manualmente
export const clearApiCache = () => {
  cache.clear()
}

export default api

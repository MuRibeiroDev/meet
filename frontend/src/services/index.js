import api from './api'

export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha })
    return response.data
  },

  register: async (nome, email, senha) => {
    const response = await api.post('/auth/register', { nome, email, senha })
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/usuarios/me')
    return response.data
  }
}

export const salasService = {
  getAll: async () => {
    const response = await api.get('/salas')
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/salas/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/salas', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/salas/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/salas/${id}`)
    return response.data
  }
}

export const agendamentosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/agendamentos', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/agendamentos/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/agendamentos', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/agendamentos/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/agendamentos/${id}`)
    return response.data
  },

  getDisponibilidade: async (sala_id, data) => {
    const response = await api.get(`/agendamentos/disponibilidade/${sala_id}`, {
      params: { data }
    })
    return response.data
  }
}

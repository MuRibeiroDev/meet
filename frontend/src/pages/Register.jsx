import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services'
import './Auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await authService.register(
        formData.nome,
        formData.email,
        formData.senha
      )
      setAuth(response.usuario, response.token)
      toast.success('Cadastro realizado com sucesso!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📅 Sistema de Reuniões</h1>
          <h2>Cadastro</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="João da Silva"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

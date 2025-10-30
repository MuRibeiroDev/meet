import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services'
import './Login.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  })
  const [loading, setLoading] = useState(false)
  const [validated, setValidated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpar erro ao digitar
    if (loginError) {
      setLoginError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const form = e.currentTarget
    if (form.checkValidity() === false) {
      setValidated(true)
      return
    }

    setLoading(true)
    setLoginError('')

    try {
      const response = await authService.login(formData.email, formData.senha)
      setAuth(response.usuario, response.token)
      
      // Animar saída
      document.body.classList.add('login-leaving')
      document.querySelector('.login-container').classList.add('leaving')
      
      setTimeout(() => {
        navigate('/')
      }, 400)
    } catch (error) {
      console.log('❌ Erro de login:', error)
      console.log('📧 Email atual:', formData.email)
      
      const errorMessage = error.response?.data?.message || 'Email ou senha incorretos'
      
      // Manter o email, limpar apenas a senha
      setFormData(prev => ({
        email: prev.email, // Manter email
        senha: '' // Limpar senha
      }))
      
      setLoginError(errorMessage)
      // toast.error(errorMessage) - Removido, só mostra no input
      setLoading(false)
      setValidated(true)
      
      document.body.classList.remove('login-leaving')
      document.querySelector('.login-container')?.classList.remove('leaving')
      
      // Focar no campo de senha após erro
      setTimeout(() => {
        const senhaInput = document.getElementById('senha')
        if (senhaInput) {
          senhaInput.focus()
          senhaInput.classList.add('shake')
          setTimeout(() => senhaInput.classList.remove('shake'), 500)
        }
      }, 100)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card">
          <div className="card-body">
            {/* Logo e Título */}
            <div className="text-center mb-2">
              <div className="mb-1">
                <img
                  src="/images/logo_osvaldozilli.png"
                  alt="Grupo Osvaldo Zilli"
                  className="img-fluid"
                  style={{ maxWidth: '200px', height: 'auto' }}
                />
              </div>
              <h4 className="mb-2">Salas de Reunião</h4>
              <p className="text-muted mb-0">Digite seu email e senha para acessar</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className={`needs-validation ${validated ? 'was-validated' : ''}`}
              noValidate
            >
              <div className="mb-4">
                <label htmlFor="email" className="form-label fw-medium">
                  Email
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className={`form-control ${loginError ? 'is-invalid shake' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="senha" className="form-label fw-medium">
                  Senha
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control ${loginError ? 'is-invalid shake' : ''}`}
                    id="senha"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="text-end mt-2">
                  <Link to="/forgot-password" className="forgot-password-link">
                    Esqueci minha senha
                  </Link>
                </div>
              </div>

              <div className="d-grid">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-arrow-right me-2"></i>Entrar
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="divider">
              <span>ou</span>
            </div>

            <div className="d-grid">
              <Link to="/register" className="btn btn-success">
                <i className="bi bi-person-plus me-2"></i>Criar Nova Conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services'
import './Login.css'

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  })
  const [loading, setLoading] = useState(false)
  const [validated, setValidated] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpar erro ao digitar
    if (registerError) {
      setRegisterError('')
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

    if (formData.senha !== formData.confirmarSenha) {
      setRegisterError('As senhas não coincidem')
      setValidated(true)
      return
    }

    if (formData.senha.length < 6) {
      setRegisterError('A senha deve ter no mínimo 6 caracteres')
      setValidated(true)
      return
    }

    setLoading(true)
    setRegisterError('')

    try {
      const response = await authService.register(
        formData.nome,
        formData.email,
        formData.senha
      )
      setAuth(response.usuario, response.token)
      
      // Animar saída
      document.body.classList.add('login-leaving')
      document.querySelector('.login-container').classList.add('leaving')
      
      setTimeout(() => {
        navigate('/')
      }, 400)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao cadastrar'
      setRegisterError(errorMessage)
      setLoading(false)
      setValidated(true)
      document.body.classList.remove('login-leaving')
      document.querySelector('.login-container')?.classList.remove('leaving')
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
              <h4 className="mb-2">Criar Nova Conta</h4>
              <p className="text-muted mb-0">Preencha os dados para se cadastrar</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className={`needs-validation ${validated ? 'was-validated' : ''}`}
              noValidate
            >
              <div className="mb-3">
                <label htmlFor="nome" className="form-label fw-medium">
                  Nome Completo
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control ${registerError ? 'is-invalid shake' : ''}`}
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="João da Silva"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-medium">
                  Email
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className={`form-control ${registerError ? 'is-invalid shake' : ''}`}
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

              <div className="mb-3">
                <label htmlFor="senha" className="form-label fw-medium">
                  Senha
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control ${registerError ? 'is-invalid shake' : ''}`}
                    id="senha"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmarSenha" className="form-label fw-medium">
                  Confirmar Senha
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control ${registerError ? 'is-invalid shake' : ''}`}
                    id="confirmarSenha"
                    name="confirmarSenha"
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    placeholder="Digite a senha novamente"
                    required
                    disabled={loading}
                  />
                </div>
                {registerError && (
                  <div className="text-danger mt-2" style={{ fontSize: '0.875rem' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {registerError}
                  </div>
                )}
              </div>

              <div className="d-grid">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>Criar Conta
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="divider">
              <span>ou</span>
            </div>

            <div className="d-grid">
              <Link to="/login" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>Voltar para Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: email, 2: código e senha
  const [transitioning, setTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState('forward') // forward ou backward
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleRequestCode = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('Digite um email válido')
      return
    }
    
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/password/forgot', { email }, { timeout: 5000 })
      setMessage(response.data.message)
      
      // Animação de saída antes de mudar para step 2
      setTransitionDirection('forward')
      setTransitioning(true)
      setTimeout(() => {
        setStep(2)
        setTransitioning(false)
      }, 400)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao solicitar código')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    // Validações antes de iniciar loading
    if (code.length !== 6) {
      setError('Digite o código de 6 dígitos')
      return
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/password/reset', {
        email,
        code,
        newPassword
      }, { timeout: 5000 })
      
      setMessage(response.data.message)
      
      // Redirecionar mais rápido (1 segundo)
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className={`login-card ${transitioning ? `step-transitioning step-${transitionDirection}` : ''}`}>
        <div className="card">
          <div className="card-body">
            {/* Logo e Título */}
            <div className="text-center" style={{ marginBottom: step === 2 ? '1rem' : '0.5rem' }}>
              <div className="mb-1">
                <img
                  src="/images/logo_osvaldozilli.png"
                  alt="Grupo Osvaldo Zilli"
                  className="img-fluid"
                  style={{ maxWidth: '200px', height: 'auto' }}
                />
              </div>
              <h4 className="mb-2">
                {step === 1 ? 'Recuperar Senha' : 'Redefinir Senha'}
              </h4>
              {step === 1 && (
                <p className="text-muted mb-0">
                  Digite seu email para receber o código
                </p>
              )}
            </div>

            {message && step === 1 && (
              <div className="alert alert-success" role="alert">
                {message}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestCode}>
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
                      className={`form-control ${error && step === 1 ? 'is-invalid shake' : ''}`}
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  {error && step === 1 && (
                    <div className="invalid-feedback d-block">
                      {error}
                    </div>
                  )}
                </div>

                <div className="d-grid mb-3">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <>
                        <i className="bi bi-envelope me-2"></i>Enviar Código
                      </>
                    )}
                  </button>
                </div>

                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/login')}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-left me-2"></i>Voltar para Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label fw-medium">
                    Código de Recuperação
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-shield-lock"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control text-center"
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength="6"
                      required
                      disabled={loading}
                      style={{ letterSpacing: '0.5rem', fontSize: '1.2rem', fontWeight: '600' }}
                    />
                  </div>
                  <small className="text-muted">Digite o código de 6 dígitos enviado para seu email</small>
                </div>

                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label fw-medium">
                    Nova Senha
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label fw-medium">
                    Confirmar Senha
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock-fill"></i>
                    </span>
                    <input
                      type="password"
                      className={`form-control ${error && step === 2 ? 'is-invalid shake' : ''}`}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Digite a senha novamente"
                      required
                      disabled={loading}
                    />
                  </div>
                  {error && step === 2 && (
                    <div className="invalid-feedback d-block">
                      {error}
                    </div>
                  )}
                </div>

                <div className="d-grid mb-3">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>Redefinir Senha
                      </>
                    )}
                  </button>
                </div>

                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setTransitionDirection('backward')
                      setTransitioning(true)
                      setTimeout(() => {
                        setStep(1)
                        setCode('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setError('')
                        setMessage('')
                        setTransitioning(false)
                      }, 400)
                    }}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>Solicitar Novo Código
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

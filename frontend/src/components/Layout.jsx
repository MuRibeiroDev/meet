import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import './Layout.css'

const Layout = () => {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            📅 Agendamento de Reuniões
          </Link>
          
          <div className="navbar-menu">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Dashboard
            </Link>
            <Link to="/agendamentos" className={`nav-link ${isActive('/agendamentos')}`}>
              Agendamentos
            </Link>
            <Link to="/novo-agendamento" className={`nav-link ${isActive('/novo-agendamento')}`}>
              Novo Agendamento
            </Link>
          </div>

          <div className="navbar-user">
            <span className="user-name">👤 {usuario?.nome}</span>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

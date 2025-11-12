import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuthStore } from './store/authStore'

// Lazy loading para páginas que não são imediatamente necessárias
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Calendar = lazy(() => import('./pages/Calendar'))
const SalaDisplay = lazy(() => import('./pages/SalaDisplay'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f5f5f5'
  }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Carregando...</span>
    </div>
  </div>
)

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  
  if (!token) {
    console.log('🚫 ProtectedRoute: Sem token, redirecionando para login')
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Componente de rota pública (redireciona se já autenticado)
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore()
  
  if (token) {
    console.log('✅ PublicRoute: Token existe, redirecionando para home')
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/sala" element={<SalaDisplay />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './SalaDisplay.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SalaDisplay = () => {
  const [reuniao, setReuniao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    carregarReuniao()
    const intervalReuniao = setInterval(carregarReuniao, 5000) // Atualizar a cada 5 segundos
    const intervalRelogio = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Atualizar quando a janela ganhar foco
    const handleFocus = () => {
      carregarReuniao()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(intervalReuniao)
      clearInterval(intervalRelogio)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const carregarReuniao = async () => {
    try {
      const response = await axios.get(`${API_URL}/sala/agendamentos`)
      setReuniao(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar reunião:', error)
      setLoading(false)
    }
  }

  const formatarDataHora = () => {
    const opcoes = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
    return currentTime.toLocaleDateString('pt-BR', opcoes)
  }

  const abrirReuniaoOuDetalhes = () => {
    if (reuniao?.link_reuniao) {
      window.open(reuniao.link_reuniao, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="sala-container">
        <div className="sala-header">
          <h1><i className="bi bi-people-fill"></i> Sala da Esquerda</h1>
          <div className="sala-time">{formatarDataHora()}</div>
        </div>
        <div className="sala-content">
          <div className="sala-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3">Carregando reuniões...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sala-container">
      <div className="sala-header">
        <h1><i className="bi bi-people-fill"></i> Sala da Esquerda</h1>
        <div className="sala-time">{formatarDataHora()}</div>
      </div>

      <div className="sala-content">
        {!reuniao ? (
          <div className="sala-livre">
            <i className="bi bi-calendar-check" style={{ fontSize: '5rem', color: '#28a745' }}></i>
            <h3>Sala Livre</h3>
            <p>Nenhuma reunião agendada no momento</p>
          </div>
        ) : (
          <div 
            className={`sala-reuniao-card ${reuniao.ativo ? 'ativa' : 'proxima'}`}
            onClick={abrirReuniaoOuDetalhes}
            style={{ cursor: reuniao.link_reuniao ? 'pointer' : 'default' }}
          >
            <span className={`sala-status-badge ${reuniao.ativo ? 'ativo' : 'proximo'}`}>
              <i className={`bi ${reuniao.ativo ? 'bi-play-circle-fill' : 'bi-clock-fill'} me-2`}></i>
              {reuniao.ativo ? 'EM ANDAMENTO' : reuniao.eh_amanha ? 'AMANHÃ' : 'PRÓXIMA'}
            </span>

            <div className="sala-data">
              <i className="bi bi-calendar-fill me-2"></i>
              {reuniao.data_completa}
            </div>

            <div className="sala-horario">
              <i className="bi bi-clock-fill me-2"></i>
              {reuniao.data_inicio} - {reuniao.data_fim}
            </div>

            <div className="sala-titulo">
              <strong>{reuniao.titulo}</strong>
            </div>

            <div className="sala-responsavel">
              <i className="bi bi-person-fill me-2"></i>
              {reuniao.responsavel}
            </div>

            <div className="sala-info">
              <i className="bi bi-door-open-fill me-2"></i>
              {reuniao.sala}
            </div>

            {reuniao.link_reuniao ? (
              <div className="mt-4 sala-link-info">
                <i className="bi bi-camera-video-fill me-2"></i>
                <span>Clique para entrar na reunião</span>
              </div>
            ) : (
              <div className="mt-4 sala-sem-link">
                <i className="bi bi-info-circle-fill me-2"></i>
                <span>Sem link de reunião</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SalaDisplay

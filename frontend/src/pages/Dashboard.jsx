import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-toastify'
import { agendamentosService, salasService } from '../services'
import './Dashboard.css'

const Dashboard = () => {
  const [agendamentos, setAgendamentos] = useState([])
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataAtual, setDataAtual] = useState(new Date())

  useEffect(() => {
    loadData()
  }, [dataAtual])

  const loadData = async () => {
    try {
      setLoading(true)
      const [agendamentosData, salasData] = await Promise.all([
        agendamentosService.getAll({
          data_inicio: startOfWeek(dataAtual).toISOString(),
          data_fim: endOfWeek(dataAtual).toISOString()
        }),
        salasService.getAll()
      ])
      setAgendamentos(agendamentosData)
      setSalas(salasData)
    } catch (error) {
      toast.error('Erro ao carregar dados')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getAgendamentosHoje = () => {
    return agendamentos.filter(ag =>
      isSameDay(new Date(ag.data_inicio), new Date()) && ag.status === 'confirmado'
    )
  }

  const getProximosAgendamentos = () => {
    const hoje = new Date()
    return agendamentos
      .filter(ag => new Date(ag.data_inicio) > hoje && ag.status === 'confirmado')
      .slice(0, 5)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    )
  }

  const agendamentosHoje = getAgendamentosHoje()
  const proximosAgendamentos = getProximosAgendamentos()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="subtitle">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{agendamentosHoje.length}</h3>
            <p>Reuniões Hoje</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{salas.length}</h3>
            <p>Salas Disponíveis</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{agendamentos.filter(a => a.status === 'confirmado').length}</h3>
            <p>Total Agendamentos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>{proximosAgendamentos.length}</h3>
            <p>Próximas Reuniões</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="card">
          <h2>Reuniões de Hoje</h2>
          {agendamentosHoje.length === 0 ? (
            <p className="empty-message">Nenhuma reunião agendada para hoje</p>
          ) : (
            <div className="agendamentos-list">
              {agendamentosHoje.map(ag => (
                <div key={ag.id} className="agendamento-item">
                  <div className="agendamento-time">
                    {format(new Date(ag.data_inicio), 'HH:mm')} - 
                    {format(new Date(ag.data_fim), 'HH:mm')}
                  </div>
                  <div className="agendamento-info">
                    <h4>{ag.titulo}</h4>
                    <p>📍 {ag.sala.nome}</p>
                    <p>👤 {ag.usuario.nome}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Próximas Reuniões</h2>
          {proximosAgendamentos.length === 0 ? (
            <p className="empty-message">Nenhuma reunião futura agendada</p>
          ) : (
            <div className="agendamentos-list">
              {proximosAgendamentos.map(ag => (
                <div key={ag.id} className="agendamento-item">
                  <div className="agendamento-date">
                    {format(new Date(ag.data_inicio), "dd 'de' MMM", { locale: ptBR })}
                  </div>
                  <div className="agendamento-info">
                    <h4>{ag.titulo}</h4>
                    <p>
                      🕐 {format(new Date(ag.data_inicio), 'HH:mm')} - 
                      {format(new Date(ag.data_fim), 'HH:mm')}
                    </p>
                    <p>📍 {ag.sala.nome}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Salas Disponíveis</h2>
        <div className="salas-grid">
          {salas.map(sala => (
            <div key={sala.id} className="sala-card">
              <div className="sala-icon">🏢</div>
              <h3>{sala.nome}</h3>
              <p>Capacidade: {sala.capacidade} pessoas</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

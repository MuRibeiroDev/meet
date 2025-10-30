import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-toastify'
import { agendamentosService } from '../services'
import './Agendamentos.css'

const Agendamentos = () => {
  const [agendamentos, setAgendamentos] = useState([])
  const [novosAgendamentos, setNovosAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos') // todos, confirmado, cancelado

  useEffect(() => {
    loadAgendamentos()
  }, [filtro])

  // Polling para atualização em tempo real (a cada 15 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAgendamentos(true) // silent mode
    }, 15000) // 15 segundos

    return () => clearInterval(interval)
  }, [filtro, agendamentos])

  const loadAgendamentos = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const params = filtro !== 'todos' ? { status: filtro } : {}
      const data = await agendamentosService.getAll(params)
      
      // Detectar novos agendamentos
      if (agendamentos.length > 0) {
        const novosIds = data.filter(ag => !agendamentos.find(old => old.id === ag.id)).map(ag => ag.id)
        if (novosIds.length > 0) {
          setNovosAgendamentos(novosIds)
          setTimeout(() => setNovosAgendamentos([]), 1000)
        }
      }
      
      setAgendamentos(data)
    } catch (error) {
      toast.error('Erro ao carregar agendamentos')
      console.error(error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handleCancelar = async (id) => {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) {
      return
    }

    try {
      await agendamentosService.delete(id)
      toast.success('Agendamento cancelado com sucesso!')
      loadAgendamentos()
    } catch (error) {
      toast.error('Erro ao cancelar agendamento')
      console.error(error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado':
        return 'status-confirmado'
      case 'cancelado':
        return 'status-cancelado'
      case 'concluido':
        return 'status-concluido'
      default:
        return ''
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmado':
        return 'Confirmado'
      case 'cancelado':
        return 'Cancelado'
      case 'concluido':
        return 'Concluído'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando agendamentos...</p>
      </div>
    )
  }

  return (
    <div className="agendamentos-page">
      <div className="page-header">
        <h1>
          Meus Agendamentos
          <span className="live-indicator ms-2" title="Atualização automática">
            <i className="bi bi-circle-fill text-success" style={{ fontSize: '0.5rem' }}></i>
          </span>
        </h1>
        <div className="filtros">
          <button
            className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
          <button
            className={`filtro-btn ${filtro === 'confirmado' ? 'active' : ''}`}
            onClick={() => setFiltro('confirmado')}
          >
            Confirmados
          </button>
          <button
            className={`filtro-btn ${filtro === 'cancelado' ? 'active' : ''}`}
            onClick={() => setFiltro('cancelado')}
          >
            Cancelados
          </button>
        </div>
      </div>

      {agendamentos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h2>Nenhum agendamento encontrado</h2>
          <p>
            {filtro === 'todos'
              ? 'Você ainda não tem agendamentos'
              : `Não há agendamentos ${filtro === 'confirmado' ? 'confirmados' : 'cancelados'}`}
          </p>
        </div>
      ) : (
        <div className="agendamentos-grid">
          {agendamentos.map(agendamento => (
            <div key={agendamento.id} className={`agendamento-card ${novosAgendamentos.includes(agendamento.id) ? 'novo-agendamento' : ''}`}>
              <div className="card-header">
                <h3>{agendamento.titulo}</h3>
                <span className={`status-badge ${getStatusColor(agendamento.status)}`}>
                  {getStatusLabel(agendamento.status)}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="icon">📍</span>
                  <span>{agendamento.sala.nome}</span>
                </div>

                <div className="info-row">
                  <span className="icon">📅</span>
                  <span>
                    {format(new Date(agendamento.data_inicio), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR
                    })}
                  </span>
                </div>

                <div className="info-row">
                  <span className="icon">🕐</span>
                  <span>
                    {format(new Date(agendamento.data_inicio), 'HH:mm')} -{' '}
                    {format(new Date(agendamento.data_fim), 'HH:mm')}
                  </span>
                </div>

                <div className="info-row">
                  <span className="icon">👤</span>
                  <span>{agendamento.usuario.nome}</span>
                </div>

                {agendamento.participantes && (
                  <div className="info-row">
                    <span className="icon">👥</span>
                    <span>{agendamento.participantes} participante(s)</span>
                  </div>
                )}

                {agendamento.descricao && (
                  <div className="descricao">
                    <strong>Descrição:</strong>
                    <p>{agendamento.descricao}</p>
                  </div>
                )}

                {agendamento.link_reuniao && (
                  <div className="info-row">
                    <span className="icon">🔗</span>
                    <a
                      href={agendamento.link_reuniao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      Link da reunião
                    </a>
                  </div>
                )}
              </div>

              {agendamento.status === 'confirmado' && (
                <div className="card-footer">
                  <button
                    className="btn-cancelar"
                    onClick={() => handleCancelar(agendamento.id)}
                  >
                    Cancelar Agendamento
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Agendamentos

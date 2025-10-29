import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { agendamentosService, salasService } from '../services'
import { toast } from 'react-toastify'
import './Calendar.css'

const meses = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

const diasSemana = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'
]

const Calendar = () => {
  const [dataAtual, setDataAtual] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState([])
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [agendamentoAtual, setAgendamentoAtual] = useState(null)
  const [navegando, setNavegando] = useState(false)
  const [closingModal, setClosingModal] = useState(false)
  const [closingDetalhes, setClosingDetalhes] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const { usuario } = useAuthStore()

  const [formData, setFormData] = useState({
    sala_id: '',
    data: '',
    hora_inicio: '',
    hora_fim: '',
    link_reuniao: '',
    participantes: 1,
    suporte_ti: 'nao'
  })

  useEffect(() => {
    loadSalas()
  }, [])

  useEffect(() => {
    loadAgendamentos()
    atualizarDataForm()
  }, [dataAtual])

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification.show])

  const mostrarNotificacao = (message, type = 'success') => {
    setNotification({ show: true, message, type })
  }

  const loadSalas = async () => {
    try {
      const data = await salasService.getAll()
      setSalas(data)
    } catch (error) {
      console.error('Erro ao carregar salas:', error)
    }
  }

  const loadAgendamentos = async () => {
    setLoading(true)
    try {
      const dataStr = formatarDataInput(dataAtual)
      console.log('Carregando agendamentos para:', dataStr)
      const data = await agendamentosService.getAll({ data_inicio: dataStr, data_fim: dataStr })
      console.log('Agendamentos recebidos:', data)
      setAgendamentos(data)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const navegarDia = (direcao) => {
    if (navegando) return
    
    setNavegando(true)
    const novaData = new Date(dataAtual)
    novaData.setDate(novaData.getDate() + direcao)
    setDataAtual(novaData)
    
    setTimeout(() => setNavegando(false), 300)
  }

  const formatarDataInput = (data) => {
    const ano = data.getFullYear()
    const mes = (data.getMonth() + 1).toString().padStart(2, '0')
    const dia = data.getDate().toString().padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  const atualizarDataForm = () => {
    setFormData(prev => ({
      ...prev,
      data: formatarDataInput(dataAtual)
    }))
  }

  const fecharModal = () => {
    setClosingModal(true)
    setTimeout(() => {
      setShowModal(false)
      setClosingModal(false)
    }, 300)
  }

  const fecharDetalhes = () => {
    setClosingDetalhes(true)
    setTimeout(() => {
      setShowDetalhes(false)
      setClosingDetalhes(false)
    }, 300)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const salvarAgendamento = async () => {
    if (!formData.sala_id || !formData.hora_inicio || !formData.hora_fim) {
      return
    }

    const salaObj = salas.find(s => s.id === parseInt(formData.sala_id))
    const salaNome = salaObj ? salaObj.nome : 'Reunião'

    try {
      // Criar datas considerando timezone local e enviar como está
      const dataInicio = new Date(`${formData.data}T${formData.hora_inicio}:00`)
      const dataFim = new Date(`${formData.data}T${formData.hora_fim}:00`)
      
      // Formatar manualmente para manter o horário local
      const formatarDataLocal = (data) => {
        const ano = data.getFullYear()
        const mes = String(data.getMonth() + 1).padStart(2, '0')
        const dia = String(data.getDate()).padStart(2, '0')
        const hora = String(data.getHours()).padStart(2, '0')
        const minuto = String(data.getMinutes()).padStart(2, '0')
        const segundo = String(data.getSeconds()).padStart(2, '0')
        return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`
      }
      
      const payload = {
        titulo: `Reunião - ${salaNome}`,
        sala_id: parseInt(formData.sala_id),
        data_inicio: formatarDataLocal(dataInicio),
        data_fim: formatarDataLocal(dataFim),
        participantes: parseInt(formData.participantes) || 1,
        link_reuniao: formData.link_reuniao || null,
        descricao: '',
        observacoes: formData.suporte_ti === 'sim' ? 'Suporte TI solicitado' : null
      }

      console.log('Salvando agendamento:', payload)
      const resultado = await agendamentosService.create(payload)
      console.log('Agendamento salvo:', resultado)
      mostrarNotificacao('Reunião agendada com sucesso')
      fecharModal()
      setFormData({
        sala_id: '',
        data: formatarDataInput(dataAtual),
        hora_inicio: '',
        hora_fim: '',
        link_reuniao: '',
        participantes: 1,
        suporte_ti: 'nao'
      })
      loadAgendamentos()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      mostrarNotificacao('Erro ao agendar reunião', 'error')
    }
  }

  const mostrarDetalhesAgendamento = async (id) => {
    // Abrir modal imediatamente com loading
    setShowDetalhes(true)
    setAgendamentoAtual(null)
    
    try {
      const data = await agendamentosService.getById(id)
      setAgendamentoAtual(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      fecharDetalhes()
      mostrarNotificacao('Erro ao carregar detalhes')
    }
  }

  const cancelarAgendamento = async () => {
    if (!agendamentoAtual) return
    
    if (!window.confirm('Tem certeza que deseja cancelar esta reunião?')) return

    try {
      console.log('Cancelando agendamento ID:', agendamentoAtual.id)
      await agendamentosService.delete(agendamentoAtual.id)
      mostrarNotificacao('Reunião cancelada')
      fecharDetalhes()
      setAgendamentoAtual(null)
      loadAgendamentos()
    } catch (error) {
      console.error('Erro ao cancelar:', error)
      mostrarNotificacao('Erro ao cancelar reunião', 'error')
    }
  }

  const formatarHora = (dataHora) => {
    return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const isDataAnterior = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataComparacao = new Date(dataAtual)
    dataComparacao.setHours(0, 0, 0, 0)
    return dataComparacao < hoje
  }

  const podeInteragir = () => {
    return !isDataAnterior()
  }

  const podeCancel = () => {
    if (!agendamentoAtual) return false
    const agora = new Date()
    const dataInicio = new Date(agendamentoAtual.data_inicio)
    return dataInicio > agora && agendamentoAtual.usuario_id === usuario?.id
  }

  const dia = dataAtual.getDate().toString().padStart(2, '0')
  const diaSemana = diasSemana[dataAtual.getDay()]
  const mes = meses[dataAtual.getMonth()]
  const ano = dataAtual.getFullYear()

  return (
    <>
      {/* Notificação */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <i className={`bi ${notification.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
          {notification.message}
        </div>
      )}

      <nav className="navbar">
        <div className="container-fluid">
          <span className="navbar-brand mx-auto">
            <i className="bi bi-calendar-event me-2"></i>
            Agendamento de Sala de Reunião
          </span>
        </div>
      </nav>

      <div className="main-container">
        <div className="calendar-container">
          <div className="calendar-header">
            <button
              className="calendar-nav prev"
              onClick={() => navegarDia(-1)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <div>
              <div className="current-date">{dia}</div>
              <div className="current-day">
                {diaSemana}, {mes} de {ano}
              </div>
            </div>

            <button className="calendar-nav next" onClick={() => navegarDia(1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="appointments-container">
            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
                <p className="mt-2">Carregando agendamentos...</p>
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="no-appointments">
                <i className="bi bi-calendar-x"></i>
                <h5>Nenhuma reunião agendada</h5>
                <p>Este dia está livre para agendamentos</p>
                {podeInteragir() && (
                  <button
                    className="btn btn-primary btn-agendar"
                    onClick={() => setShowModal(true)}
                  >
                    Agendar Reunião
                  </button>
                )}
              </div>
            ) : (
              <>
                {agendamentos.map((ag) => (
                  <div
                    key={ag.id}
                    className="appointment-card"
                    onClick={() => mostrarDetalhesAgendamento(ag.id)}
                  >
                    <div className="appointment-time">
                      {formatarHora(ag.data_inicio)} - {formatarHora(ag.data_fim)}
                    </div>
                    <div className="appointment-title">{ag.titulo}</div>
                    <div className="appointment-details">
                      <i className="bi bi-building me-1"></i>
                      {ag.sala.nome}
                      <span className="mx-2">•</span>
                      <i className="bi bi-people me-1"></i>
                      {ag.participantes} pessoas
                      <span className="mx-2">•</span>
                      <i className="bi bi-person me-1"></i>
                      {ag.usuario.nome}
                    </div>
                  </div>
                ))}
                {podeInteragir() && (
                  <div className="text-center mt-3 mb-2">
                    <button
                      className="btn btn-primary btn-agendar"
                      onClick={() => setShowModal(true)}
                    >
                      Agendar Reunião
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      {showModal && (
        <>
          <div className={`modal fade show ${closingModal ? 'closing' : ''}`} style={{ display: 'block' }}>
            <div className="modal-dialog modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-plus-circle me-2"></i>
                    Novo Agendamento
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharModal}
                    aria-label="Fechar"
                  ></button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Sala</label>
                      <select
                        className="form-select"
                        name="sala_id"
                        value={formData.sala_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecione uma sala</option>
                        {salas.map((sala) => (
                          <option key={sala.id} value={sala.id}>
                            {sala.nome} ({sala.capacidade} pessoas)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Data</label>
                      <input
                        type="date"
                        className="form-control"
                        name="data"
                        value={formData.data}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">Hora Início</label>
                          <input
                            type="time"
                            className="form-control"
                            name="hora_inicio"
                            value={formData.hora_inicio}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">Hora Fim</label>
                          <input
                            type="time"
                            className="form-control"
                            name="hora_fim"
                            value={formData.hora_fim}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Link da Reunião (opcional)</label>
                      <input
                        type="url"
                        className="form-control"
                        name="link_reuniao"
                        value={formData.link_reuniao}
                        onChange={handleChange}
                        placeholder="https://meet.google.com/..."
                      />
                      <small className="form-text">Link do Google Meet, Zoom, Teams, etc.</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Quantidade de Pessoas (opcional)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="participantes"
                        value={formData.participantes}
                        onChange={handleChange}
                        min="1"
                        placeholder="Quantas pessoas?"
                      />
                      <small className="form-text">Deixe em branco se não souber</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Suporte Técnico</label>
                      <div className="suporte-options">
                        <label className="suporte-option">
                          <input
                            type="radio"
                            name="suporte_ti"
                            value="nao"
                            checked={formData.suporte_ti === 'nao'}
                            onChange={handleChange}
                          />
                          <span>
                            <i className="bi bi-x-circle me-1"></i>
                            Não preciso de suporte do TI
                          </span>
                        </label>
                        <label className="suporte-option">
                          <input
                            type="radio"
                            name="suporte_ti"
                            value="sim"
                            checked={formData.suporte_ti === 'sim'}
                            onChange={handleChange}
                          />
                          <span>
                            <i className="bi bi-tools me-1"></i>
                            Preciso de suporte do TI na reunião
                          </span>
                        </label>
                      </div>
                      <small className="form-text">
                        Se precisar de suporte para configurar a reunião na televisão ou equipamentos audiovisuais
                      </small>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={salvarAgendamento}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Agendar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={`modal-backdrop fade show ${closingModal ? 'closing' : ''}`}></div>
        </>
      )}

      {/* Modal Detalhes */}
      {showDetalhes && (
        <>
          <div className={`modal fade show ${closingDetalhes ? 'closing' : ''}`} style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-calendar-event me-2"></i>
                    Detalhes da Reunião
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={fecharDetalhes}
                    aria-label="Fechar"
                  ></button>
                </div>
                <div className="modal-body">
                  {!agendamentoAtual ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                      </div>
                      <p className="mt-3 text-muted">Carregando detalhes...</p>
                    </div>
                  ) : (
                  <div className="row">
                    <div className="col-12 mb-3">
                      <h6 className="text-primary">{agendamentoAtual.titulo}</h6>
                    </div>

                    <div className="col-md-6 mb-2">
                      <strong>Data/Hora:</strong>
                      <br />
                      <small>
                        {new Date(agendamentoAtual.data_inicio).toLocaleString('pt-BR')} -{' '}
                        {formatarHora(agendamentoAtual.data_fim)}
                      </small>
                    </div>

                    <div className="col-md-6 mb-2">
                      <strong>Sala:</strong>
                      <br />
                      <small>{agendamentoAtual.sala.nome}</small>
                    </div>

                    <div className="col-md-6 mb-2">
                      <strong>Responsável:</strong>
                      <br />
                      <small>{agendamentoAtual.usuario.nome}</small>
                    </div>

                    <div className="col-md-6 mb-2">
                      <strong>Participantes:</strong>
                      <br />
                      <small>{agendamentoAtual.participantes || 'Não informado'} pessoas</small>
                    </div>

                    {agendamentoAtual.link_reuniao && (
                      <div className="col-12 mb-2">
                        <strong>Link da Reunião:</strong>
                        <br />
                        <small>
                          <a
                            href={agendamentoAtual.link_reuniao}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                          >
                            {agendamentoAtual.link_reuniao}
                          </a>
                        </small>
                      </div>
                    )}
                  </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={fecharDetalhes}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Fechar
                  </button>
                  {agendamentoAtual && podeCancel() && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={cancelarAgendamento}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={`modal-backdrop fade show ${closingDetalhes ? 'closing' : ''}`}></div>
        </>
      )}
    </>
  )
}

export default Calendar

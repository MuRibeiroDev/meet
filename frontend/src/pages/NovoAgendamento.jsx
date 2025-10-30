import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { agendamentosService, salasService } from '../services'
import './NovoAgendamento.css'

const NovoAgendamento = () => {
  const navigate = useNavigate()
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sala_id: '',
    titulo: '',
    descricao: '',
    data: '',
    hora_inicio: '',
    hora_fim: '',
    participantes: 1,
    link_reuniao: '',
    observacoes: ''
  })

  useEffect(() => {
    loadSalas()
  }, [])

  const loadSalas = async () => {
    try {
      const data = await salasService.getAll()
      setSalas(data)
    } catch (error) {
      toast.error('Erro ao carregar salas')
      console.error(error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.sala_id) {
      toast.error('Selecione uma sala')
      return
    }

    if (!formData.data || !formData.hora_inicio || !formData.hora_fim) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Validar horários
    if (formData.hora_inicio >= formData.hora_fim) {
      toast.error('O horário de término deve ser maior que o de início')
      return
    }

    setLoading(true)

    try {
      // Construir datas no formato local (sem conversão para UTC)
      const data_inicio = `${formData.data}T${formData.hora_inicio}:00`
      const data_fim = `${formData.data}T${formData.hora_fim}:00`

      const agendamentoData = {
        sala_id: parseInt(formData.sala_id),
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_inicio: data_inicio,
        data_fim: data_fim,
        participantes: parseInt(formData.participantes) || 1,
        link_reuniao: formData.link_reuniao || null,
        observacoes: formData.observacoes || null
      }

      await agendamentosService.create(agendamentoData)
      toast.success('Agendamento criado com sucesso!')
      navigate('/agendamentos')
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao criar agendamento'
      toast.error(message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Obter data mínima (hoje)
  const getDataMinima = () => {
    const hoje = new Date()
    return hoje.toISOString().split('T')[0]
  }

  return (
    <div className="novo-agendamento-page">
      <div className="page-header">
        <h1>Novo Agendamento</h1>
        <button
          type="button"
          className="btn-voltar"
          onClick={() => navigate('/agendamentos')}
        >
          ← Voltar
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="agendamento-form">
          <div className="form-section">
            <h3>Informações Básicas</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="titulo">
                  Título da Reunião <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Reunião de planejamento"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sala_id">
                  Sala <span className="required">*</span>
                </label>
                <select
                  id="sala_id"
                  name="sala_id"
                  value={formData.sala_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione uma sala</option>
                  {salas.map(sala => (
                    <option key={sala.id} value={sala.id}>
                      {sala.nome} (Capacidade: {sala.capacidade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="3"
                placeholder="Descreva o objetivo da reunião..."
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Data e Horário</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data">
                  Data <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="data"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  min={getDataMinima()}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hora_inicio">
                  Hora de Início <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="hora_inicio"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hora_fim">
                  Hora de Término <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="hora_fim"
                  name="hora_fim"
                  value={formData.hora_fim}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Informações Adicionais</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="participantes">Número de Participantes</label>
                <input
                  type="number"
                  id="participantes"
                  name="participantes"
                  value={formData.participantes}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="link_reuniao">Link da Reunião Online</label>
                <input
                  type="url"
                  id="link_reuniao"
                  name="link_reuniao"
                  value={formData.link_reuniao}
                  onChange={handleChange}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="3"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/agendamentos')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NovoAgendamento

import express from 'express';
import { Op } from 'sequelize';
import Agendamento from '../models/Agendamento.js';
import Sala from '../models/Sala.js';
import Usuario from '../models/Usuario.js';
import { authMiddleware } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { criarChamadoTI } from '../services/chamados.service.js';
import { emailService } from '../services/email.service.js';

const router = express.Router();

// Validações
const validacaoAgendamento = [
  body('sala_id').isInt().withMessage('ID da sala é obrigatório'),
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  body('data_inicio').isISO8601().withMessage('Data de início inválida'),
  body('data_fim').isISO8601().withMessage('Data de fim inválida'),
  body('participantes').optional().isInt({ min: 1 }).withMessage('Número de participantes inválido')
];

// Função para verificar conflito de horário
const verificarConflito = async (sala_id, data_inicio, data_fim, excluir_id = null) => {
  const where = {
    sala_id,
    status: 'confirmado',
    [Op.or]: [
      {
        data_inicio: { [Op.lte]: data_inicio },
        data_fim: { [Op.gt]: data_inicio }
      },
      {
        data_inicio: { [Op.lt]: data_fim },
        data_fim: { [Op.gte]: data_fim }
      },
      {
        data_inicio: { [Op.gte]: data_inicio },
        data_fim: { [Op.lte]: data_fim }
      }
    ]
  };

  if (excluir_id) {
    where.id = { [Op.ne]: excluir_id };
  }

  const conflito = await Agendamento.findOne({ where });
  return conflito !== null;
};

// GET /api/agendamentos - Listar agendamentos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { sala_id, data_inicio, data_fim, status, usuario_id } = req.query;
    
    const where = {};
    
    if (sala_id) where.sala_id = sala_id;
    if (status) where.status = status;
    if (usuario_id) where.usuario_id = usuario_id;
    
    if (data_inicio && data_fim) {
      // Buscar agendamentos que acontecem no dia especificado
      // Criar datas em UTC sem conversão de timezone
      const inicioData = new Date(data_inicio + 'T00:00:00.000Z');
      const fimData = new Date(data_fim + 'T23:59:59.999Z');
      
      where.data_inicio = {
        [Op.gte]: inicioData,
        [Op.lte]: fimData
      };
    }
    
    const agendamentos = await Agendamento.findAll({
      where,
      include: [
        { model: Sala, as: 'sala', attributes: ['id', 'nome', 'capacidade'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['data_inicio', 'ASC']]
    });
    
    console.log('Query params:', { sala_id, data_inicio, data_fim, status, usuario_id });
    console.log('Where clause:', where);
    console.log('Agendamentos encontrados:', agendamentos.length);
    
    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos' });
  }
});

// GET /api/agendamentos/:id - Buscar agendamento por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, {
      include: [
        { model: Sala, as: 'sala' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });
    
    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    
    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({ message: 'Erro ao buscar agendamento' });
  }
});

// POST /api/agendamentos - Criar novo agendamento
router.post('/', authMiddleware, validacaoAgendamento, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      sala_id,
      titulo,
      descricao,
      data_inicio,
      data_fim,
      participantes,
      link_reuniao,
      observacoes
    } = req.body;

    console.log('Data recebida no backend:', { data_inicio, data_fim });

    // Validar datas
    const inicio = new Date(data_inicio);
    const fim = new Date(data_fim);
    
    console.log('Data convertida no backend:', { inicio, fim });
    
    if (fim <= inicio) {
      return res.status(400).json({ message: 'Data de fim deve ser maior que data de início' });
    }

    // Verificar se sala existe
    const sala = await Sala.findByPk(sala_id);
    if (!sala || !sala.ativa) {
      return res.status(404).json({ message: 'Sala não encontrada ou inativa' });
    }

    // Verificar conflitos
    const temConflito = await verificarConflito(sala_id, inicio, fim);
    if (temConflito) {
      return res.status(409).json({ message: 'Já existe um agendamento para este horário' });
    }

    // Criar agendamento
    const agendamento = await Agendamento.create({
      sala_id,
      usuario_id: req.usuario.id,
      titulo,
      descricao,
      data_inicio: inicio,
      data_fim: fim,
      participantes: participantes || 1,
      link_reuniao,
      observacoes,
      status: 'confirmado'
    });

    console.log('Agendamento criado:', agendamento.data_inicio, agendamento.data_fim);

    // Criar chamado TI se solicitado (não bloquear se falhar)
    if (observacoes && observacoes.includes('Suporte TI solicitado')) {
      try {
        const ticketId = await criarChamadoTI(agendamento, req.usuario, sala);
        if (ticketId) {
          console.log('Chamado TI criado com sucesso. Ticket ID:', ticketId);
        }
      } catch (error) {
        console.error('Erro ao criar chamado TI (não crítico):', error);
        // Não bloqueia a criação do agendamento se falhar
      }
    }

    // Buscar agendamento com relacionamentos
    const agendamentoCriado = await Agendamento.findByPk(agendamento.id, {
      include: [
        { model: Sala, as: 'sala' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });

    // Enviar notificação por email (não bloquear se falhar)
    if (emailService.isConfigured()) {
      try {
        const meetingData = {
          titulo: agendamentoCriado.titulo,
          data_inicio: agendamentoCriado.data_inicio,
          data_fim: agendamentoCriado.data_fim,
          sala_nome: agendamentoCriado.sala.nome,
          responsavel: agendamentoCriado.usuario.nome,
          participantes: agendamentoCriado.participantes,
          link_reuniao: agendamentoCriado.link_reuniao,
          descricao: agendamentoCriado.descricao
        };

        // Enviar para lista de notificação configurada
        await emailService.notifyMultipleUsers(meetingData, 'new');
      } catch (error) {
        console.error('Erro ao enviar notificação por email (não crítico):', error);
        // Não bloqueia a criação do agendamento se falhar
      }
    }

    res.status(201).json(agendamentoCriado);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro ao criar agendamento' });
  }
});

// PUT /api/agendamentos/:id - Atualizar agendamento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    
    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    const {
      titulo,
      descricao,
      data_inicio,
      data_fim,
      participantes,
      link_reuniao,
      observacoes,
      status
    } = req.body;

    // Se mudou horário, verificar conflitos
    if (data_inicio || data_fim) {
      const inicio = data_inicio ? new Date(data_inicio) : agendamento.data_inicio;
      const fim = data_fim ? new Date(data_fim) : agendamento.data_fim;
      
      if (fim <= inicio) {
        return res.status(400).json({ message: 'Data de fim deve ser maior que data de início' });
      }

      const temConflito = await verificarConflito(agendamento.sala_id, inicio, fim, agendamento.id);
      if (temConflito) {
        return res.status(409).json({ message: 'Já existe um agendamento para este horário' });
      }
    }

    // Atualizar
    await agendamento.update({
      ...(titulo && { titulo }),
      ...(descricao !== undefined && { descricao }),
      ...(data_inicio && { data_inicio: new Date(data_inicio) }),
      ...(data_fim && { data_fim: new Date(data_fim) }),
      ...(participantes && { participantes }),
      ...(link_reuniao !== undefined && { link_reuniao }),
      ...(observacoes !== undefined && { observacoes }),
      ...(status && { status })
    });

    // Buscar agendamento atualizado
    const agendamentoAtualizado = await Agendamento.findByPk(agendamento.id, {
      include: [
        { model: Sala, as: 'sala' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });

    res.json(agendamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar agendamento' });
  }
});

// DELETE /api/agendamentos/:id - Cancelar agendamento
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, {
      include: [
        { model: Sala, as: 'sala' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });
    
    if (!agendamento) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    // Verificar se o usuário é o dono do agendamento
    if (agendamento.usuario_id !== req.usuario.id) {
      return res.status(403).json({ message: 'Você não tem permissão para cancelar este agendamento' });
    }

    // Verificar se a reunião ainda não começou
    const agora = new Date();
    const dataInicio = new Date(agendamento.data_inicio);
    if (dataInicio <= agora) {
      return res.status(400).json({ message: 'Não é possível cancelar uma reunião que já começou' });
    }

    // Preparar dados para email antes de deletar
    const meetingData = {
      titulo: agendamento.titulo,
      data_inicio: agendamento.data_inicio,
      data_fim: agendamento.data_fim,
      sala_nome: agendamento.sala.nome,
      responsavel: agendamento.usuario.nome,
      participantes: agendamento.participantes,
      link_reuniao: agendamento.link_reuniao
    };

    console.log('Deletando agendamento ID:', req.params.id);
    await agendamento.destroy();

    // Enviar notificação de cancelamento por email (não bloquear se falhar)
    if (emailService.isConfigured()) {
      try {
        await emailService.notifyMultipleUsers(meetingData, 'cancel');
      } catch (error) {
        console.error('Erro ao enviar notificação de cancelamento (não crítico):', error);
      }
    }
    
    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ message: 'Erro ao cancelar agendamento' });
  }
});

// GET /api/agendamentos/disponibilidade/:sala_id - Verificar disponibilidade
router.get('/disponibilidade/:sala_id', authMiddleware, async (req, res) => {
  try {
    const { sala_id } = req.params;
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    const dataConsulta = new Date(data);
    const inicioDia = new Date(dataConsulta.setHours(0, 0, 0, 0));
    const fimDia = new Date(dataConsulta.setHours(23, 59, 59, 999));

    const agendamentos = await Agendamento.findAll({
      where: {
        sala_id,
        status: 'confirmado',
        data_inicio: {
          [Op.gte]: inicioDia,
          [Op.lte]: fimDia
        }
      },
      order: [['data_inicio', 'ASC']]
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ message: 'Erro ao verificar disponibilidade' });
  }
});

export default router;

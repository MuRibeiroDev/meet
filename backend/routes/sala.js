import express from 'express';
import { Op } from 'sequelize';
import Agendamento from '../models/Agendamento.js';
import Sala from '../models/Sala.js';
import Usuario from '../models/Usuario.js';

const router = express.Router();

// GET /api/sala/agendamentos - Buscar próxima reunião da Sala da Esquerda
router.get('/agendamentos', async (req, res) => {
  try {
    // Buscar ID da Sala da Esquerda
    const sala = await Sala.findOne({ where: { nome: 'Sala da Esquerda' } });
    
    if (!sala) {
      return res.json(null);
    }

    const agora = new Date();
    const inicioDia = new Date(agora);
    inicioDia.setHours(0, 0, 0, 0);
    
    const fimAmanha = new Date(agora);
    fimAmanha.setDate(fimAmanha.getDate() + 1);
    fimAmanha.setHours(23, 59, 59, 999);

    // Buscar próxima reunião (ativa ou futura) da Sala da Esquerda
    const agendamento = await Agendamento.findOne({
      where: {
        sala_id: sala.id,
        status: 'confirmado',
        data_fim: { [Op.gte]: agora } // Reunião ainda não terminou
      },
      include: [
        { model: Sala, as: 'sala', attributes: ['id', 'nome'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }
      ],
      order: [['data_inicio', 'ASC']],
      limit: 1
    });

    if (!agendamento) {
      return res.json(null);
    }

    // Formatar dados para exibição
    const dataInicio = new Date(agendamento.data_inicio);
    const dataFim = new Date(agendamento.data_fim);
    
    const formatarHora = (data) => {
      return data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    const formatarDataCompleta = (data) => {
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const diaSemana = diasSemana[data.getDay()];
      const dataFormatada = data.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return `${diaSemana}, ${dataFormatada}`;
    };

    // Verificar se a reunião está ativa
    const ativo = agora >= dataInicio && agora <= dataFim;
    
    // Verificar se é amanhã
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    const amanhaFim = new Date(amanha);
    amanhaFim.setHours(23, 59, 59, 999);
    const eh_amanha = dataInicio >= amanha && dataInicio <= amanhaFim;

    const response = {
      id: agendamento.id,
      titulo: agendamento.titulo,
      data_inicio: formatarHora(dataInicio),
      data_fim: formatarHora(dataFim),
      data_completa: formatarDataCompleta(dataInicio),
      responsavel: agendamento.usuario.nome,
      sala: agendamento.sala.nome,
      participantes: agendamento.participantes,
      link_reuniao: agendamento.link_reuniao,
      ativo: ativo,
      eh_amanha: eh_amanha
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar reunião da sala:', error);
    res.status(500).json({ message: 'Erro ao buscar reunião' });
  }
});

export default router;

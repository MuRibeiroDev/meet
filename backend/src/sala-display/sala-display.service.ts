import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Agendamento } from '../entities/agendamento.entity';
import { Sala } from '../entities/sala.entity';

@Injectable()
export class SalaDisplayService {
  constructor(
    @InjectRepository(Agendamento)
    private agendamentosRepository: Repository<Agendamento>,
    @InjectRepository(Sala)
    private salasRepository: Repository<Sala>,
  ) {}

  async getProximaReuniao() {
    try {
      // Buscar ID da Sala da Esquerda
      const sala = await this.salasRepository.findOne({
        where: { nome: 'Sala da Esquerda' },
      });

      if (!sala) {
        return null;
      }

      const agora = new Date();

      // Buscar próxima reunião (ativa ou futura) da Sala da Esquerda
      const agendamento = await this.agendamentosRepository
        .createQueryBuilder('agendamento')
        .leftJoinAndSelect('agendamento.sala', 'sala')
        .leftJoinAndSelect('agendamento.usuario', 'usuario')
        .where('agendamento.sala_id = :sala_id', { sala_id: sala.id })
        .andWhere('agendamento.status = :status', { status: 'confirmado' })
        .andWhere('agendamento.data_fim >= :agora', { agora })
        .orderBy('agendamento.data_inicio', 'ASC')
        .getOne();

      if (!agendamento) {
        return null;
      }

      // Formatar dados para exibição
      const dataInicio = new Date(agendamento.data_inicio);
      const dataFim = new Date(agendamento.data_fim);

      const formatarHora = (data: Date) => {
        return data.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const formatarDataCompleta = (data: Date) => {
        const diasSemana = [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
        ];
        const diaSemana = diasSemana[data.getDay()];
        const dataFormatada = data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
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

      return {
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
        eh_amanha: eh_amanha,
      };
    } catch (error) {
      console.error('Erro ao buscar reunião da sala:', error);
      throw error;
    }
  }
}

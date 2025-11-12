import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Agendamento } from '../entities/agendamento.entity';
import { Sala } from '../entities/sala.entity';
import { Usuario } from '../entities/usuario.entity';
import { CreateAgendamentoDto, UpdateAgendamentoDto } from './dto/agendamento.dto';
import { EmailService } from '../common/services/email.service';
import { ChamadosService } from '../common/services/chamados.service';

@Injectable()
export class AgendamentosService {
  constructor(
    @InjectRepository(Agendamento)
    private agendamentosRepository: Repository<Agendamento>,
    @InjectRepository(Sala)
    private salasRepository: Repository<Sala>,
    private emailService: EmailService,
    private chamadosService: ChamadosService,
  ) {}

  private async verificarConflito(
    sala_id: number,
    data_inicio: string,
    data_fim: string,
    excluir_id?: number,
  ): Promise<boolean> {
    const query = this.agendamentosRepository
      .createQueryBuilder('agendamento')
      .where('agendamento.sala_id = :sala_id', { sala_id })
      .andWhere('agendamento.status = :status', { status: 'confirmado' })
      .andWhere(
        `(
          (agendamento.data_inicio <= :data_inicio AND agendamento.data_fim > :data_inicio) OR
          (agendamento.data_inicio < :data_fim AND agendamento.data_fim >= :data_fim) OR
          (agendamento.data_inicio >= :data_inicio AND agendamento.data_fim <= :data_fim)
        )`,
        { data_inicio, data_fim },
      );

    if (excluir_id) {
      query.andWhere('agendamento.id != :excluir_id', { excluir_id });
    }

    const conflito = await query.getOne();
    return conflito !== null;
  }

  async findAll(filters: any) {
    const { sala_id, data_inicio, data_fim, status, usuario_id } = filters;
    const where: any = {};

    if (sala_id) where.sala_id = parseInt(sala_id);
    if (status) where.status = status;
    if (usuario_id) where.usuario_id = parseInt(usuario_id);

    if (data_inicio && data_fim) {
      // Usar strings direto, sem conversão para Date
      const inicioStr = data_inicio + ' 00:00:00';
      const fimStr = data_fim + ' 23:59:59';
      where.data_inicio = Between(inicioStr, fimStr);
    }

    const agendamentos = await this.agendamentosRepository.find({
      where,
      order: { data_inicio: 'ASC' },
    });

    console.log('Query params:', filters);
    console.log('Where clause:', where);
    console.log('Agendamentos encontrados:', agendamentos.length);

    return agendamentos;
  }

  async findOne(id: number) {
    const agendamento = await this.agendamentosRepository.findOne({
      where: { id },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return agendamento;
  }

  async create(createAgendamentoDto: CreateAgendamentoDto, usuario: Usuario) {
    const {
      sala_id,
      titulo,
      descricao,
      data_inicio,
      data_fim,
      participantes,
      link_reuniao,
      observacoes,
    } = createAgendamentoDto;

    console.log('========================================');
    console.log('📅 Data recebida no backend:');
    console.log('   data_inicio:', data_inicio);
    console.log('   data_fim:', data_fim);
    console.log('   Tipo data_inicio:', typeof data_inicio);
    console.log('   Tipo data_fim:', typeof data_fim);
    console.log('========================================');

    // Não converter para Date - salvar como string diretamente
    // Frontend envia: "2024-11-03T10:00:00" (sem timezone)
    // PostgreSQL armazena como timestamp without time zone
    
    // Validação simples: comparar strings
    if (data_fim <= data_inicio) {
      throw new BadRequestException('Data de fim deve ser maior que data de início');
    }

    // Verificar se sala existe
    const sala = await this.salasRepository.findOne({ where: { id: sala_id } });
    if (!sala || !sala.ativa) {
      throw new NotFoundException('Sala não encontrada ou inativa');
    }

    // Verificar conflitos (passar as strings direto)
    const temConflito = await this.verificarConflito(sala_id, data_inicio, data_fim);
    if (temConflito) {
      throw new ConflictException('Já existe um agendamento para este horário');
    }

    // Criar agendamento (salvar strings direto no banco)
    const agendamento = this.agendamentosRepository.create({
      sala_id,
      usuario_id: usuario.id,
      titulo,
      descricao,
      data_inicio: data_inicio,
      data_fim: data_fim,
      participantes: participantes || 1,
      link_reuniao,
      observacoes,
      status: 'confirmado',
    });

    await this.agendamentosRepository.save(agendamento);

    console.log('========================================');
    console.log('✅ Agendamento SALVO no banco:');
    console.log('   data_inicio:', agendamento.data_inicio);
    console.log('   data_fim:', agendamento.data_fim);
    console.log('========================================');

    // Buscar agendamento com relacionamentos
    const agendamentoCriado = await this.agendamentosRepository.findOne({
      where: { id: agendamento.id },
    });

    // Criar chamado TI se solicitado (não bloquear se falhar)
    if (observacoes && observacoes.includes('Suporte TI solicitado')) {
      try {
        const ticketId = await this.chamadosService.criarChamadoTI(
          agendamentoCriado,
          usuario,
          sala,
        );
        if (ticketId) {
          console.log('Chamado TI criado com sucesso. Ticket ID:', ticketId);
        }
      } catch (error) {
        console.error('Erro ao criar chamado TI (não crítico):', error);
        // Não bloqueia a criação do agendamento se falhar
      }
    }

    // Enviar notificação por email
    try {
      const meetingData = {
        titulo: agendamentoCriado.titulo,
        descricao: agendamentoCriado.descricao,
        data_inicio: agendamentoCriado.data_inicio,
        data_fim: agendamentoCriado.data_fim,
        sala_nome: sala.nome,
        responsavel: usuario.nome,
        participantes: agendamentoCriado.participantes,
        link_reuniao: agendamentoCriado.link_reuniao,
      };
      
      console.log('📧 Enviando email com dados:', {
        data_inicio: meetingData.data_inicio,
        data_fim: meetingData.data_fim,
        tipo_inicio: typeof meetingData.data_inicio,
        tipo_fim: typeof meetingData.data_fim
      });
      
      await this.emailService.notifyMultipleUsers(meetingData, 'new');
    } catch (error) {
      console.error('Erro ao enviar notificações de email:', error);
      // Não bloqueia a criação do agendamento se o email falhar
    }

    return agendamentoCriado;
  }

  async update(id: number, updateAgendamentoDto: UpdateAgendamentoDto, usuario: Usuario) {
    const agendamento = await this.findOne(id);

    const { titulo, descricao, data_inicio, data_fim, participantes, link_reuniao, observacoes, status } =
      updateAgendamentoDto;

    // Se mudou horário, verificar conflitos
    if (data_inicio || data_fim) {
      const inicio = data_inicio ? data_inicio : agendamento.data_inicio;
      const fim = data_fim ? data_fim : agendamento.data_fim;

      if (fim <= inicio) {
        throw new BadRequestException('Data de fim deve ser maior que data de início');
      }

      const temConflito = await this.verificarConflito(
        agendamento.sala_id,
        inicio,
        fim,
        agendamento.id,
      );
      if (temConflito) {
        throw new ConflictException('Já existe um agendamento para este horário');
      }
    }

    // Atualizar
    if (titulo) agendamento.titulo = titulo;
    if (descricao !== undefined) agendamento.descricao = descricao;
    if (data_inicio) agendamento.data_inicio = data_inicio;
    if (data_fim) agendamento.data_fim = data_fim;
    if (participantes) agendamento.participantes = participantes;
    if (link_reuniao !== undefined) agendamento.link_reuniao = link_reuniao;
    if (observacoes !== undefined) agendamento.observacoes = observacoes;
    if (status) agendamento.status = status;

    await this.agendamentosRepository.save(agendamento);

    // Buscar agendamento atualizado
    const agendamentoAtualizado = await this.agendamentosRepository.findOne({
      where: { id: agendamento.id },
    });

    return agendamentoAtualizado;
  }

  async remove(id: number, usuario: Usuario) {
    const agendamento = await this.findOne(id);

    // Verificar se o usuário é o dono do agendamento
    if (agendamento.usuario_id !== usuario.id) {
      throw new ForbiddenException('Você não tem permissão para cancelar este agendamento');
    }

    // Verificar se a reunião ainda não começou
    const agora = new Date();
    const dataInicio = new Date(agendamento.data_inicio);
    if (dataInicio <= agora) {
      throw new BadRequestException('Não é possível cancelar uma reunião que já começou');
    }

    // Preparar dados para email antes de deletar
    const meetingData = {
      titulo: agendamento.titulo,
      descricao: agendamento.descricao,
      data_inicio: agendamento.data_inicio,
      data_fim: agendamento.data_fim,
      sala_nome: agendamento.sala?.nome || 'Não informado',
      responsavel: usuario.nome,
      participantes: agendamento.participantes,
      link_reuniao: agendamento.link_reuniao,
    };

    console.log('Deletando agendamento ID:', id);
    await this.agendamentosRepository.remove(agendamento);

    // Enviar notificação de cancelamento
    try {
      await this.emailService.notifyMultipleUsers(meetingData, 'cancel');
    } catch (error) {
      console.error('Erro ao enviar notificações de cancelamento:', error);
      // Não bloqueia o cancelamento se o email falhar
    }

    return { message: 'Agendamento cancelado com sucesso' };
  }

  async getDisponibilidade(sala_id: number, data: string) {
    // Usar strings direto para timestamp without time zone
    const inicioDia = `${data} 00:00:00`;
    const fimDia = `${data} 23:59:59`;

    const agendamentos = await this.agendamentosRepository.find({
      where: {
        sala_id,
        status: 'confirmado',
        data_inicio: Between(inicioDia, fimDia),
      },
      order: { data_inicio: 'ASC' },
    });

    return agendamentos;
  }
}

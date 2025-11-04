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

@Injectable()
export class AgendamentosService {
  constructor(
    @InjectRepository(Agendamento)
    private agendamentosRepository: Repository<Agendamento>,
    @InjectRepository(Sala)
    private salasRepository: Repository<Sala>,
  ) {}

  private async verificarConflito(
    sala_id: number,
    data_inicio: Date,
    data_fim: Date,
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
      const inicioData = new Date(data_inicio + 'T00:00:00.000Z');
      const fimData = new Date(data_fim + 'T23:59:59.999Z');
      where.data_inicio = Between(inicioData, fimData);
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

    console.log('Data recebida no backend:', { data_inicio, data_fim });

    const inicio = new Date(data_inicio);
    const fim = new Date(data_fim);

    console.log('Data convertida no backend:', { inicio, fim });

    if (fim <= inicio) {
      throw new BadRequestException('Data de fim deve ser maior que data de início');
    }

    // Verificar se sala existe
    const sala = await this.salasRepository.findOne({ where: { id: sala_id } });
    if (!sala || !sala.ativa) {
      throw new NotFoundException('Sala não encontrada ou inativa');
    }

    // Verificar conflitos
    const temConflito = await this.verificarConflito(sala_id, inicio, fim);
    if (temConflito) {
      throw new ConflictException('Já existe um agendamento para este horário');
    }

    // Criar agendamento
    const agendamento = this.agendamentosRepository.create({
      sala_id,
      usuario_id: usuario.id,
      titulo,
      descricao,
      data_inicio: inicio,
      data_fim: fim,
      participantes: participantes || 1,
      link_reuniao,
      observacoes,
      status: 'confirmado',
    });

    await this.agendamentosRepository.save(agendamento);

    console.log('Agendamento criado:', agendamento.data_inicio, agendamento.data_fim);

    // Buscar agendamento com relacionamentos
    const agendamentoCriado = await this.agendamentosRepository.findOne({
      where: { id: agendamento.id },
    });

    return agendamentoCriado;
  }

  async update(id: number, updateAgendamentoDto: UpdateAgendamentoDto, usuario: Usuario) {
    const agendamento = await this.findOne(id);

    const { titulo, descricao, data_inicio, data_fim, participantes, link_reuniao, observacoes, status } =
      updateAgendamentoDto;

    // Se mudou horário, verificar conflitos
    if (data_inicio || data_fim) {
      const inicio = data_inicio ? new Date(data_inicio) : agendamento.data_inicio;
      const fim = data_fim ? new Date(data_fim) : agendamento.data_fim;

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
    if (data_inicio) agendamento.data_inicio = new Date(data_inicio);
    if (data_fim) agendamento.data_fim = new Date(data_fim);
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

    console.log('Deletando agendamento ID:', id);
    await this.agendamentosRepository.remove(agendamento);

    return { message: 'Agendamento cancelado com sucesso' };
  }

  async getDisponibilidade(sala_id: number, data: string) {
    const dataConsulta = new Date(data);
    const inicioDia = new Date(dataConsulta.setHours(0, 0, 0, 0));
    const fimDia = new Date(dataConsulta.setHours(23, 59, 59, 999));

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

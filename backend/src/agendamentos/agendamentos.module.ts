import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendamentosController } from './agendamentos.controller';
import { AgendamentosService } from './agendamentos.service';
import { Agendamento } from '../entities/agendamento.entity';
import { Sala } from '../entities/sala.entity';
import { EmailService } from '../common/services/email.service';
import { ChamadosService } from '../common/services/chamados.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agendamento, Sala])],
  controllers: [AgendamentosController],
  providers: [AgendamentosService, EmailService, ChamadosService],
})
export class AgendamentosModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendamentosController } from './agendamentos.controller';
import { AgendamentosService } from './agendamentos.service';
import { Agendamento } from '../entities/agendamento.entity';
import { Sala } from '../entities/sala.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agendamento, Sala])],
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
})
export class AgendamentosModule {}

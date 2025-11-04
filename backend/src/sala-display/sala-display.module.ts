import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaDisplayController } from './sala-display.controller';
import { SalaDisplayService } from './sala-display.service';
import { Agendamento } from '../entities/agendamento.entity';
import { Sala } from '../entities/sala.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agendamento, Sala])],
  controllers: [SalaDisplayController],
  providers: [SalaDisplayService],
})
export class SalaDisplayModule {}

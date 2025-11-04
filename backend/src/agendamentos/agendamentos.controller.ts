import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto, UpdateAgendamentoDto } from './dto/agendamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agendamentos')
@UseGuards(JwtAuthGuard)
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.agendamentosService.findAll(query);
  }

  @Get('disponibilidade/:sala_id')
  getDisponibilidade(@Param('sala_id', ParseIntPipe) sala_id: number, @Query('data') data: string) {
    if (!data) {
      throw new BadRequestException('Data é obrigatória');
    }
    return this.agendamentosService.getDisponibilidade(sala_id, data);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agendamentosService.findOne(id);
  }

  @Post()
  create(@Body() createAgendamentoDto: CreateAgendamentoDto, @Request() req) {
    return this.agendamentosService.create(createAgendamentoDto, req.user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgendamentoDto: UpdateAgendamentoDto,
    @Request() req,
  ) {
    return this.agendamentosService.update(id, updateAgendamentoDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.agendamentosService.remove(id, req.user);
  }
}

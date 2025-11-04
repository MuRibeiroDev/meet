import { Controller, Get } from '@nestjs/common';
import { SalaDisplayService } from './sala-display.service';

@Controller('sala')
export class SalaDisplayController {
  constructor(private readonly salaDisplayService: SalaDisplayService) {}

  @Get('agendamentos')
  getProximaReuniao() {
    return this.salaDisplayService.getProximaReuniao();
  }
}

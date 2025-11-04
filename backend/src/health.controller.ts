import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      message: 'API de Agendamento de Reuniões funcionando',
      timestamp: new Date().toISOString(),
    };
  }
}

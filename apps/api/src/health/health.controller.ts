import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getAppHealth();
  }

  @Get('database')
  getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }
}

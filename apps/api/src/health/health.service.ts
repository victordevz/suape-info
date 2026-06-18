import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getAppHealth() {
    return {
      status: 'ok',
      service: 'poketeam-api',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    const result = await this.prisma.$queryRaw<Array<{ result: number }>>`
      SELECT 1::int AS result
    `;

    return {
      status: result[0]?.result === 1 ? 'ok' : 'degraded',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    };
  }
}

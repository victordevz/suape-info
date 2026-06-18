import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HealthService } from '../src/health/health.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('HealthService', () => {
  it('returns application health payload', () => {
    const service = new HealthService({} as PrismaService);

    const health = service.getAppHealth();

    assert.equal(health.status, 'ok');
    assert.equal(health.service, 'poketeam-api');
    assert.match(health.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('checks database connectivity', async () => {
    const prisma = {
      $queryRaw: async () => [{ result: 1 }],
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    const health = await service.getDatabaseHealth();

    assert.equal(health.status, 'ok');
    assert.equal(health.database, 'postgresql');
  });
});

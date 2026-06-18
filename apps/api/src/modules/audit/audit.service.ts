import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  asRecord,
  optionalNumber,
  optionalString,
} from '../ingestion/ingestion.validation';

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listEvents(rawQuery: unknown) {
    const query = asRecord(rawQuery);
    const resource = optionalString(
      query.entity_type ?? query.resource,
      'entity_type',
    );
    const resourceId = optionalString(
      query.entity_id ?? query.resourceId,
      'entity_id',
    );
    const events = await this.prisma.auditEvent.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
      take: this.getTake(query.take),
    });

    return events.map((event) => ({
      id: event.id,
      actorUserId: event.actorUserId,
      action: event.action,
      entityType: event.resource,
      entityId: event.resourceId,
      before: event.previousData,
      after: event.newData,
      reason: event.reason,
      sourceIp: event.sourceIp,
      correlationId: event.correlationId,
      createdAt: event.createdAt,
    }));
  }

  private getTake(value: unknown) {
    const parsed = optionalNumber(value, 'take') ?? 50;

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException('take deve ser inteiro entre 1 e 100.');
    }

    return parsed;
  }
}

import { Controller, Get, Inject, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit-events')
export class AuditEventsController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.audit.listEvents(query);
  }
}

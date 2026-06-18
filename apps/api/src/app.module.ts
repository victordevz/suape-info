import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseDocsModule } from './database-docs/database-docs.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AccessModule } from './modules/access/access.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { AuditModule } from './modules/audit/audit.module';
import { DeadlinesModule } from './modules/deadlines/deadlines.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { RegulatoryModule } from './modules/regulatory/regulatory.module';
import { ResponsibilityModule } from './modules/responsibility/responsibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    DatabaseDocsModule,
    HealthModule,
    AccessModule,
    AiGatewayModule,
    AuditModule,
    DeadlinesModule,
    EvidenceModule,
    IngestionModule,
    RegulatoryModule,
    ResponsibilityModule,
  ],
})
export class AppModule {}

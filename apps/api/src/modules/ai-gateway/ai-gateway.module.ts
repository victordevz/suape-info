import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { DocumentIntelligenceAgent } from './agents/document-intelligence.agent';
import { LicenseTriageAgent } from './agents/license-triage.agent';
import { RagRetrievalService } from './rag-retrieval.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    RagRetrievalService,
    DocumentIntelligenceAgent,
    LicenseTriageAgent,
  ],
  exports: [AiGatewayService, RagRetrievalService],
})
export class AiGatewayModule {}

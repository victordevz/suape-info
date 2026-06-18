import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { DocumentFieldExtractionAgent } from './agents/document-field-extraction.agent';
import { DocumentIntelligenceAgent } from './agents/document-intelligence.agent';
import { DocumentTriageAgent } from './agents/document-triage.agent';
import { LicenseTriageAgent } from './agents/license-triage.agent';
import { OpenAiLlmClient } from './openai-llm.client';
import { RagRetrievalService } from './rag-retrieval.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    RagRetrievalService,
    OpenAiLlmClient,
    DocumentFieldExtractionAgent,
    DocumentIntelligenceAgent,
    DocumentTriageAgent,
    LicenseTriageAgent,
  ],
  exports: [AiGatewayService, RagRetrievalService],
})
export class AiGatewayModule {}

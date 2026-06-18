import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { requiredUuid } from '../ingestion/ingestion.validation';
import { AiGatewayService } from './ai-gateway.service';
import { DocumentIntelligenceAgent } from './agents/document-intelligence.agent';
import {
  parseLicenseTriageInput,
  parseRagQueryInput,
} from './ai-gateway.validation';

@Controller('ai-gateway')
export class AiGatewayController {
  constructor(
    @Inject(AiGatewayService)
    private readonly aiGateway: AiGatewayService,
    @Inject(DocumentIntelligenceAgent)
    private readonly documentIntelligence: DocumentIntelligenceAgent,
  ) {}

  @Get('status')
  getStatus() {
    return this.aiGateway.getStatus();
  }

  @Post('rag/query')
  queryRag(@Body() body: unknown) {
    return this.aiGateway.queryRag(parseRagQueryInput(body));
  }

  @Post('licenses/triage')
  triageLicense(@Body() body: unknown) {
    return this.aiGateway.triageLicense(parseLicenseTriageInput(body));
  }

  @Get('documents/:id/intelligence')
  inspectDocument(@Param('id') id: string) {
    return this.documentIntelligence.inspect(requiredUuid(id, 'id'));
  }
}

import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { asRecord, requiredUuid } from '../ingestion/ingestion.validation';
import { AiGatewayService } from './ai-gateway.service';
import { DocumentIntelligenceAgent } from './agents/document-intelligence.agent';
import {
  parseDocumentTriageInput,
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

  @Get('llm/validate')
  validateLlm() {
    return this.aiGateway.validateLlm();
  }

  @Post('rag/query')
  queryRag(@Body() body: unknown) {
    return this.aiGateway.queryRag(parseRagQueryInput(body));
  }

  @Post('licenses/triage')
  triageLicense(@Body() body: unknown) {
    return this.aiGateway.triageLicense(parseLicenseTriageInput(body));
  }

  @Post('documents/triage')
  triageDocuments(@Body() body: unknown) {
    return this.aiGateway.triageDocuments(parseDocumentTriageInput(body));
  }

  @Post('documents/triage-sheet')
  triageDocumentSheet(@Body() body: unknown) {
    return this.aiGateway.triageDocumentSheet(parseDocumentTriageInput(body));
  }

  @Get('documents/triage-sheet')
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getTriageDocumentSheet(@Query() query: unknown) {
    const parsedQuery = asRecord(query);
    const result = await this.aiGateway.triageDocumentSheet(
      parseDocumentTriageInput({
        spreadsheetId: 'planilha-controle-licencas-gml-2026',
        take: 5,
        ...parsedQuery,
      }),
    );

    return JSON.stringify(result, null, 2);
  }

  @Get('documents/:id/intelligence')
  inspectDocument(@Param('id') id: string) {
    return this.documentIntelligence.inspect(requiredUuid(id, 'id'));
  }
}

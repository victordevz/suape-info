import { Inject, Injectable } from '@nestjs/common';
import type {
  AgentStatus,
  LicenseTriageInput,
  RagQueryInput,
} from './ai-gateway.types';
import { LicenseTriageAgent } from './agents/license-triage.agent';
import { RagRetrievalService } from './rag-retrieval.service';

@Injectable()
export class AiGatewayService {
  constructor(
    @Inject(RagRetrievalService)
    private readonly rag: RagRetrievalService,
    @Inject(LicenseTriageAgent)
    private readonly licenseTriage: LicenseTriageAgent,
  ) {}

  getStatus() {
    return {
      architecture: 'drive_backed_rag_with_coordinated_micro_agents',
      knowledgeSource: 'google_drive_imported_documents',
      persistence: 'postgresql_prisma_existing_ingestion_tables',
      vectorIndex: 'planned',
      agents: this.getAgents(),
    };
  }

  queryRag(input: RagQueryInput) {
    return this.rag.query(input);
  }

  triageLicense(input: LicenseTriageInput) {
    return this.licenseTriage.triage(input);
  }

  private getAgents(): AgentStatus[] {
    return [
      {
        name: 'Drive RAG Retriever',
        capability: 'drive_rag_retrieval',
        status: 'ready',
        description:
          'Recupera trechos dos documentos importados do Google Drive com citacoes rastreaveis.',
      },
      {
        name: 'Document Intelligence Agent',
        capability: 'document_intelligence',
        status: 'ready',
        description:
          'Inspeciona metadados e qualidade de extracao para PDFs, imagens e planilhas.',
      },
      {
        name: 'License Triage Agent',
        capability: 'license_triage',
        status: 'ready',
        description:
          'Monta triagem preliminar por licenca usando cadastro regulatorio e fontes recuperadas.',
      },
      {
        name: 'Citation Guard',
        capability: 'citation_guard',
        status: 'planned',
        description:
          'Bloqueia respostas finais sem fonte, confidencialidade autorizada e trilha de auditoria.',
      },
    ];
  }
}

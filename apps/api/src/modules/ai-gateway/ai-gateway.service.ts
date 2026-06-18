import { Inject, Injectable } from '@nestjs/common';
import type {
  AgentStatus,
  DocumentTriageInput,
  LicenseTriageInput,
  RagQueryInput,
} from './ai-gateway.types';
import { LicenseTriageAgent } from './agents/license-triage.agent';
import { DocumentTriageAgent } from './agents/document-triage.agent';
import { OpenAiLlmClient } from './openai-llm.client';
import { RagRetrievalService } from './rag-retrieval.service';

@Injectable()
export class AiGatewayService {
  constructor(
    @Inject(RagRetrievalService)
    private readonly rag: RagRetrievalService,
    @Inject(LicenseTriageAgent)
    private readonly licenseTriage: LicenseTriageAgent,
    @Inject(DocumentTriageAgent)
    private readonly documentTriage: DocumentTriageAgent,
    @Inject(OpenAiLlmClient)
    private readonly llm: OpenAiLlmClient,
  ) {}

  getStatus() {
    return {
      architecture: 'drive_backed_rag_with_coordinated_micro_agents',
      knowledgeSource: 'google_drive_imported_documents',
      persistence: 'postgresql_prisma_existing_ingestion_tables',
      vectorIndex: 'planned',
      llm: this.llm.getStatus(),
      agents: this.getAgents(),
    };
  }

  async validateLlm() {
    return this.llm.validateConnection();
  }

  async queryRag(input: RagQueryInput) {
    const retrieval = await this.rag.query(input);

    try {
      const generation = await this.llm.generateRagAnswer({
        query: input.query,
        citations: retrieval.citations,
      });

      if (!generation) {
        return retrieval;
      }

      return {
        ...retrieval,
        answer: generation.answer,
        llm: {
          provider: generation.provider,
          model: generation.model,
          status: 'used' as const,
        },
      };
    } catch (error) {
      return {
        ...retrieval,
        llm: {
          provider: 'openai' as const,
          model: this.llm.getStatus().model,
          status: 'failed' as const,
          errorMessage:
            error instanceof Error ? error.message : 'Falha ao chamar LLM.',
        },
      };
    }
  }

  triageLicense(input: LicenseTriageInput) {
    return this.licenseTriage.triage(input);
  }

  triageDocuments(input: DocumentTriageInput) {
    return this.documentTriage.triage(input);
  }

  triageDocumentSheet(input: DocumentTriageInput) {
    return this.documentTriage.triageSheet(input);
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
        name: 'Document Triage Agent',
        capability: 'document_triage',
        status: 'ready',
        description:
          'Correlaciona linhas de planilha, normalizacao regulatoria, documentos e evidencias para montar triagem documental.',
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

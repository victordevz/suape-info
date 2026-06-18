import type {
  ComplianceStatus,
  DeadlineStatus,
  ExtractionStatus,
  IngestedDocumentType,
  RecordStatus,
} from '@prisma/client';

export type AgentCapability =
  | 'drive_rag_retrieval'
  | 'document_intelligence'
  | 'license_triage'
  | 'citation_guard';

export type AgentStatus = {
  name: string;
  capability: AgentCapability;
  status: 'ready' | 'degraded' | 'planned';
  description: string;
};

export type RagQueryInput = {
  query: string;
  take?: number;
  sourceDocumentId?: string;
};

export type LicenseTriageInput = {
  licenseId?: string;
  query?: string;
  take?: number;
};

export type RagCitation = {
  sourceDocumentId: string;
  documentVersionId: string;
  fileName: string;
  driveFileId: string;
  driveWebUrl: string | null;
  revisionId: string;
  extractionStatus: ExtractionStatus;
  extractionQuality: number | null;
  metadata: {
    documentType: IngestedDocumentType | null;
    licenseNumber: string | null;
    processNumber: string | null;
    validUntil: Date | null;
  };
  snippet: string;
  score: number;
};

export type RagQueryResult = {
  query: string;
  citations: RagCitation[];
  answerDraft: string;
};

export type DocumentIntelligenceResult = {
  sourceDocumentId: string;
  fileName: string;
  mimeType: string;
  extractionStatus: ExtractionStatus | 'MISSING_VERSION';
  extractionQuality: number | null;
  documentType: IngestedDocumentType | null;
  licenseNumber: string | null;
  processNumber: string | null;
  validUntil: Date | null;
  signals: string[];
  requiredAgent?: 'ocr' | 'spreadsheet_parser' | 'pdf_parser' | 'llm_metadata_extractor';
};

export type LicenseTriageResult = {
  mode: 'license_record' | 'rag_draft';
  license?: {
    id: string;
    number: string;
    type: string;
    status: RecordStatus;
    expiresAt: Date | null;
    renewalDueAt: Date | null;
    renewalDeadlineInternal: Date | null;
    renewalDeadlineAuthority: Date | null;
    issuingAgency: string;
  };
  summary: string;
  priorities: string[];
  pendingItems: Array<{
    kind: 'deadline' | 'obligation' | 'compliance' | 'evidence';
    title: string;
    status: RecordStatus | DeadlineStatus | ComplianceStatus | string;
    dueDate?: Date | null;
    reason: string;
  }>;
  citations: RagCitation[];
};

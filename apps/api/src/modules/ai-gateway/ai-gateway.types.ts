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
  | 'document_triage'
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

export type DocumentTriageInput = {
  sourceRecordId?: string;
  spreadsheetId?: string;
  sheetName?: string;
  licenseId?: string;
  take?: number;
};

export type TriageFieldSource =
  | 'DATABASE'
  | 'SPREADSHEET'
  | 'PDF'
  | 'DRIVE_DOCUMENT'
  | 'LLM_INFERENCE';

export type TriageFieldStatus =
  | 'confirmed'
  | 'suggested'
  | 'conflict'
  | 'missing';

export type TriageField<T = string> = {
  value: T | null;
  source: TriageFieldSource | null;
  citation: string | null;
  confidence: number;
  status: TriageFieldStatus;
  candidates: Array<{
    value: T;
    source: TriageFieldSource;
    citation: string | null;
    confidence: number;
  }>;
};

export type TriageConflict = {
  field: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  values: Array<{
    value: string;
    source: TriageFieldSource;
    citation: string | null;
  }>;
  recommendation: string;
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
  answer: string;
  answerDraft: string;
  llm: {
    provider: 'openai';
    model: string | null;
    status: 'used' | 'not_configured' | 'failed';
    errorMessage?: string;
  };
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

export type DocumentTriageResult = {
  generatedAt: string;
  mode: 'spreadsheet_rows_to_normalized_triage';
  filters: DocumentTriageInput;
  totals: {
    sourceRows: number;
    triagedRows: number;
    rowsMissingNormalizedClause: number;
  };
  rows: DocumentTriageRow[];
};

export type LicenseTriageSheetResult = {
  licenseId: string | null;
  generatedAt: string;
  triageStatus: 'ready_for_review' | 'needs_review' | 'needs_evidence' | 'needs_normalization';
  fields: {
    licenseNumber: TriageField<string>;
    licenseType: TriageField<string>;
    licenseKind: TriageField<string>;
    issuingAgency: TriageField<string>;
    issueDate: TriageField<string>;
    expiresAt: TriageField<string>;
    cprhProcessNumber: TriageField<string>;
    seiProcessNumber: TriageField<string>;
    triageCompliance: TriageField<ComplianceStatus>;
    itemCode: TriageField<string>;
    weight: TriageField<number>;
    score: TriageField<number>;
  };
  conditions: Array<{
    id: string;
    itemCode: string;
    clauseType: string;
    text: string;
    sourceRecordId: string | null;
    sourceDocumentId: string | null;
  }>;
  obligations: Array<{
    id: string;
    title: string;
    status: RecordStatus;
    dueDate: Date | null;
    deadlineInternal: Date | null;
    deadlineAuthority: Date | null;
    criticality: string | null;
  }>;
  conflicts: TriageConflict[];
  sources: Array<{
    label: string;
    source: TriageFieldSource;
    fileName?: string;
    driveWebUrl?: string | null;
    sourceRecordId?: string;
    documentVersionId?: string;
    extractionQuality?: number | null;
  }>;
  rows: DocumentTriageRow[];
};

export type DocumentTriageRow = {
  source: {
    sourceRecordId: string;
    sourceKind: string;
    spreadsheetId: string | null;
    sheetName: string | null;
    rowNumber: number | null;
    cellRange: string | null;
    itemCode: string | null;
    documentAsset: {
      id: string;
      fileName: string;
      mimeType: string;
      checksum: string;
    } | null;
    rawMetadata: unknown;
  };
  normalized: {
    license: {
      id: string;
      number: string;
      type: string;
      licenseKind: string;
      issuingAgency: string;
      expiresAt: Date | null;
      status: RecordStatus;
    } | null;
    regulatoryClause: {
      id: string;
      itemCode: string;
      clauseType: string;
      text: string;
      periodicity: string | null;
      status: RecordStatus;
    } | null;
    obligation: {
      id: string;
      title: string;
      status: RecordStatus;
      dueDate: Date | null;
      deadlineInternal: Date | null;
      deadlineAuthority: Date | null;
      criticality: string | null;
    } | null;
    compliance: {
      status: ComplianceStatus;
      weight: number | null;
      score: number | null;
      justification: string | null;
    } | null;
  };
  triageColumns: {
    atende: boolean;
    atendeParcialmente: boolean;
    naoAtende: boolean;
    pendente: boolean;
    naoAplicavel: boolean;
    emValidacao: boolean;
    peso: number | null;
    ponderacao: number | null;
  };
  correlations: {
    documentAssets: Array<{
      id: string;
      fileName: string;
      kind: string;
      mimeType: string;
      source: 'spreadsheet' | 'regulatory_clause' | 'evidence';
    }>;
    ragCitations: RagCitation[];
  };
  triage: {
    status: 'ready_for_review' | 'needs_evidence' | 'needs_normalization';
    confidence: number;
    reasons: string[];
    nextActions: string[];
  };
};

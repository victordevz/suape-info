import {
  getMockAuditEvents,
  getMockLicenseTriageSheet,
  isMockModeEnabled,
} from './mock-data';

export type ConnectedSource = {
  id: string;
  provider: string;
  displayName: string;
  connectionStatus: string;
  lastSyncAt: string | null;
  syncStatus: string;
  errorMessage: string | null;
};

export type MonitoredFolder = {
  id: string;
  connectedSourceId: string;
  driveFolderId: string;
  folderName: string;
  folderPath: string | null;
  parentFolderId: string | null;
  isActive: boolean;
  lastScanAt: string | null;
};

export type SourceDocument = {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileExtension: string | null;
  folderPath: string | null;
  driveWebUrl: string | null;
  driveRevisionId: string | null;
  importStatus: string;
  modifiedAtSource: string | null;
  lastImportedAt: string | null;
  errorMessage: string | null;
  documentMetadata?: {
    documentType: string | null;
    issuingAuthority: string | null;
    licenseNumber: string | null;
    validUntil: string | null;
    metadataStatus: string | null;
  };
  latestVersion?: {
    revisionId: string;
    extractionStatus: string;
    extractionQuality: string | null;
    hasExtractedText: boolean;
    createdAt: string;
  };
  monitoredFolder?: MonitoredFolder;
};

export type ImportJob = {
  id: string;
  jobType: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  sourceIp: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type DashboardData = {
  apiOnline: boolean;
  demoMode: boolean;
  configured: boolean;
  sources: ConnectedSource[];
  folders: MonitoredFolder[];
  documents: SourceDocument[];
  metrics: DocumentMetrics;
  jobs: ImportJob[];
};

export type DashboardFilters = {
  q?: string;
  monitoredFolderId?: string;
  importStatus?: string;
  fileType?: 'PDF' | 'SPREADSHEET';
};

export type DocumentMetrics = {
  total: number;
  imported: number;
  extracted: number;
  pending: number;
  failed: number;
  linked: number;
};

export type SyncResult = {
  foldersScanned: number;
  foldersDetected: number;
  documentsDetected: number;
  jobsCreated: number;
  errors: Array<{ folderId: string; message: string }>;
  scannedFolders: Array<{
    monitoredFolderId: string;
    driveFolderId: string;
    folderName: string;
    folderPath: string | null;
    itemsReturned: number;
  }>;
  driveItemsRead: Array<{
    driveFileId: string;
    name: string;
    mimeType: string;
    itemType: 'folder' | 'file';
    parentFolderId: string;
    parentFolderPath: string | null;
    webViewLink?: string;
    modifiedTime?: string;
  }>;
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

export type LicenseTriageSheetResult = {
  licenseId: string | null;
  generatedAt: string;
  triageStatus:
    | 'ready_for_review'
    | 'needs_review'
    | 'needs_evidence'
    | 'needs_normalization';
  fields: {
    licenseNumber: TriageField<string>;
    licenseType: TriageField<string>;
    licenseKind: TriageField<string>;
    issuingAgency: TriageField<string>;
    issueDate: TriageField<string>;
    expiresAt: TriageField<string>;
    cprhProcessNumber: TriageField<string>;
    seiProcessNumber: TriageField<string>;
    triageCompliance: TriageField<string>;
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
    status: string;
    dueDate: string | null;
    deadlineInternal: string | null;
    deadlineAuthority: string | null;
    criticality: string | null;
  }>;
  conflicts: Array<{
    field: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    values: Array<{
      value: string;
      source: TriageFieldSource;
      citation: string | null;
    }>;
    recommendation: string;
  }>;
  sources: Array<{
    label: string;
    source: TriageFieldSource;
    fileName?: string;
    driveWebUrl?: string | null;
    sourceRecordId?: string;
    documentVersionId?: string;
    extractionQuality?: number | null;
  }>;
  rows: Array<{
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
        expiresAt: string | null;
        status: string;
      } | null;
      regulatoryClause: {
        id: string;
        itemCode: string;
        clauseType: string;
        text: string;
        periodicity: string | null;
        status: string;
      } | null;
      obligation: {
        id: string;
        title: string;
        status: string;
        dueDate: string | null;
        deadlineInternal: string | null;
        deadlineAuthority: string | null;
        criticality: string | null;
      } | null;
      compliance: {
        status: string;
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
      ragCitations: unknown[];
    };
    triage: {
      status: 'ready_for_review' | 'needs_evidence' | 'needs_normalization';
      confidence: number;
      reasons: string[];
      nextActions: string[];
    };
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const MOCK_MODE = isMockModeEnabled();
const DRIVE_READ_REVALIDATE_SECONDS = 30;

function getBrowserSafeApiUrl() {
  return typeof window === 'undefined' ? API_URL : '/backend';
}

async function fetchJson<T>(
  path: string,
  options?: {
    revalidate?: number;
  },
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: options?.revalidate ? 'force-cache' : 'no-store',
    headers: {
      accept: 'application/json',
    },
    next: options?.revalidate
      ? { revalidate: options.revalidate }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardData(
  page = 1,
  filters: DashboardFilters = {},
): Promise<DashboardData> {
  try {
    const documentPage = Math.max(1, Math.floor(page));
    const documentTake = 20;
    const documentSkip = (documentPage - 1) * documentTake;
    const documentQuery = getDocumentQuery({
      ...filters,
      take: String(documentTake),
      skip: String(documentSkip),
    });
    const statsQuery = getDocumentQuery(filters);
    const [status, folders, documents, metrics, jobs] = await Promise.all([
      fetchJson<{ configured: boolean; sources: ConnectedSource[] }>(
        '/integrations/google-drive/status',
        { revalidate: DRIVE_READ_REVALIDATE_SECONDS },
      ),
      fetchJson<MonitoredFolder[]>('/monitored-folders', {
        revalidate: DRIVE_READ_REVALIDATE_SECONDS,
      }),
      fetchJson<SourceDocument[]>(`/documents${documentQuery}`, {
        revalidate: DRIVE_READ_REVALIDATE_SECONDS,
      }),
      fetchJson<DocumentMetrics>(`/documents/stats${statsQuery}`, {
        revalidate: DRIVE_READ_REVALIDATE_SECONDS,
      }),
      fetchJson<ImportJob[]>('/sync/jobs?take=5', {
        revalidate: DRIVE_READ_REVALIDATE_SECONDS,
      }),
    ]);

    return {
      apiOnline: true,
      demoMode: false,
      configured: status.configured,
      sources: status.sources,
      folders,
      documents,
      metrics,
      jobs,
    };
  } catch {
    return {
      apiOnline: false,
      demoMode: false,
      configured: false,
      sources: [],
      folders: [],
      documents: [],
      metrics: {
        total: 0,
        imported: 0,
        extracted: 0,
        pending: 0,
        failed: 0,
        linked: 0,
      },
      jobs: [],
    };
  }
}

export async function getOverviewDriveDocuments(take = 40) {
  try {
    return await fetchJson<SourceDocument[]>(`/documents?take=${take}`, {
      revalidate: DRIVE_READ_REVALIDATE_SECONDS,
    });
  } catch {
    return [];
  }
}

export async function getLicenseTriageSheet(input: {
  sourceRecordId?: string;
  spreadsheetId?: string;
  sheetName?: string;
  licenseId?: string;
  take?: number;
} = {}) {
  if (MOCK_MODE) {
    return getMockLicenseTriageSheet();
  }

  const query = getDocumentQuery({
    spreadsheetId: input.spreadsheetId ?? 'planilha-controle-licencas-gml-2026',
    sourceRecordId: input.sourceRecordId,
    sheetName: input.sheetName,
    licenseId: input.licenseId,
    take: String(input.take ?? 20),
  });

  return fetchJson<LicenseTriageSheetResult>(
    `/ai-gateway/documents/triage-sheet${query}`,
  );
}

export async function getAuditEvents(take = 8) {
  if (MOCK_MODE) {
    return getMockAuditEvents(take);
  }

  const query = getDocumentQuery({ take: String(take) });

  return fetchJson<AuditEvent[]>(`/audit-events${query}`);
}

function getDocumentQuery(
  filters: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `?${query}` : '';
}

export async function runGoogleDriveSync(input?: {
  connectedSourceId?: string;
  monitoredFolderId?: string;
}) {
  const response = await fetch(`${getBrowserSafeApiUrl()}/sync/google-drive/run`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input ?? {}),
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Falha ao sincronizar Google Drive (${response.status}): ${message}`,
    );
  }

  return response.json() as Promise<SyncResult>;
}

export async function removeMonitoredFolder(id: string) {
  const response = await fetch(`${getBrowserSafeApiUrl()}/monitored-folders/${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(`Falha ao remover pasta monitorada (${response.status}): ${message}`);
  }

  return response.json() as Promise<MonitoredFolder>;
}

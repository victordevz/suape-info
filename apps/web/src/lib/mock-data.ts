import type {
  AuditEvent,
  ConnectedSource,
  DashboardData,
  DashboardFilters,
  DocumentMetrics,
  ImportJob,
  LicenseTriageSheetResult,
  MonitoredFolder,
  SourceDocument,
  SyncResult,
} from './api';

const mockSources: ConnectedSource[] = [
  {
    id: 'source-google-drive-demo',
    provider: 'GOOGLE_DRIVE',
    displayName: 'Drive Compliance SUAPE',
    connectionStatus: 'CONNECTED',
    lastSyncAt: '2026-06-18T22:14:00.000Z',
    syncStatus: 'IDLE',
    errorMessage: null,
  },
];

const mockFolders: MonitoredFolder[] = [
  {
    id: 'folder-licencas',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-licencas',
    folderName: 'Licenças 2026',
    folderPath: '/Ambiental/Licenças',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T22:10:00.000Z',
  },
  {
    id: 'folder-boletos',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-boletos',
    folderName: 'Taxas e boletos',
    folderPath: '/Ambiental/Financeiro',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T22:08:00.000Z',
  },
  {
    id: 'folder-processos',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-processos',
    folderName: 'Processos CPRH',
    folderPath: '/Ambiental/Processos',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T22:06:00.000Z',
  },
];

const mockDocuments: SourceDocument[] = [
  {
    id: 'doc-licenca-rlo',
    fileName: 'RLO_CPRH_05.21.09.003636-1.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    folderPath: '/Ambiental/Licenças',
    driveWebUrl: 'https://drive.google.com/file/d/mock-rlo',
    driveRevisionId: 'rev-rlo',
    importStatus: 'LINKED',
    modifiedAtSource: '2026-06-18T20:42:00.000Z',
    lastImportedAt: '2026-06-18T22:13:00.000Z',
    errorMessage: null,
    documentMetadata: {
      documentType: 'Licença ambiental',
      issuingAuthority: 'CPRH',
      licenseNumber: '05.21.09.003636-1',
      validUntil: '2026-09-09',
      metadataStatus: 'CONFIRMED',
    },
    latestVersion: {
      revisionId: 'rev-rlo',
      extractionStatus: 'SUCCESS',
      extractionQuality: 'HIGH',
      hasExtractedText: true,
      createdAt: '2026-06-18T22:13:00.000Z',
    },
    monitoredFolder: mockFolders[0],
  },
  {
    id: 'doc-checklist-rlo',
    fileName: 'Checklist_renovacao_RLO.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileExtension: 'xlsx',
    folderPath: '/Ambiental/Licenças',
    driveWebUrl: 'https://drive.google.com/file/d/mock-checklist',
    driveRevisionId: 'rev-checklist',
    importStatus: 'IMPORTED',
    modifiedAtSource: '2026-06-18T19:20:00.000Z',
    lastImportedAt: '2026-06-18T22:12:00.000Z',
    errorMessage: null,
    documentMetadata: {
      documentType: 'Planilha de controle',
      issuingAuthority: 'CPRH',
      licenseNumber: '05.21.09.003636-1',
      validUntil: null,
      metadataStatus: 'PENDING',
    },
    latestVersion: {
      revisionId: 'rev-checklist',
      extractionStatus: 'SUCCESS',
      extractionQuality: 'MEDIUM',
      hasExtractedText: true,
      createdAt: '2026-06-18T22:12:00.000Z',
    },
    monitoredFolder: mockFolders[0],
  },
  {
    id: 'doc-boleto-taxa',
    fileName: 'Boleto_taxa_CPRH_julho_2026.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    folderPath: '/Ambiental/Financeiro',
    driveWebUrl: 'https://drive.google.com/file/d/mock-boleto',
    driveRevisionId: 'rev-boleto',
    importStatus: 'VALIDATION_PENDING',
    modifiedAtSource: '2026-06-17T17:10:00.000Z',
    lastImportedAt: '2026-06-18T22:02:00.000Z',
    errorMessage: null,
    documentMetadata: {
      documentType: 'Boleto',
      issuingAuthority: 'CPRH',
      licenseNumber: '05.21.09.003636-1',
      validUntil: null,
      metadataStatus: 'PENDING',
    },
    latestVersion: {
      revisionId: 'rev-boleto',
      extractionStatus: 'SUCCESS',
      extractionQuality: 'MEDIUM',
      hasExtractedText: true,
      createdAt: '2026-06-18T22:02:00.000Z',
    },
    monitoredFolder: mockFolders[1],
  },
  {
    id: 'doc-protocolo-cprh',
    fileName: 'Protocolo_processo_001701_2021.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    folderPath: '/Ambiental/Processos',
    driveWebUrl: 'https://drive.google.com/file/d/mock-protocolo',
    driveRevisionId: 'rev-protocolo',
    importStatus: 'LINKED',
    modifiedAtSource: '2026-06-18T18:48:00.000Z',
    lastImportedAt: '2026-06-18T21:59:00.000Z',
    errorMessage: null,
    documentMetadata: {
      documentType: 'Protocolo',
      issuingAuthority: 'CPRH',
      licenseNumber: '05.21.09.003636-1',
      validUntil: null,
      metadataStatus: 'CONFIRMED',
    },
    latestVersion: {
      revisionId: 'rev-protocolo',
      extractionStatus: 'SUCCESS',
      extractionQuality: 'HIGH',
      hasExtractedText: true,
      createdAt: '2026-06-18T21:59:00.000Z',
    },
    monitoredFolder: mockFolders[2],
  },
  {
    id: 'doc-ibama-aut',
    fileName: 'Autorizacao_IBAMA_2026-014.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    folderPath: '/Ambiental/Licenças',
    driveWebUrl: 'https://drive.google.com/file/d/mock-ibama',
    driveRevisionId: 'rev-ibama',
    importStatus: 'EXTRACTED',
    modifiedAtSource: '2026-06-16T14:00:00.000Z',
    lastImportedAt: '2026-06-18T21:40:00.000Z',
    errorMessage: null,
    documentMetadata: {
      documentType: 'Autorização',
      issuingAuthority: 'IBAMA',
      licenseNumber: 'AUT-IBAMA-2026-014',
      validUntil: '2026-11-18',
      metadataStatus: 'CONFIRMED',
    },
    latestVersion: {
      revisionId: 'rev-ibama',
      extractionStatus: 'SUCCESS',
      extractionQuality: 'HIGH',
      hasExtractedText: true,
      createdAt: '2026-06-18T21:40:00.000Z',
    },
    monitoredFolder: mockFolders[0],
  },
  {
    id: 'doc-antaq-op',
    fileName: 'Operacao_ANTAQ_OP_2026_041.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    folderPath: '/Ambiental/Licenças',
    driveWebUrl: 'https://drive.google.com/file/d/mock-antaq',
    driveRevisionId: 'rev-antaq',
    importStatus: 'IMPORTED',
    modifiedAtSource: '2026-06-14T13:02:00.000Z',
    lastImportedAt: '2026-06-18T21:22:00.000Z',
    errorMessage: null,
    documentMetadata: {
      documentType: 'Licença de operação',
      issuingAuthority: 'ANTAQ',
      licenseNumber: 'ANTAQ-OP-2026-041',
      validUntil: '2027-02-22',
      metadataStatus: 'PENDING',
    },
    latestVersion: {
      revisionId: 'rev-antaq',
      extractionStatus: 'PENDING',
      extractionQuality: null,
      hasExtractedText: false,
      createdAt: '2026-06-18T21:22:00.000Z',
    },
    monitoredFolder: mockFolders[0],
  },
];

const mockJobs: ImportJob[] = [
  {
    id: 'job-1',
    jobType: 'GOOGLE_DRIVE_SYNC',
    status: 'SUCCESS',
    startedAt: '2026-06-18T22:10:00.000Z',
    finishedAt: '2026-06-18T22:14:00.000Z',
    errorMessage: null,
    createdAt: '2026-06-18T22:10:00.000Z',
  },
  {
    id: 'job-2',
    jobType: 'DOCUMENT_IMPORT',
    status: 'RUNNING',
    startedAt: '2026-06-18T22:15:00.000Z',
    finishedAt: null,
    errorMessage: null,
    createdAt: '2026-06-18T22:15:00.000Z',
  },
];

const mockAuditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    actorUserId: 'Equipe documental',
    action: 'import_status_change',
    entityType: 'source_document',
    entityId: 'doc-licenca-rlo',
    before: { importStatus: 'IMPORTED' },
    after: { importStatus: 'LINKED' },
    reason: 'Evidência validada e vinculada à licença.',
    sourceIp: null,
    correlationId: 'corr-1',
    createdAt: '2026-06-18T21:59:00.000Z',
  },
  {
    id: 'audit-2',
    actorUserId: 'Analista CPRH',
    action: 'update',
    entityType: 'source_document',
    entityId: 'doc-boleto-taxa',
    before: { status: 'PENDING' },
    after: { status: 'VALIDATION_PENDING' },
    reason: 'Boleto marcado para conferência financeira.',
    sourceIp: null,
    correlationId: 'corr-2',
    createdAt: '2026-06-18T21:44:00.000Z',
  },
  {
    id: 'audit-3',
    actorUserId: 'Sistema',
    action: 'create',
    entityType: 'monitored_folder',
    entityId: 'folder-processos',
    before: null,
    after: { status: 'ACTIVE' },
    reason: 'Nova pasta adicionada ao monitoramento.',
    sourceIp: null,
    correlationId: 'corr-3',
    createdAt: '2026-06-18T20:52:00.000Z',
  },
];

const mockSyncResult: SyncResult = {
  foldersScanned: 3,
  foldersDetected: 3,
  documentsDetected: 6,
  jobsCreated: 2,
  errors: [],
  scannedFolders: mockFolders.map((folder) => ({
    monitoredFolderId: folder.id,
    driveFolderId: folder.driveFolderId,
    folderName: folder.folderName,
    folderPath: folder.folderPath,
    itemsReturned: folder.id === 'folder-boletos' ? 1 : 2,
  })),
  driveItemsRead: mockDocuments.map((document) => ({
    driveFileId: document.id,
    name: document.fileName,
    mimeType: document.mimeType ?? 'application/octet-stream',
    itemType: 'file',
    parentFolderId: document.monitoredFolder?.driveFolderId ?? 'root',
    parentFolderPath: document.folderPath,
    webViewLink: document.driveWebUrl ?? undefined,
    modifiedTime: document.modifiedAtSource ?? undefined,
  })),
};

const mockTriageSheet: LicenseTriageSheetResult = {
  licenseId: 'license-cprh-rlo',
  generatedAt: '2026-06-18T22:16:00.000Z',
  triageStatus: 'needs_evidence',
  fields: {
    licenseNumber: field('05.21.09.003636-1', 'PDF', 0.93, 'confirmed'),
    licenseType: field('Renovação da Licença de Operação', 'PDF', 0.91, 'confirmed'),
    licenseKind: field('RLO', 'DATABASE', 0.88, 'confirmed'),
    issuingAgency: field('CPRH', 'DATABASE', 0.9, 'confirmed'),
    issueDate: field('2024-09-09', 'PDF', 0.82, 'suggested'),
    expiresAt: field('2026-09-09', 'PDF', 0.95, 'confirmed'),
    cprhProcessNumber: field('001701/2021', 'PDF', 0.9, 'confirmed'),
    seiProcessNumber: field(null, null, 0, 'missing'),
    triageCompliance: field('PENDENTE', 'SPREADSHEET', 0.9, 'confirmed'),
    itemCode: field('4.2.1', 'SPREADSHEET', 0.88, 'confirmed'),
    weight: field(12, 'SPREADSHEET', 0.88, 'confirmed'),
    score: field(8, 'SPREADSHEET', 0.88, 'confirmed'),
  },
  conditions: [
    {
      id: 'cond-1',
      itemCode: '4.2.1',
      clauseType: 'ENTREGA_DOCUMENTAL',
      text: 'Apresentar comprovante de recolhimento e renovação.',
      sourceRecordId: 'sr-1',
      sourceDocumentId: 'doc-licenca-rlo',
    },
  ],
  obligations: [
    {
      id: 'obl-1',
      title: 'Anexar comprovante da taxa CPRH',
      status: 'PENDING',
      dueDate: '2026-07-12',
      deadlineInternal: '2026-07-05',
      deadlineAuthority: '2026-07-12',
      criticality: 'HIGH',
    },
    {
      id: 'obl-2',
      title: 'Protocolar renovação complementar',
      status: 'IN_PROGRESS',
      dueDate: '2026-08-02',
      deadlineInternal: '2026-07-28',
      deadlineAuthority: '2026-08-02',
      criticality: 'MEDIUM',
    },
  ],
  conflicts: [],
  sources: [
    {
      label: 'Licença principal',
      source: 'PDF',
      fileName: 'RLO_CPRH_05.21.09.003636-1.pdf',
      driveWebUrl: 'https://drive.google.com/file/d/mock-rlo',
    },
    {
      label: 'Planilha de controle',
      source: 'SPREADSHEET',
      fileName: 'Checklist_renovacao_RLO.xlsx',
      driveWebUrl: 'https://drive.google.com/file/d/mock-checklist',
    },
    {
      label: 'Banco regulatório',
      source: 'DATABASE',
      fileName: 'Cadastro normalizado',
      driveWebUrl: null,
    },
  ],
  rows: [
    triageRow({
      sourceRecordId: 'sr-1',
      sheetName: 'CPRH',
      rowNumber: 12,
      itemCode: '4.2.1',
      license: {
        id: 'license-cprh-rlo',
        number: '05.21.09.003636-1',
        type: 'Renovação da Licença de Operação',
        licenseKind: 'RLO',
        issuingAgency: 'CPRH',
        expiresAt: '2026-09-09',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-1',
        title: 'Anexar comprovante da taxa CPRH',
        status: 'PENDING',
        dueDate: '2026-07-12',
        deadlineInternal: '2026-07-05',
        deadlineAuthority: '2026-07-12',
        criticality: 'HIGH',
      },
      compliance: {
        status: 'PENDENTE',
        weight: 12,
        score: 8,
        justification: 'Boleto identificado, comprovante pendente.',
      },
      triageStatus: 'needs_evidence',
      confidence: 0.93,
      documentAssets: [
        asset('doc-licenca-rlo', 'RLO_CPRH_05.21.09.003636-1.pdf', 'evidence'),
        asset('doc-boleto-taxa', 'Boleto_taxa_CPRH_julho_2026.pdf', 'evidence'),
      ],
    }),
    triageRow({
      sourceRecordId: 'sr-2',
      sheetName: 'IBAMA',
      rowNumber: 4,
      itemCode: '2.1.4',
      license: {
        id: 'license-ibama-aut',
        number: 'AUT-IBAMA-2026-014',
        type: 'Autorização ambiental',
        licenseKind: 'AUT',
        issuingAgency: 'IBAMA',
        expiresAt: '2026-11-18',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-3',
        title: 'Atualizar evidência de leitura',
        status: 'IN_PROGRESS',
        dueDate: '2026-08-18',
        deadlineInternal: '2026-08-10',
        deadlineAuthority: '2026-08-18',
        criticality: 'LOW',
      },
      compliance: {
        status: 'EM_ANDAMENTO',
        weight: 8,
        score: 6,
        justification: 'Documento extraído, pendente leitura final.',
      },
      triageStatus: 'ready_for_review',
      confidence: 0.81,
      documentAssets: [asset('doc-ibama-aut', 'Autorizacao_IBAMA_2026-014.pdf', 'evidence')],
    }),
    triageRow({
      sourceRecordId: 'sr-3',
      sheetName: 'ANTAQ',
      rowNumber: 8,
      itemCode: '1.8.9',
      license: {
        id: 'license-antaq-op',
        number: 'ANTAQ-OP-2026-041',
        type: 'Operação portuária',
        licenseKind: 'OP',
        issuingAgency: 'ANTAQ',
        expiresAt: '2027-02-22',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-4',
        title: 'Normalizar cadastro ANTAQ',
        status: 'PENDING',
        dueDate: '2026-09-01',
        deadlineInternal: '2026-08-22',
        deadlineAuthority: '2026-09-01',
        criticality: 'MEDIUM',
      },
      compliance: {
        status: 'VALIDANDO',
        weight: 10,
        score: 7,
        justification: 'Documento presente, cadastro ainda inconsistente.',
      },
      triageStatus: 'needs_normalization',
      confidence: 0.78,
      documentAssets: [asset('doc-antaq-op', 'Operacao_ANTAQ_OP_2026_041.pdf', 'evidence')],
    }),
  ],
};

export function isMockModeEnabled() {
  return process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';
}

export function getMockDashboardData(
  page = 1,
  filters: DashboardFilters = {},
): DashboardData {
  const filteredDocuments = applyDocumentFilters(mockDocuments, filters);
  const take = 20;
  const skip = (Math.max(1, Math.floor(page)) - 1) * take;

  return {
    apiOnline: true,
    demoMode: true,
    configured: true,
    sources: mockSources,
    folders: mockFolders,
    documents: filteredDocuments.slice(skip, skip + take),
    metrics: getMockMetrics(filteredDocuments),
    jobs: mockJobs,
  };
}

export function getMockLicenseTriageSheet() {
  return mockTriageSheet;
}

export function getMockAuditEvents(take = 8) {
  return mockAuditEvents.slice(0, take);
}

export async function runMockGoogleDriveSync() {
  await wait(450);
  return mockSyncResult;
}

export async function removeMockMonitoredFolder(id: string) {
  await wait(200);

  return (
    mockFolders.find((folder) => folder.id === id) ?? {
      ...mockFolders[0],
      id,
    }
  );
}

function getMockMetrics(documents: SourceDocument[]): DocumentMetrics {
  return {
    total: documents.length,
    imported: documents.filter((document) =>
      ['IMPORTED', 'EXTRACTED', 'LINKED', 'VALIDATION_PENDING'].includes(
        document.importStatus,
      ),
    ).length,
    extracted: documents.filter(
      (document) => document.latestVersion?.extractionStatus === 'SUCCESS',
    ).length,
    pending: documents.filter(
      (document) => document.importStatus === 'VALIDATION_PENDING',
    ).length,
    failed: documents.filter((document) => document.importStatus === 'FAILED')
      .length,
    linked: documents.filter((document) => document.importStatus === 'LINKED')
      .length,
  };
}

function applyDocumentFilters(
  documents: SourceDocument[],
  filters: DashboardFilters,
) {
  const normalizedQuery = normalizeText(filters.q ?? '');

  return documents.filter((document) => {
    if (
      filters.monitoredFolderId &&
      document.monitoredFolder?.id !== filters.monitoredFolderId
    ) {
      return false;
    }

    if (filters.importStatus && document.importStatus !== filters.importStatus) {
      return false;
    }

    if (filters.fileType === 'PDF' && document.fileExtension !== 'pdf') {
      return false;
    }

    if (
      filters.fileType === 'SPREADSHEET' &&
      !['xlsx', 'xls', 'csv', 'ods'].includes(document.fileExtension ?? '')
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = normalizeText(
      [
        document.fileName,
        document.folderPath,
        document.documentMetadata?.licenseNumber,
        document.documentMetadata?.issuingAuthority,
      ]
        .filter(Boolean)
        .join(' '),
    );

    return haystack.includes(normalizedQuery);
  });
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function field<T>(
  value: T | null,
  source: LicenseTriageSheetResult['fields']['licenseNumber']['source'],
  confidence: number,
  status: LicenseTriageSheetResult['fields']['licenseNumber']['status'],
) {
  return {
    value,
    source,
    citation: null,
    confidence,
    status,
    candidates: value === null || source === null ? [] : [{
      value,
      source,
      citation: null,
      confidence,
    }],
  };
}

function triageRow(input: {
  sourceRecordId: string;
  sheetName: string;
  rowNumber: number;
  itemCode: string;
  license: NonNullable<
    LicenseTriageSheetResult['rows'][number]['normalized']['license']
  >;
  obligation: NonNullable<
    LicenseTriageSheetResult['rows'][number]['normalized']['obligation']
  >;
  compliance: NonNullable<
    LicenseTriageSheetResult['rows'][number]['normalized']['compliance']
  >;
  triageStatus: LicenseTriageSheetResult['rows'][number]['triage']['status'];
  confidence: number;
  documentAssets: LicenseTriageSheetResult['rows'][number]['correlations']['documentAssets'];
}) {
  return {
    source: {
      sourceRecordId: input.sourceRecordId,
      sourceKind: 'GOOGLE_SHEETS',
      spreadsheetId: 'planilha-controle-licencas-gml-2026',
      sheetName: input.sheetName,
      rowNumber: input.rowNumber,
      cellRange: `A${input.rowNumber}:L${input.rowNumber}`,
      itemCode: input.itemCode,
      documentAsset: null,
      rawMetadata: {},
    },
    normalized: {
      license: input.license,
      regulatoryClause: {
        id: `clause-${input.sourceRecordId}`,
        itemCode: input.itemCode,
        clauseType: 'ENTREGA_DOCUMENTAL',
        text: 'Executar controle documental e validar evidência.',
        periodicity: 'ANUAL',
        status: 'ACTIVE',
      },
      obligation: input.obligation,
      compliance: input.compliance,
    },
    triageColumns: {
      atende: false,
      atendeParcialmente: true,
      naoAtende: false,
      pendente: true,
      naoAplicavel: false,
      emValidacao: true,
      peso: input.compliance.weight,
      ponderacao: input.compliance.score,
    },
    correlations: {
      documentAssets: input.documentAssets,
      ragCitations: [],
    },
    triage: {
      status: input.triageStatus,
      confidence: input.confidence,
      reasons: ['Modo demo ativado para navegação rápida.'],
      nextActions: ['Revisar documentação relacionada.'],
    },
  };
}

function asset(id: string, fileName: string, source: 'spreadsheet' | 'regulatory_clause' | 'evidence') {
  return {
    id,
    fileName,
    kind: 'document',
    mimeType: 'application/pdf',
    source,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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
  {
    id: 'folder-condicionantes',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-condicionantes',
    folderName: 'Condicionantes e evidências',
    folderPath: '/Ambiental/Condicionantes',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T21:58:00.000Z',
  },
  {
    id: 'folder-relatorios',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-relatorios',
    folderName: 'Relatórios técnicos',
    folderPath: '/Ambiental/Relatórios',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T21:52:00.000Z',
  },
  {
    id: 'folder-evidencias',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-evidencias',
    folderName: 'Evidências anexadas',
    folderPath: '/Ambiental/Evidências',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T21:49:00.000Z',
  },
  {
    id: 'folder-outorgas',
    connectedSourceId: 'source-google-drive-demo',
    driveFolderId: 'drive-folder-outorgas',
    folderName: 'Outorgas e autorizações',
    folderPath: '/Ambiental/Outorgas',
    parentFolderId: null,
    isActive: true,
    lastScanAt: '2026-06-18T21:44:00.000Z',
  },
];

mockFolders.push(...createAdditionalMockFolders(50 - mockFolders.length));

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

mockDocuments.push(
  mockDocument({
    id: 'doc-cprh-relatorio-ruido',
    fileName: 'Relatorio_monitoramento_ruido_terminal_2026.pdf',
    folder: mockFolders[4],
    documentType: 'Relatório técnico',
    issuingAuthority: 'CPRH',
    licenseNumber: '05.21.09.003636-1',
    importStatus: 'EXTRACTED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-18T16:22:00.000Z',
  }),
  mockDocument({
    id: 'doc-cprh-evidencia-efluentes',
    fileName: 'Evidencia_analise_efluentes_maio_2026.pdf',
    folder: mockFolders[5],
    documentType: 'Evidência',
    issuingAuthority: 'CPRH',
    licenseNumber: '05.21.09.003636-1',
    importStatus: 'LINKED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-18T15:30:00.000Z',
  }),
  mockDocument({
    id: 'doc-cprh-guia-taxa-agosto',
    fileName: 'Guia_taxa_CPRH_agosto_2026.pdf',
    folder: mockFolders[1],
    documentType: 'Guia de pagamento',
    issuingAuthority: 'CPRH',
    licenseNumber: '05.21.09.003636-1',
    importStatus: 'VALIDATION_PENDING',
    extractionQuality: 'MEDIUM',
    modifiedAtSource: '2026-06-18T14:40:00.000Z',
  }),
  mockDocument({
    id: 'doc-ibama-pgrs',
    fileName: 'PGRS_IBAMA_2026_revisao_02.pdf',
    folder: mockFolders[3],
    documentType: 'Plano ambiental',
    issuingAuthority: 'IBAMA',
    licenseNumber: 'AUT-IBAMA-2026-014',
    importStatus: 'EXTRACTED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-18T13:18:00.000Z',
  }),
  mockDocument({
    id: 'doc-ibama-gru',
    fileName: 'GRU_IBAMA_autorizacao_2026_014.pdf',
    folder: mockFolders[1],
    documentType: 'GRU',
    issuingAuthority: 'IBAMA',
    licenseNumber: 'AUT-IBAMA-2026-014',
    importStatus: 'VALIDATION_PENDING',
    extractionQuality: 'MEDIUM',
    modifiedAtSource: '2026-06-17T18:02:00.000Z',
  }),
  mockDocument({
    id: 'doc-antaq-checklist',
    fileName: 'Checklist_operacao_portuaria_ANTAQ_2026.xlsx',
    folder: mockFolders[0],
    documentType: 'Planilha de controle',
    issuingAuthority: 'ANTAQ',
    licenseNumber: 'ANTAQ-OP-2026-041',
    importStatus: 'IMPORTED',
    extractionStatus: 'PENDING',
    fileExtension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    modifiedAtSource: '2026-06-17T16:48:00.000Z',
  }),
  mockDocument({
    id: 'doc-antaq-evidencia-dragagem',
    fileName: 'Evidencia_dragagem_bacia_evolucao_junho.pdf',
    folder: mockFolders[5],
    documentType: 'Evidência fotográfica',
    issuingAuthority: 'ANTAQ',
    licenseNumber: 'ANTAQ-OP-2026-041',
    importStatus: 'LINKED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-17T15:20:00.000Z',
  }),
  mockDocument({
    id: 'doc-apac-outorga',
    fileName: 'Outorga_APAC_CAPTACAO_2026_077.pdf',
    folder: mockFolders[6],
    documentType: 'Outorga',
    issuingAuthority: 'APAC',
    licenseNumber: 'APAC-CAP-2026-077',
    validUntil: '2026-10-05',
    importStatus: 'EXTRACTED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-16T11:38:00.000Z',
  }),
  mockDocument({
    id: 'doc-apac-boleto',
    fileName: 'Boleto_APAC_outorga_captacao_2026.pdf',
    folder: mockFolders[1],
    documentType: 'Boleto',
    issuingAuthority: 'APAC',
    licenseNumber: 'APAC-CAP-2026-077',
    importStatus: 'VALIDATION_PENDING',
    extractionQuality: 'MEDIUM',
    modifiedAtSource: '2026-06-16T10:28:00.000Z',
  }),
  mockDocument({
    id: 'doc-cprh-lo-terminal',
    fileName: 'LO_Terminal_Granéis_CPRH_2026_118.pdf',
    folder: mockFolders[0],
    documentType: 'Licença de operação',
    issuingAuthority: 'CPRH',
    licenseNumber: 'CPRH-LO-2026-118',
    validUntil: '2026-12-14',
    importStatus: 'EXTRACTED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-15T16:20:00.000Z',
  }),
  mockDocument({
    id: 'doc-cprh-cond-terminal',
    fileName: 'Condicionantes_LO_Terminal_Granéis_2026.xlsx',
    folder: mockFolders[3],
    documentType: 'Matriz de condicionantes',
    issuingAuthority: 'CPRH',
    licenseNumber: 'CPRH-LO-2026-118',
    importStatus: 'IMPORTED',
    extractionStatus: 'PENDING',
    fileExtension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    modifiedAtSource: '2026-06-15T15:10:00.000Z',
  }),
  mockDocument({
    id: 'doc-cprh-comprovante-terminal',
    fileName: 'Comprovante_pagamento_taxa_terminal_graneis.pdf',
    folder: mockFolders[1],
    documentType: 'Comprovante de pagamento',
    issuingAuthority: 'CPRH',
    licenseNumber: 'CPRH-LO-2026-118',
    importStatus: 'LINKED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-15T14:05:00.000Z',
  }),
  mockDocument({
    id: 'doc-anvisa-porto',
    fileName: 'Autorizacao_ANVISA_area_alfandegada_2026.pdf',
    folder: mockFolders[6],
    documentType: 'Autorização sanitária',
    issuingAuthority: 'ANVISA',
    licenseNumber: 'ANVISA-SAN-2026-022',
    validUntil: '2027-01-30',
    importStatus: 'EXTRACTED',
    extractionQuality: 'MEDIUM',
    modifiedAtSource: '2026-06-14T09:42:00.000Z',
  }),
  mockDocument({
    id: 'doc-anvisa-fatura',
    fileName: 'Fatura_ANVISA_area_alfandegada_junho.pdf',
    folder: mockFolders[1],
    documentType: 'Fatura',
    issuingAuthority: 'ANVISA',
    licenseNumber: 'ANVISA-SAN-2026-022',
    importStatus: 'VALIDATION_PENDING',
    extractionQuality: 'LOW',
    modifiedAtSource: '2026-06-14T09:00:00.000Z',
  }),
  mockDocument({
    id: 'doc-cprh-falha-ocr',
    fileName: 'Laudo_emissoes_atmosfericas_scan_baixa_qualidade.pdf',
    folder: mockFolders[4],
    documentType: 'Laudo técnico',
    issuingAuthority: 'CPRH',
    licenseNumber: 'CPRH-LO-2026-118',
    importStatus: 'FAILED',
    extractionStatus: 'FAILED',
    extractionQuality: null,
    errorMessage: 'OCR interrompido por baixa resolução do arquivo.',
    modifiedAtSource: '2026-06-13T18:00:00.000Z',
  }),
  mockDocument({
    id: 'doc-semas-licenca',
    fileName: 'Licenca_SEMAS_patio_conteineres_2026.pdf',
    folder: mockFolders[0],
    documentType: 'Licença ambiental',
    issuingAuthority: 'SEMAS',
    licenseNumber: 'SEMAS-LP-2026-305',
    validUntil: '2026-08-28',
    importStatus: 'EXTRACTED',
    extractionQuality: 'HIGH',
    modifiedAtSource: '2026-06-13T12:14:00.000Z',
  }),
  mockDocument({
    id: 'doc-semas-evidencia',
    fileName: 'Evidencia_recuperacao_area_verde_SEMAS.pdf',
    folder: mockFolders[5],
    documentType: 'Evidência',
    issuingAuthority: 'SEMAS',
    licenseNumber: 'SEMAS-LP-2026-305',
    importStatus: 'IMPORTED',
    extractionQuality: 'MEDIUM',
    modifiedAtSource: '2026-06-12T17:36:00.000Z',
  }),
  mockDocument({
    id: 'doc-planilha-master',
    fileName: 'Matriz_master_obrigacoes_ambientais_2026.xlsx',
    folder: mockFolders[3],
    documentType: 'Planilha de obrigações',
    issuingAuthority: 'SUAPE',
    licenseNumber: null,
    importStatus: 'IMPORTED',
    extractionStatus: 'PENDING',
    fileExtension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    modifiedAtSource: '2026-06-12T09:12:00.000Z',
  }),
  mockDocument({
    id: 'doc-kml-area-influencia',
    fileName: 'Area_influencia_direta_terminal_gml.kml',
    folder: mockFolders[5],
    documentType: 'Arquivo geoespacial',
    issuingAuthority: 'SUAPE',
    licenseNumber: 'CPRH-LO-2026-118',
    importStatus: 'EXTRACTED',
    extractionQuality: 'HIGH',
    fileExtension: 'kml',
    mimeType: 'application/vnd.google-earth.kml+xml',
    modifiedAtSource: '2026-06-11T14:24:00.000Z',
  }),
  mockDocument({
    id: 'doc-kml-poligonal-app',
    fileName: 'Poligonal_APP_manguezal_monitorado.kml',
    folder: mockFolders[5],
    documentType: 'Arquivo geoespacial',
    issuingAuthority: 'CPRH',
    licenseNumber: '05.21.09.003636-1',
    importStatus: 'LINKED',
    extractionQuality: 'HIGH',
    fileExtension: 'kml',
    mimeType: 'application/vnd.google-earth.kml+xml',
    modifiedAtSource: '2026-06-11T10:18:00.000Z',
  }),
  mockDocument({
    id: 'doc-kmz-zona-dragagem',
    fileName: 'Zona_dragagem_bacia_evolucao_2026.kmz',
    folder: mockFolders[5],
    documentType: 'Pacote geoespacial',
    issuingAuthority: 'ANTAQ',
    licenseNumber: 'ANTAQ-DRG-2026-089',
    importStatus: 'IMPORTED',
    extractionStatus: 'PENDING',
    fileExtension: 'kmz',
    mimeType: 'application/vnd.google-earth.kmz',
    modifiedAtSource: '2026-06-10T16:05:00.000Z',
  }),
  mockDocument({
    id: 'doc-kmz-outorga-apac',
    fileName: 'Pontos_captacao_outorga_APAC_2026.kmz',
    folder: mockFolders[6],
    documentType: 'Pacote geoespacial',
    issuingAuthority: 'APAC',
    licenseNumber: 'APAC-CAP-2026-077',
    importStatus: 'VALIDATION_PENDING',
    extractionStatus: 'PENDING',
    fileExtension: 'kmz',
    mimeType: 'application/vnd.google-earth.kmz',
    modifiedAtSource: '2026-06-10T11:46:00.000Z',
  }),
);

mockDocuments.push(...createAdditionalMockDocuments(120 - mockDocuments.length));

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
  {
    id: 'job-3',
    jobType: 'OCR_EXTRACTION',
    status: 'SUCCESS',
    startedAt: '2026-06-18T21:20:00.000Z',
    finishedAt: '2026-06-18T21:38:00.000Z',
    errorMessage: null,
    createdAt: '2026-06-18T21:20:00.000Z',
  },
  {
    id: 'job-4',
    jobType: 'TRIAGE_SHEET_NORMALIZATION',
    status: 'SUCCESS',
    startedAt: '2026-06-18T20:44:00.000Z',
    finishedAt: '2026-06-18T20:50:00.000Z',
    errorMessage: null,
    createdAt: '2026-06-18T20:44:00.000Z',
  },
  {
    id: 'job-5',
    jobType: 'DOCUMENT_IMPORT',
    status: 'FAILED',
    startedAt: '2026-06-18T19:12:00.000Z',
    finishedAt: '2026-06-18T19:15:00.000Z',
    errorMessage: 'Arquivo escaneado sem resolução mínima para OCR.',
    createdAt: '2026-06-18T19:12:00.000Z',
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
  {
    id: 'audit-4',
    actorUserId: 'Agente OCR',
    action: 'import_status_change',
    entityType: 'source_document',
    entityId: 'doc-cprh-relatorio-ruido',
    before: { importStatus: 'IMPORTED' },
    after: { importStatus: 'EXTRACTED' },
    reason: 'Texto extraído com alta confiança.',
    sourceIp: null,
    correlationId: 'corr-4',
    createdAt: '2026-06-18T20:38:00.000Z',
  },
  {
    id: 'audit-5',
    actorUserId: 'Analista Ambiental',
    action: 'update',
    entityType: 'source_document',
    entityId: 'doc-apac-boleto',
    before: { metadataStatus: 'PENDING' },
    after: { metadataStatus: 'CONFIRMED' },
    reason: 'Boleto APAC associado à outorga de captação.',
    sourceIp: null,
    correlationId: 'corr-5',
    createdAt: '2026-06-18T19:54:00.000Z',
  },
  {
    id: 'audit-6',
    actorUserId: 'Sistema',
    action: 'update',
    entityType: 'monitored_folder',
    entityId: 'folder-condicionantes',
    before: { lastScanAt: '2026-06-17T21:58:00.000Z' },
    after: { lastScanAt: '2026-06-18T21:58:00.000Z' },
    reason: 'Varredura programada concluída.',
    sourceIp: null,
    correlationId: 'corr-6',
    createdAt: '2026-06-18T19:20:00.000Z',
  },
  {
    id: 'audit-7',
    actorUserId: 'Equipe documental',
    action: 'import_status_change',
    entityType: 'source_document',
    entityId: 'doc-cprh-falha-ocr',
    before: { importStatus: 'IMPORTED' },
    after: { importStatus: 'FAILED' },
    reason: 'OCR falhou por baixa qualidade da digitalização.',
    sourceIp: null,
    correlationId: 'corr-7',
    createdAt: '2026-06-18T18:47:00.000Z',
  },
  {
    id: 'audit-8',
    actorUserId: 'Analista IBAMA',
    action: 'update',
    entityType: 'source_document',
    entityId: 'doc-ibama-pgrs',
    before: { reviewStatus: 'OPEN' },
    after: { reviewStatus: 'READY_FOR_REVIEW' },
    reason: 'Plano PGRS revisado e liberado para conferência.',
    sourceIp: null,
    correlationId: 'corr-8',
    createdAt: '2026-06-18T18:12:00.000Z',
  },
  {
    id: 'audit-9',
    actorUserId: 'Sistema',
    action: 'create',
    entityType: 'monitored_folder',
    entityId: 'folder-outorgas',
    before: null,
    after: { status: 'ACTIVE' },
    reason: 'Pasta de outorgas incluída no monitoramento.',
    sourceIp: null,
    correlationId: 'corr-9',
    createdAt: '2026-06-18T17:35:00.000Z',
  },
];

const mockSyncResult: SyncResult = {
  foldersScanned: mockFolders.length,
  foldersDetected: mockFolders.length,
  documentsDetected: mockDocuments.length,
  jobsCreated: mockJobs.length,
  errors: [],
  scannedFolders: mockFolders.map((folder) => ({
    monitoredFolderId: folder.id,
    driveFolderId: folder.driveFolderId,
    folderName: folder.folderName,
    folderPath: folder.folderPath,
    itemsReturned: mockDocuments.filter(
      (document) => document.monitoredFolder?.id === folder.id,
    ).length,
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
    {
      id: 'cond-2',
      itemCode: '2.1.4',
      clauseType: 'RELATORIO_TECNICO',
      text: 'Atualizar relatório de acompanhamento ambiental e evidências de leitura.',
      sourceRecordId: 'sr-2',
      sourceDocumentId: 'doc-ibama-aut',
    },
    {
      id: 'cond-3',
      itemCode: '1.8.9',
      clauseType: 'CADASTRO_REGULATORIO',
      text: 'Normalizar cadastro portuário e vincular evidência de operação.',
      sourceRecordId: 'sr-3',
      sourceDocumentId: 'doc-antaq-op',
    },
    {
      id: 'cond-4',
      itemCode: '5.3.2',
      clauseType: 'MONITORAMENTO',
      text: 'Apresentar laudo de ruído ambiental com medições atualizadas.',
      sourceRecordId: 'sr-4',
      sourceDocumentId: 'doc-cprh-relatorio-ruido',
    },
    {
      id: 'cond-5',
      itemCode: '7.1.1',
      clauseType: 'OUTORGA',
      text: 'Conferir vigência da outorga de captação e comprovante de recolhimento.',
      sourceRecordId: 'sr-5',
      sourceDocumentId: 'doc-apac-outorga',
    },
    {
      id: 'cond-6',
      itemCode: '3.4.5',
      clauseType: 'EVIDENCIA',
      text: 'Anexar evidência de dragagem e relatório fotográfico do período.',
      sourceRecordId: 'sr-6',
      sourceDocumentId: 'doc-antaq-evidencia-dragagem',
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
    {
      id: 'obl-3',
      title: 'Atualizar evidência de leitura',
      status: 'IN_PROGRESS',
      dueDate: '2026-08-18',
      deadlineInternal: '2026-08-10',
      deadlineAuthority: '2026-08-18',
      criticality: 'LOW',
    },
    {
      id: 'obl-4',
      title: 'Normalizar cadastro ANTAQ',
      status: 'PENDING',
      dueDate: '2026-09-01',
      deadlineInternal: '2026-08-22',
      deadlineAuthority: '2026-09-01',
      criticality: 'MEDIUM',
    },
    {
      id: 'obl-5',
      title: 'Revisar laudo de ruído ambiental',
      status: 'PENDING',
      dueDate: '2026-07-18',
      deadlineInternal: '2026-07-10',
      deadlineAuthority: '2026-07-18',
      criticality: 'HIGH',
    },
    {
      id: 'obl-6',
      title: 'Vincular boleto da outorga APAC',
      status: 'PENDING',
      dueDate: '2026-07-25',
      deadlineInternal: '2026-07-18',
      deadlineAuthority: '2026-07-25',
      criticality: 'HIGH',
    },
    {
      id: 'obl-7',
      title: 'Conferir evidência de dragagem',
      status: 'IN_PROGRESS',
      dueDate: '2026-08-30',
      deadlineInternal: '2026-08-20',
      deadlineAuthority: '2026-08-30',
      criticality: 'MEDIUM',
    },
    {
      id: 'obl-8',
      title: 'Revisar autorização sanitária ANVISA',
      status: 'PENDING',
      dueDate: '2026-09-18',
      deadlineInternal: '2026-09-08',
      deadlineAuthority: '2026-09-18',
      criticality: 'MEDIUM',
    },
    {
      id: 'obl-9',
      title: 'Regularizar evidência SEMAS',
      status: 'PENDING',
      dueDate: '2026-07-08',
      deadlineInternal: '2026-07-01',
      deadlineAuthority: '2026-07-08',
      criticality: 'HIGH',
    },
  ],
  conflicts: [
    {
      field: 'validade',
      severity: 'MEDIUM',
      values: [
        { value: '2026-09-09', source: 'PDF', citation: null },
        { value: '2026-09-19', source: 'SPREADSHEET', citation: null },
      ],
      recommendation: 'Confirmar validade no PDF oficial antes de aprovar a triagem.',
    },
  ],
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
    {
      label: 'Relatório de ruído',
      source: 'DRIVE_DOCUMENT',
      fileName: 'Relatorio_monitoramento_ruido_terminal_2026.pdf',
      driveWebUrl: 'https://drive.google.com/file/d/doc-cprh-relatorio-ruido',
    },
    {
      label: 'Outorga APAC',
      source: 'PDF',
      fileName: 'Outorga_APAC_CAPTACAO_2026_077.pdf',
      driveWebUrl: 'https://drive.google.com/file/d/doc-apac-outorga',
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
    triageRow({
      sourceRecordId: 'sr-4',
      sheetName: 'CPRH',
      rowNumber: 19,
      itemCode: '5.3.2',
      license: {
        id: 'license-cprh-terminal',
        number: 'CPRH-LO-2026-118',
        type: 'Licença de Operação - Terminal de Granéis',
        licenseKind: 'LO',
        issuingAgency: 'CPRH',
        expiresAt: '2026-12-14',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-5',
        title: 'Revisar laudo de ruído ambiental',
        status: 'PENDING',
        dueDate: '2026-07-18',
        deadlineInternal: '2026-07-10',
        deadlineAuthority: '2026-07-18',
        criticality: 'HIGH',
      },
      compliance: {
        status: 'PENDENTE',
        weight: 14,
        score: 5,
        justification: 'Laudo recebido, OCR de anexo complementar falhou.',
      },
      triageStatus: 'needs_evidence',
      confidence: 0.86,
      documentAssets: [
        asset('doc-cprh-lo-terminal', 'LO_Terminal_Granéis_CPRH_2026_118.pdf', 'evidence'),
        asset('doc-cprh-relatorio-ruido', 'Relatorio_monitoramento_ruido_terminal_2026.pdf', 'evidence'),
        asset('doc-cprh-falha-ocr', 'Laudo_emissoes_atmosfericas_scan_baixa_qualidade.pdf', 'evidence'),
      ],
    }),
    triageRow({
      sourceRecordId: 'sr-5',
      sheetName: 'APAC',
      rowNumber: 6,
      itemCode: '7.1.1',
      license: {
        id: 'license-apac-captacao',
        number: 'APAC-CAP-2026-077',
        type: 'Outorga de captação',
        licenseKind: 'OUTORGA',
        issuingAgency: 'APAC',
        expiresAt: '2026-10-05',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-6',
        title: 'Vincular boleto da outorga APAC',
        status: 'PENDING',
        dueDate: '2026-07-25',
        deadlineInternal: '2026-07-18',
        deadlineAuthority: '2026-07-25',
        criticality: 'HIGH',
      },
      compliance: {
        status: 'PENDENTE',
        weight: 12,
        score: 4,
        justification: 'Boleto localizado sem comprovante correspondente.',
      },
      triageStatus: 'needs_evidence',
      confidence: 0.84,
      documentAssets: [
        asset('doc-apac-outorga', 'Outorga_APAC_CAPTACAO_2026_077.pdf', 'evidence'),
        asset('doc-apac-boleto', 'Boleto_APAC_outorga_captacao_2026.pdf', 'evidence'),
      ],
    }),
    triageRow({
      sourceRecordId: 'sr-6',
      sheetName: 'ANTAQ',
      rowNumber: 15,
      itemCode: '3.4.5',
      license: {
        id: 'license-antaq-dragagem',
        number: 'ANTAQ-DRG-2026-089',
        type: 'Autorização de dragagem operacional',
        licenseKind: 'AUT',
        issuingAgency: 'ANTAQ',
        expiresAt: '2026-08-30',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-7',
        title: 'Conferir evidência de dragagem',
        status: 'IN_PROGRESS',
        dueDate: '2026-08-30',
        deadlineInternal: '2026-08-20',
        deadlineAuthority: '2026-08-30',
        criticality: 'MEDIUM',
      },
      compliance: {
        status: 'EM_ANDAMENTO',
        weight: 10,
        score: 7,
        justification: 'Evidência fotográfica anexada, aguardando validação técnica.',
      },
      triageStatus: 'ready_for_review',
      confidence: 0.9,
      documentAssets: [asset('doc-antaq-evidencia-dragagem', 'Evidencia_dragagem_bacia_evolucao_junho.pdf', 'evidence')],
    }),
    triageRow({
      sourceRecordId: 'sr-7',
      sheetName: 'ANVISA',
      rowNumber: 9,
      itemCode: '8.2.3',
      license: {
        id: 'license-anvisa-sanitaria',
        number: 'ANVISA-SAN-2026-022',
        type: 'Autorização sanitária de área alfandegada',
        licenseKind: 'AUT',
        issuingAgency: 'ANVISA',
        expiresAt: '2027-01-30',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-8',
        title: 'Revisar autorização sanitária ANVISA',
        status: 'PENDING',
        dueDate: '2026-09-18',
        deadlineInternal: '2026-09-08',
        deadlineAuthority: '2026-09-18',
        criticality: 'MEDIUM',
      },
      compliance: {
        status: 'VALIDANDO',
        weight: 9,
        score: 6,
        justification: 'Fatura encontrada, conferência documental pendente.',
      },
      triageStatus: 'needs_normalization',
      confidence: 0.74,
      documentAssets: [
        asset('doc-anvisa-porto', 'Autorizacao_ANVISA_area_alfandegada_2026.pdf', 'evidence'),
        asset('doc-anvisa-fatura', 'Fatura_ANVISA_area_alfandegada_junho.pdf', 'evidence'),
      ],
    }),
    triageRow({
      sourceRecordId: 'sr-8',
      sheetName: 'SEMAS',
      rowNumber: 11,
      itemCode: '6.6.2',
      license: {
        id: 'license-semas-patio',
        number: 'SEMAS-LP-2026-305',
        type: 'Licença prévia - pátio de contêineres',
        licenseKind: 'LP',
        issuingAgency: 'SEMAS',
        expiresAt: '2026-08-28',
        status: 'ACTIVE',
      },
      obligation: {
        id: 'obl-9',
        title: 'Regularizar evidência SEMAS',
        status: 'PENDING',
        dueDate: '2026-07-08',
        deadlineInternal: '2026-07-01',
        deadlineAuthority: '2026-07-08',
        criticality: 'HIGH',
      },
      compliance: {
        status: 'PENDENTE',
        weight: 13,
        score: 3,
        justification: 'Evidência existe, mas não está vinculada ao item correto.',
      },
      triageStatus: 'needs_normalization',
      confidence: 0.72,
      documentAssets: [
        asset('doc-semas-licenca', 'Licenca_SEMAS_patio_conteineres_2026.pdf', 'evidence'),
        asset('doc-semas-evidencia', 'Evidencia_recuperacao_area_verde_SEMAS.pdf', 'evidence'),
      ],
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

export function getMockOverviewDriveDocuments(take = 40) {
  return mockDocuments.slice(0, take);
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

    if (filters.fileType === 'KML' && document.fileExtension !== 'kml') {
      return false;
    }

    if (filters.fileType === 'KMZ' && document.fileExtension !== 'kmz') {
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

function createAdditionalMockFolders(count: number): MonitoredFolder[] {
  if (count <= 0) {
    return [];
  }

  const folderGroups = [
    ['licencas-operacionais', 'Licenças operacionais', '/Ambiental/Licenças/Operacionais'],
    ['condicionantes-cprh', 'Condicionantes CPRH', '/Ambiental/Condicionantes/CPRH'],
    ['condicionantes-ibama', 'Condicionantes IBAMA', '/Ambiental/Condicionantes/IBAMA'],
    ['evidencias-campo', 'Evidências de campo', '/Ambiental/Evidências/Campo'],
    ['relatorios-monitoramento', 'Relatórios de monitoramento', '/Ambiental/Relatórios/Monitoramento'],
    ['geoespacial-kml-kmz', 'Camadas KML e KMZ', '/Ambiental/Geoespacial'],
    ['boletos-guias', 'Boletos e guias', '/Ambiental/Financeiro/Guias'],
    ['processos-sei', 'Processos SEI', '/Ambiental/Processos/SEI'],
    ['outorgas-apac', 'Outorgas APAC', '/Ambiental/Outorgas/APAC'],
    ['auditorias', 'Auditorias e fiscalizações', '/Ambiental/Auditorias'],
  ];

  return Array.from({ length: count }, (_, index) => {
    const group = folderGroups[index % folderGroups.length];
    const sequence = Math.floor(index / folderGroups.length) + 1;
    const id = `folder-auto-${group[0]}-${sequence}`;

    return {
      id,
      connectedSourceId: 'source-google-drive-demo',
      driveFolderId: `drive-${id}`,
      folderName: `${group[1]} ${String(sequence).padStart(2, '0')}`,
      folderPath: `${group[2]}/${String(sequence).padStart(2, '0')}`,
      parentFolderId: null,
      isActive: true,
      lastScanAt: `2026-06-${String(18 - (index % 8)).padStart(2, '0')}T${String(21 - (index % 6)).padStart(2, '0')}:30:00.000Z`,
    };
  });
}

function createAdditionalMockDocuments(count: number): SourceDocument[] {
  if (count <= 0) {
    return [];
  }

  const extensions = [
    { extension: 'pdf', mimeType: 'application/pdf', type: 'Relatório técnico' },
    {
      extension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      type: 'Planilha de condicionantes',
    },
    { extension: 'kml', mimeType: 'application/vnd.google-earth.kml+xml', type: 'Camada geoespacial' },
    { extension: 'kmz', mimeType: 'application/vnd.google-earth.kmz', type: 'Pacote geoespacial' },
    { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', type: 'Memorial descritivo' },
  ];
  const authorities = ['CPRH', 'IBAMA', 'ANTAQ', 'APAC', 'ANVISA', 'SEMAS', 'SUAPE'];
  const statuses = ['IMPORTED', 'EXTRACTED', 'LINKED', 'VALIDATION_PENDING', 'CLASSIFICATION_PENDING', 'FAILED'];
  const subjects = [
    'efluentes',
    'ruido_ambiental',
    'emissoes_atmosfericas',
    'dragagem',
    'vegetacao',
    'residuos',
    'outorga_captacao',
    'auditoria',
    'plano_emergencia',
    'area_influencia',
  ];

  return Array.from({ length: count }, (_, index) => {
    const file = extensions[index % extensions.length];
    const authority = authorities[index % authorities.length];
    const status = statuses[index % statuses.length];
    const subject = subjects[index % subjects.length];
    const folder = mockFolders[(index + 7) % mockFolders.length];
    const sequence = String(index + 1).padStart(3, '0');
    const licenseNumber = `${authority}-MOCK-2026-${sequence}`;
    const extractionStatus = status === 'FAILED'
      ? 'FAILED'
      : file.extension === 'kmz' || status === 'CLASSIFICATION_PENDING'
        ? 'PENDING'
        : 'SUCCESS';
    const extractionQuality = extractionStatus === 'FAILED'
      ? null
      : index % 3 === 0
        ? 'HIGH'
        : index % 3 === 1
          ? 'MEDIUM'
          : 'LOW';

    return mockDocument({
      id: `doc-auto-${sequence}`,
      fileName: `${authority}_${subject}_${sequence}.${file.extension}`,
      folder,
      documentType: file.type,
      issuingAuthority: authority,
      licenseNumber,
      validUntil: index % 4 === 0 ? `2026-${String(8 + (index % 5)).padStart(2, '0')}-${String(10 + (index % 18)).padStart(2, '0')}` : null,
      importStatus: status,
      extractionStatus,
      extractionQuality,
      fileExtension: file.extension,
      mimeType: file.mimeType,
      errorMessage: status === 'FAILED' ? 'Arquivo mockado com falha simulada de extração.' : null,
      modifiedAtSource: `2026-06-${String(18 - (index % 10)).padStart(2, '0')}T${String(8 + (index % 10)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00.000Z`,
    });
  });
}

function mockDocument(input: {
  id: string;
  fileName: string;
  folder: MonitoredFolder;
  documentType: string;
  issuingAuthority: string;
  licenseNumber: string | null;
  importStatus: string;
  modifiedAtSource: string;
  validUntil?: string | null;
  fileExtension?: string;
  mimeType?: string;
  extractionStatus?: string;
  extractionQuality?: string | null;
  errorMessage?: string | null;
}): SourceDocument {
  const revisionId = `rev-${input.id.replace(/^doc-/, '')}`;

  return {
    id: input.id,
    fileName: input.fileName,
    mimeType: input.mimeType ?? 'application/pdf',
    fileExtension: input.fileExtension ?? 'pdf',
    folderPath: input.folder.folderPath,
    driveWebUrl: `https://drive.google.com/file/d/${input.id}`,
    driveRevisionId: revisionId,
    importStatus: input.importStatus,
    modifiedAtSource: input.modifiedAtSource,
    lastImportedAt: '2026-06-18T21:30:00.000Z',
    errorMessage: input.errorMessage ?? null,
    documentMetadata: {
      documentType: input.documentType,
      issuingAuthority: input.issuingAuthority,
      licenseNumber: input.licenseNumber,
      validUntil: input.validUntil ?? null,
      metadataStatus: input.importStatus === 'LINKED' ? 'CONFIRMED' : 'PENDING',
    },
    latestVersion: {
      revisionId,
      extractionStatus: input.extractionStatus ?? 'SUCCESS',
      extractionQuality: input.extractionQuality ?? 'MEDIUM',
      hasExtractedText: (input.extractionStatus ?? 'SUCCESS') === 'SUCCESS',
      createdAt: '2026-06-18T21:30:00.000Z',
    },
    monitoredFolder: input.folder,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

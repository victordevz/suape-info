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
  folderName: string;
  folderPath: string | null;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function getBrowserSafeApiUrl() {
  return typeof window === 'undefined' ? API_URL : '/backend';
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardData(page = 1): Promise<DashboardData> {
  try {
    const documentPage = Math.max(1, Math.floor(page));
    const documentTake = 20;
    const documentSkip = (documentPage - 1) * documentTake;
    const [status, folders, documents, metrics, jobs] = await Promise.all([
      fetchJson<{ configured: boolean; sources: ConnectedSource[] }>(
        '/integrations/google-drive/status',
      ),
      fetchJson<MonitoredFolder[]>('/monitored-folders?activeOnly=false'),
      fetchJson<SourceDocument[]>(
        `/documents?take=${documentTake}&skip=${documentSkip}`,
      ),
      fetchJson<DocumentMetrics>('/documents/stats'),
      fetchJson<ImportJob[]>('/sync/jobs?take=5'),
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

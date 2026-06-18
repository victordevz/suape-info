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
  jobs: ImportJob[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

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

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [status, folders, documents, jobs] = await Promise.all([
      fetchJson<{ configured: boolean; sources: ConnectedSource[] }>(
        '/integrations/google-drive/status',
      ),
      fetchJson<MonitoredFolder[]>('/monitored-folders?activeOnly=false'),
      fetchJson<SourceDocument[]>('/documents?take=20'),
      fetchJson<ImportJob[]>('/sync/jobs?take=5'),
    ]);

    return {
      apiOnline: true,
      demoMode: false,
      configured: status.configured,
      sources: status.sources,
      folders,
      documents,
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
      jobs: [],
    };
  }
}

export async function runGoogleDriveSync() {
  await fetch(`${API_URL}/sync/google-drive/run`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
  });
}

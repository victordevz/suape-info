'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runGoogleDriveSync, type SyncResult } from '@/lib/api';

export function SyncDiagnostics({
  connectedSourceId,
}: {
  connectedSourceId?: string;
}) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSyncing || (!result && !error)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResult(null);
      setError(null);
    }, 6500);

    return () => window.clearTimeout(timeoutId);
  }, [error, isSyncing, result]);

  async function syncNow() {
    setError(null);
    setIsSyncing(true);

    try {
      const nextResult = await runGoogleDriveSync({
        connectedSourceId: connectedSourceId || undefined,
      });
      setResult(nextResult);
      router.refresh();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : String(syncError));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="sync-diagnostics">
      <button
        aria-label="Sincronizar agora"
        className="sync-button"
        disabled={isSyncing || !connectedSourceId}
        onClick={syncNow}
        title="Sincronizar agora"
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6v5h-5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M4 18v-5h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M19 11a7 7 0 0 0-12.1-4.8L4 9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M5 13a7 7 0 0 0 12.1 4.8L20 15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
        </svg>
      </button>

      {(isSyncing || error || result) && (
        <section className="sync-log" aria-label="Log da sincronizacao Google Drive">
          <div className="sync-log-header">
            <strong>Log da ultima sincronizacao</strong>
            {isSyncing ? <span>Executando...</span> : null}
          </div>

          {error ? <p className="sync-error">{error}</p> : null}

          {result ? (
            <>
              <div className="sync-summary">
                <span>{result.foldersScanned} pastas varridas</span>
                <span>{result.driveItemsRead.length} itens lidos pela API</span>
                <span>{result.documentsDetected} documentos detectados</span>
                <span>{result.jobsCreated} jobs criados</span>
              </div>

              <div className="sync-folder-list">
                {result.scannedFolders.map((folder) => (
                  <div className="sync-folder-row" key={folder.driveFolderId}>
                    <strong>{folder.folderName}</strong>
                    <span>{folder.folderPath ?? '/'}</span>
                    <em>{folder.itemsReturned} itens retornados</em>
                  </div>
                ))}
              </div>

              <div className="sync-item-list">
                {result.driveItemsRead.length > 0 ? (
                  result.driveItemsRead.map((item) => (
                    <div className="sync-item-row" key={item.driveFileId}>
                      <span className={`sync-item-type ${item.itemType}`}>
                        {item.itemType === 'folder' ? 'Pasta' : 'Arquivo'}
                      </span>
                      <strong>{item.name}</strong>
                      <small>{item.parentFolderPath ?? '/'}</small>
                    </div>
                  ))
                ) : (
                  <p className="sync-empty">
                    A API nao retornou arquivos nem subpastas para as pastas varridas.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}

import { revalidatePath } from 'next/cache';
import {
  getDashboardData,
  runGoogleDriveSync,
  type SourceDocument,
} from '@/lib/api';

const tabs = [
  'Todos',
  'Importados',
  'Extraidos',
  'Nao classificados',
  'Aguardando validacao',
  'Vinculados',
  'Com erro',
];

const futureFilters = ['Orgao', 'Licenca', 'Prazo', 'Responsavel'];

export default async function Home() {
  const data = await getDashboardData();
  const activeSource = data.sources[0];
  const metrics = getMetrics(data.documents);

  async function syncNow(formData: FormData) {
    'use server';

    const connectedSourceId = String(formData.get('connectedSourceId') ?? '');

    try {
      await runGoogleDriveSync({
        connectedSourceId: connectedSourceId || undefined,
      });
    } finally {
      revalidatePath('/');
    }
  }

  return (
    <main className="workspace-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-symbol" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>SUAPE</strong>
            <small>Governanca ambiental</small>
          </div>
        </div>

        <section className="panel-section">
          <div className="section-title">Fontes conectadas</div>
          <SourceItem
            name="Google Drive"
            status={activeSource?.connectionStatus ?? 'PENDING_PERMISSION'}
            detail={activeSource?.displayName ?? 'Aguardando conexao OAuth'}
            active
          />
        </section>

        <section className="panel-section folders-section">
          <div className="section-title">Pastas conectadas</div>
          {data.folders.length > 0 ? (
            data.folders.map((folder) => (
              <button className="folder-item" key={folder.id}>
                <span className={folder.isActive ? 'dot active' : 'dot muted'} />
                <span>
                  <strong>{folder.folderName}</strong>
                  <small>{folder.folderPath ?? 'Caminho nao informado'}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="empty-card">
              Nenhuma pasta monitorada. Conecte o Drive e selecione uma pasta.
            </div>
          )}
        </section>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Central de Dados e Evidencias</p>
            <h1>Documentos importados do Drive</h1>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <span>Buscar</span>
              <input placeholder="Nome, licenca, processo ou pasta" />
            </label>
            <form action={syncNow}>
              <input
                name="connectedSourceId"
                type="hidden"
                value={activeSource?.id ?? ''}
              />
              <button
                aria-label="Sincronizar agora"
                className="sync-button"
                title="Sincronizar agora"
                type="submit"
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
            </form>
          </div>
        </header>

        <section className="metrics-grid" aria-label="Indicadores">
          <MetricCard label="Pastas conectadas" value={data.folders.length} tone="blue" />
          <MetricCard label="Documentos importados" value={metrics.imported} tone="blue" />
          <MetricCard label="Texto extraido" value={metrics.extracted} tone="green" />
          <MetricCard label="Validacao pendente" value={metrics.pending} tone="yellow" />
          <MetricCard label="Erros" value={metrics.failed} tone="red" />
          <MetricCard label="Vinculados" value={metrics.linked} tone="blue" />
        </section>

        <section className="document-workbench">
          <div className="table-panel">
            <div className="breadcrumb">Google Drive / GML / Licencas e Autorizacoes</div>

            <nav className="tabs" aria-label="Filtros por status">
              {tabs.map((tab, index) => (
                <button className={index === 0 ? 'active' : ''} key={tab}>
                  {tab}
                </button>
              ))}
            </nav>

            <div className="filter-row">
              <input placeholder="q: buscar por nome" />
              <select defaultValue="">
                <option value="">Pasta monitorada</option>
              </select>
              <select defaultValue="">
                <option value="">Status de importacao</option>
              </select>
              {futureFilters.map((filter) => (
                <button className="future-filter" disabled key={filter}>
                  {filter} futuro
                </button>
              ))}
            </div>

            <div className="table-scroll" aria-label="Tabela de documentos importados">
              <div className="documents-table" role="table">
                <div className="table-header" role="row">
                  <span>Nome</span>
                  <span>Tipo</span>
                  <span>Origem</span>
                  <span>Status</span>
                  <span>Extracao</span>
                  <span>Ultima sync</span>
                  <span>Acao</span>
                </div>

                {data.documents.length > 0 ? (
                  data.documents.map((document) => (
                    <DocumentRow document={document} key={document.id} />
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>Nenhum documento importado ainda.</strong>
                    <span>
                      Execute uma sincronizacao depois de cadastrar uma pasta monitorada.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function SourceItem({
  name,
  status,
  detail,
  active = false,
}: {
  name: string;
  status: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div className={active ? 'source-item active' : 'source-item'}>
      <div>
        <strong>{name}</strong>
        <small>{detail}</small>
      </div>
      <Badge value={status} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'yellow' | 'red';
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DocumentRow({ document }: { document: SourceDocument }) {
  return (
    <div className="table-row" role="row">
      <span className="document-name">
        <strong>{document.fileName}</strong>
        <small>{document.folderPath ?? 'Sem pasta vinculada'}</small>
      </span>
      <span data-label="Tipo">{getFileType(document)}</span>
      <span data-label="Origem">Google Drive</span>
      <span data-label="Status">
        <Badge value={document.importStatus} />
      </span>
      <span data-label="Extracao">{document.latestVersion?.extractionStatus ?? 'PENDING'}</span>
      <span data-label="Ultima sync">{formatDateTime(document.lastImportedAt)}</span>
      <span data-label="Acao">
        {document.driveWebUrl ? (
          <a
            className="drive-link"
            href={document.driveWebUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Abrir
          </a>
        ) : (
          <span className="muted-text">Indisponivel</span>
        )}
      </span>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');

  return <span className={`badge ${normalized}`}>{value.replaceAll('_', ' ')}</span>;
}

function getMetrics(documents: SourceDocument[]) {
  return documents.reduce(
    (metrics, document) => {
      if (['IMPORTED', 'EXTRACTED', 'LINKED', 'VALIDATION_PENDING'].includes(document.importStatus)) {
        metrics.imported += 1;
      }
      if (document.latestVersion?.hasExtractedText) {
        metrics.extracted += 1;
      }
      if (document.importStatus === 'VALIDATION_PENDING') {
        metrics.pending += 1;
      }
      if (document.importStatus === 'FAILED') {
        metrics.failed += 1;
      }
      if (document.importStatus === 'LINKED') {
        metrics.linked += 1;
      }

      return metrics;
    },
    {
      imported: 0,
      extracted: 0,
      pending: 0,
      failed: 0,
      linked: 0,
    },
  );
}

function getFileType(document: SourceDocument) {
  if (document.mimeType?.includes('spreadsheet') || document.fileExtension === 'xlsx') {
    return 'Planilha';
  }

  if (document.mimeType?.includes('google-apps.document')) {
    return 'Google Docs';
  }

  if (document.fileExtension) {
    return document.fileExtension.toUpperCase();
  }

  return 'Arquivo';
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Sem registro';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

import {
  type DashboardFilters,
  getDashboardData,
  type SourceDocument,
} from '@/lib/api';
import { DebouncedDocumentSearch } from './debounced-document-search';
import { DashboardShell } from './dashboard-shell';
import { DocumentFilters } from './document-filters';
import { RemoveFolderButton } from './remove-folder-button';
import { SyncDiagnostics } from './sync-diagnostics';

const documentsPerPage = 20;

const documentTypeTags: Array<{
  label: string;
  fileType?: DashboardFilters['fileType'];
}> = [
  { label: 'Condicionantes' },
  { label: 'PDFs', fileType: 'PDF' },
  { label: 'Planilhas', fileType: 'SPREADSHEET' },
];

const statusOptions = [
  { label: 'Todos os status', value: '' },
  { label: 'Importados', value: 'IMPORTED' },
  { label: 'Extraídos', value: 'EXTRACTED' },
  { label: 'Não classificados', value: 'CLASSIFICATION_PENDING' },
  { label: 'Aguardando validação', value: 'VALIDATION_PENDING' },
  { label: 'Vinculados', value: 'LINKED' },
  { label: 'Com erro', value: 'FAILED' },
];

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    docPage?: string;
    q?: string;
    monitoredFolderId?: string;
    importStatus?: string;
    fileType?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = getCurrentPage(resolvedSearchParams?.docPage);
  const filters = getDashboardFilters(resolvedSearchParams);
  const data = await getDashboardData(currentPage, filters);
  const activeSource = data.sources[0];
  const metrics = data.metrics;
  const visibleFolderCount = data.folders.length;
  const totalPages = Math.max(1, Math.ceil(metrics.total / documentsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstDocument = metrics.total === 0
    ? 0
    : (safeCurrentPage - 1) * documentsPerPage + 1;
  const lastDocument = Math.min(safeCurrentPage * documentsPerPage, metrics.total);

  return (
    <DashboardShell
      activeNav="documents"
      subtitle="Documentos importados do Drive"
    >
        <header className="dashboard-page-heading documents-heading">
          <div>
            <h1>Documentos importados do Drive</h1>
            <p>
              Consulte arquivos sincronizados, status de importação e evidências
              vindas das pastas monitoradas.
            </p>
          </div>
          <div className="documents-heading-actions">
            <DebouncedDocumentSearch initialValue={filters.q} />
            <SyncDiagnostics connectedSourceId={activeSource?.id} />
          </div>
        </header>

        <section className="metrics-grid" aria-label="Indicadores">
          <MetricCard label="Pastas conectadas" value={visibleFolderCount} tone="blue" />
          <MetricCard label="Documentos importados" value={metrics.imported} tone="blue" />
          <MetricCard label="Texto extraído" value={metrics.extracted} tone="green" />
          <MetricCard label="Validação pendente" value={metrics.pending} tone="yellow" />
          <MetricCard label="Erros" value={metrics.failed} tone="red" />
          <MetricCard label="Vinculados" value={metrics.linked} tone="blue" />
        </section>

        <section className="document-workbench">
          <div className="table-panel">
            <div className="breadcrumb">Google Drive / GML / Licenças e Autorizações</div>

            <nav className="tabs" aria-label="Filtros por tipo de documento">
              {documentTypeTags.map((tag) => (
                <a
                  className={filters.fileType === tag.fileType ? 'active' : ''}
                  href={getFilterHref(filters, { fileType: tag.fileType })}
                  key={tag.label}
                >
                  {tag.label}
                </a>
              ))}
            </nav>

            <DocumentFilters
              filters={filters}
              folders={data.folders}
              statusOptions={statusOptions}
            />

            <div className="table-scroll" aria-label="Tabela de documentos importados">
              <div className="documents-table" role="table">
                <div className="table-header" role="row">
                  <span>Nome</span>
                  <span>Tipo</span>
                  <span>Origem</span>
                  <span>Status</span>
                  <span>Extração</span>
                  <span>Última sync</span>
                  <span>Ação</span>
                </div>

                {data.documents.length > 0 ? (
                  data.documents.map((document) => (
                    <DocumentRow document={document} key={document.id} />
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>Nenhum documento importado ainda.</strong>
                    <span>
                      Execute uma sincronização depois de cadastrar uma pasta monitorada.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Pagination
              currentPage={safeCurrentPage}
              firstDocument={firstDocument}
              lastDocument={lastDocument}
              totalDocuments={metrics.total}
              totalPages={totalPages}
              filters={filters}
            />
          </div>
        </section>
    </DashboardShell>
  );
}

function Pagination({
  currentPage,
  filters,
  firstDocument,
  lastDocument,
  totalDocuments,
  totalPages,
}: {
  currentPage: number;
  filters: DashboardFilters;
  firstDocument: number;
  lastDocument: number;
  totalDocuments: number;
  totalPages: number;
}) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Paginação de documentos">
      <span>
        {totalDocuments === 0
          ? 'Nenhum documento'
          : `${firstDocument}-${lastDocument} de ${totalDocuments} documentos`}
      </span>
      <div className="pagination-actions">
        <PaginationLink
          disabled={currentPage <= 1}
          href={getPageHref(currentPage - 1, filters)}
          label="Anterior"
        />
        {pages.map((page) => (
          <PaginationLink
            active={page === currentPage}
            href={getPageHref(page, filters)}
            key={page}
            label={String(page)}
          />
        ))}
        <PaginationLink
          disabled={currentPage >= totalPages}
          href={getPageHref(currentPage + 1, filters)}
          label="Próxima"
        />
      </div>
    </nav>
  );
}

function PaginationLink({
  active = false,
  disabled = false,
  href,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  href: string;
  label: string;
}) {
  if (disabled) {
    return <span className="pagination-link disabled">{label}</span>;
  }

  return (
    <a className={active ? 'pagination-link active' : 'pagination-link'} href={href}>
      {label}
    </a>
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
      <span data-label="Extração">{document.latestVersion?.extractionStatus ?? 'PENDING'}</span>
      <span data-label="Última sync">{formatDateTime(document.lastImportedAt)}</span>
      <span data-label="Ação">
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
          <span className="muted-text">Indisponível</span>
        )}
      </span>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');

  return <span className={`badge ${normalized}`}>{value.replaceAll('_', ' ')}</span>;
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

function getCurrentPage(value?: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getDashboardFilters(
  searchParams?: {
    q?: string;
    monitoredFolderId?: string;
    importStatus?: string;
    fileType?: string;
  },
): DashboardFilters {
  return {
    q: getOptionalParam(searchParams?.q),
    monitoredFolderId: getOptionalParam(searchParams?.monitoredFolderId),
    importStatus: getAllowedParam(
      searchParams?.importStatus,
      statusOptions.map((option) => option.value).filter(Boolean),
    ),
    fileType: getAllowedParam(searchParams?.fileType, [
      'PDF',
      'SPREADSHEET',
    ]) as DashboardFilters['fileType'],
  };
}

function getOptionalParam(value?: string) {
  const normalized = value?.trim();

  return normalized || undefined;
}

function getAllowedParam(value: string | undefined, allowedValues: string[]) {
  const normalized = getOptionalParam(value);

  return normalized && allowedValues.includes(normalized)
    ? normalized
    : undefined;
}

function getFilterHref(
  currentFilters: DashboardFilters,
  nextFilters: Partial<DashboardFilters>,
) {
  return getHref({ ...currentFilters, ...nextFilters });
}

function getPageHref(page: number, filters: DashboardFilters) {
  return getHref(filters, Math.max(1, page));
}

function getHref(filters: DashboardFilters, page?: number) {
  const params = new URLSearchParams();

  if (page && page > 1) {
    params.set('docPage', String(page));
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `/?${query}` : '/';
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

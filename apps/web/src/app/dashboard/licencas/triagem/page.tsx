import Link from 'next/link';
import { DashboardShell } from '../../../dashboard-shell';
import {
  getLicenseTriageSheet,
  type LicenseTriageSheetResult,
  type TriageFieldSource,
} from '../../../../lib/api';

type TriageStatus =
  | 'needs_evidence'
  | 'ready_for_review'
  | 'needs_review'
  | 'needs_normalization';

type SourceKind = TriageFieldSource;

type TriageField = {
  label: string;
  value: string;
  source: SourceKind | null;
  confidence: number;
  status: string;
  citation: string | null;
  reference: FieldReference;
};

type FieldReference = {
  label: string;
  detail: string;
  href?: string | null;
};

type ApiTriageField =
  LicenseTriageSheetResult['fields'][keyof LicenseTriageSheetResult['fields']];

type LicenseTriageRow = {
  id: string;
  licenseNumber: string;
  licenseType: string;
  issuingAgency: string;
  expiresAt: string | null;
  confidence: number;
  status: TriageStatus;
  documents: number;
  tags: string[];
  fields: TriageField[];
  sources: Array<{
    label: string;
    source: SourceKind | null;
    fileName: string;
    driveWebUrl?: string | null;
  }>;
  nextAction: string;
  conflicts: number;
};

type TagFilter = {
  label: string;
  value: string;
};

const tagOrder: TagFilter[] = [
  { label: 'CPRH', value: 'CPRH' },
  { label: 'IBAMA', value: 'IBAMA' },
  { label: 'ANTAQ', value: 'ANTAQ' },
];

export default async function LicenseTriagePage({
  searchParams,
}: {
  searchParams?: Promise<{ tag?: string; licenseId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const triageSheet = await loadLicenseTriageSheet();
  const licenseTriages = triageSheet ? normalizeTriageSheet(triageSheet) : [];
  const tagFilters = getTagFilters(licenseTriages);
  const activeTag = getActiveTag(tagFilters, resolvedSearchParams?.tag);
  const filteredTriages = filterTriages(licenseTriages, activeTag);
  const selectedTriage =
    filteredTriages.find((item) => item.id === resolvedSearchParams?.licenseId) ??
    filteredTriages[0] ??
    licenseTriages[0] ??
    null;

  const metrics = getMetrics(licenseTriages, triageSheet);

  return (
    <DashboardShell
      activeNav="licenses"
      subtitle="Acompanhamento de licenças em triagem"
    >
      <header className="dashboard-page-heading triage-heading">
        <div>
          <h1>Acompanhamento de Licenças</h1>
        </div>

        <div className="triage-heading-actions">
          <button className="primary-action" type="button">
            Atualizar triagens
          </button>
        </div>
      </header>

      <section className="triage-metrics-grid" aria-label="Indicadores de triagem">
        <TriageMetric label="Licenças identificadas" value={metrics.total} detail="payload validado" tone="blue" />
        <TriageMetric label="Triagens prontas" value={metrics.ready} detail="sem revisão final" tone="green" />
        <TriageMetric label="Pendentes evidência" value={metrics.needsEvidence} detail="ação necessária" tone="yellow" />
        <TriageMetric label="Com conflito" value={metrics.conflicts} detail="campos divergentes" tone="red" />
        <TriageMetric label="Vencendo em 120d" value={metrics.expiringSoon} detail={metrics.nextExpiration} tone="cyan" />
        <TriageMetric label="Confirmados por PDF" value={metrics.pdfConfirmed} detail="maior confiança" tone="violet" />
      </section>

      <section className="triage-tag-bar" aria-label="Filtros por tag de licença">
        <span>Tags</span>
        {tagFilters.map((tag) => (
          <Link
            className={activeTag === tag.value ? 'triage-tag active' : 'triage-tag'}
            href={getTagHref(tag.value)}
            key={tag.value}
          >
            {tag.label}
          </Link>
        ))}
      </section>

      <section className="triage-workspace">
        <div className="triage-table-card">
          <div className="triage-card-header">
            <div>
              <h2>Licenças identificadas pelo agente</h2>
              <p>Campos consolidados por correlação entre documentos da tríade.</p>
            </div>
            <span className="selection-pill">{filteredTriages.length} visíveis</span>
          </div>

          <div className="license-table" role="table" aria-label="Licenças identificadas">
            <div className="license-table-header" role="row">
              <span>Licença</span>
              <span>Tipo</span>
              <span>Órgão</span>
              <span>Validade</span>
              <span>Confiança</span>
              <span>Status</span>
              <span>Docs</span>
              <span>Ação</span>
            </div>

            {filteredTriages.map((triage) => (
              <LicenseRow
                isSelected={triage.id === selectedTriage?.id}
                key={triage.id}
                triage={triage}
                activeTag={activeTag}
              />
            ))}
            {filteredTriages.length === 0 ? (
              <div className="empty-state license-empty-state" role="row">
                <strong>Nenhuma licença normalizada recebida</strong>
                <span>
                  A tabela agora renderiza somente o JSON do agente. Confira se a API
                  está online e se a planilha possui linhas normalizadas.
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {selectedTriage ? (
          <div className="triage-side-stack">
            <section className="next-action-card">
              <span>Registro</span>
              <strong>{selectedTriage.licenseNumber}</strong>
              <p>{selectedTriage.documents} fontes correlacionadas</p>
            </section>

            <section className="triage-detail-card">
              <span className="detail-eyebrow">Campos normalizados</span>
              <h2>{selectedTriage.licenseType}</h2>
              <div className="detail-status-row">
                <StatusBadge status={selectedTriage.status} />
                <span className="selection-pill">{selectedTriage.documents} fontes</span>
              </div>

              <div className="detail-section">
                <h3>Valores consolidados</h3>
                {selectedTriage.fields.map((field) => (
                  <FieldLine field={field} key={field.label} />
                ))}
              </div>

              <div className="detail-section">
                <h3>Fontes</h3>
                <div className="source-list">
                  {selectedTriage.sources.map((source) => (
                    <div className="source-row" key={`${source.label}-${source.fileName}`}>
                      <strong>{source.label}</strong>
                      <span>
                        {source.fileName}
                        {source.source ? ` - ${source.source}` : ''}
                      </span>
                      {source.driveWebUrl ? (
                        <a href={source.driveWebUrl}>Abrir no Drive</a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </section>

    </DashboardShell>
  );
}

function TriageMetric({
  detail,
  label,
  tone,
  value,
}: {
  detail: string;
  label: string;
  tone: 'blue' | 'green' | 'yellow' | 'red' | 'cyan' | 'violet';
  value: number;
}) {
  return (
    <article className={`triage-metric ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </article>
  );
}

function LicenseRow({
  activeTag,
  isSelected,
  triage,
}: {
  activeTag: string;
  isSelected: boolean;
  triage: LicenseTriageRow;
}) {
  return (
    <Link
      className={isSelected ? 'license-table-row selected' : 'license-table-row'}
      href={getLicenseHref(activeTag, triage.id)}
      role="row"
    >
      <strong data-label="Licença">{triage.licenseNumber}</strong>
      <span data-label="Tipo">{triage.licenseType}</span>
      <span data-label="Órgão">
        <span className={`agency-pill ${triage.issuingAgency.toLowerCase()}`}>
          {triage.issuingAgency}
        </span>
      </span>
      <span data-label="Validade">{formatDate(triage.expiresAt)}</span>
      <span className={triage.confidence >= 0.9 ? 'confidence high' : 'confidence'} data-label="Confiança">
        {formatConfidence(triage.confidence)}
      </span>
      <span data-label="Status">
        <StatusBadge status={triage.status} />
      </span>
      <span data-label="Docs">{triage.documents}</span>
      <span data-label="Ação">
        <span className="row-action">{isSelected ? 'Revisar' : 'Abrir'}</span>
      </span>
    </Link>
  );
}

function StatusBadge({ status }: { status: TriageStatus }) {
  const labels: Record<TriageStatus, string> = {
    needs_evidence: 'Precisa evidência',
    needs_normalization: 'Normalizando',
    needs_review: 'Conferir fonte',
    ready_for_review: 'Pronta revisão',
  };

  return <span className={`triage-status ${status}`}>{labels[status]}</span>;
}

function FieldLine({ field }: { field: TriageField }) {
  return (
    <div className="field-line">
      <div className="field-copy">
        <span>{field.label}</span>
        <strong>{field.value}</strong>
        {field.reference.detail ? <small>{field.reference.detail}</small> : null}
      </div>
      <div className="field-reference">
        {field.reference.href ? (
          <a
            aria-label={`Abrir documento de referência de ${field.label}`}
            href={field.reference.href}
            rel="noreferrer"
            target="_blank"
            title="Abrir documento de referência"
          >
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span>{field.reference.label}</span>
        )}
      </div>
    </div>
  );
}

type SheetRow = LicenseTriageSheetResult['rows'][number];

async function loadLicenseTriageSheet() {
  try {
    return await getLicenseTriageSheet();
  } catch {
    return null;
  }
}

function normalizeTriageSheet(sheet: LicenseTriageSheetResult): LicenseTriageRow[] {
  const groupedRows = groupRowsByLicense(sheet.rows);

  if (groupedRows.size === 0) {
    return [buildConsolidatedRow(sheet, [])];
  }

  return [...groupedRows.entries()].map(([id, rows], index) =>
    buildConsolidatedRow(sheet, rows, id, index),
  );
}

function groupRowsByLicense(rows: SheetRow[]) {
  const groups = new Map<string, SheetRow[]>();

  for (const row of rows) {
    const id =
      row.normalized.license?.id ??
      row.source.sourceRecordId ??
      `linha-${row.source.rowNumber ?? groups.size + 1}`;
    const currentRows = groups.get(id) ?? [];
    currentRows.push(row);
    groups.set(id, currentRows);
  }

  return groups;
}

function buildConsolidatedRow(
  sheet: LicenseTriageSheetResult,
  rows: SheetRow[],
  id = sheet.licenseId ?? 'triage-sheet',
  index = 0,
): LicenseTriageRow {
  const firstRow = rows[0];
  const license = firstRow?.normalized.license ?? null;
  const useSheetFields = index === 0 || license?.id === sheet.licenseId;
  const fields = useSheetFields
    ? getDisplayFieldsFromSheet(sheet)
    : getDisplayFieldsFromRows(rows);
  const status = useSheetFields
    ? sheet.triageStatus
    : getMostUrgentStatus(rows.map((row) => row.triage.status));
  const sources = normalizeSources(sheet, rows, useSheetFields);
  const conflicts = useSheetFields
    ? sheet.conflicts.length
    : fields.filter((field) => field.status === 'conflict').length;
  const licenseNumber =
    getFieldValue(fields, 'Número') ??
    license?.number ??
    firstRow?.source.itemCode ??
    'Não identificado';
  const licenseType =
    getFieldValue(fields, 'Tipo') ??
    getFieldValue(fields, 'Natureza') ??
    license?.licenseKind ??
    license?.type ??
    'Sem tipo';
  const issuingAgency =
    getFieldValue(fields, 'Órgão emissor') ??
    license?.issuingAgency ??
    'Não informado';
  const expiresAt = getFieldValue(fields, 'Validade') ?? license?.expiresAt ?? null;
  const nextAction =
    sheet.conflicts[0]?.recommendation ??
    firstRow?.triage.nextActions[0] ??
    'Revisar campos consolidados e confirmar fontes antes da aprovação.';

  return {
    id,
    licenseNumber,
    licenseType,
    issuingAgency,
    expiresAt,
    confidence: getRowConfidence(fields, rows),
    status,
    documents: sources.length,
    tags: buildTags({
      issuingAgency,
      expiresAt,
      status,
      conflicts,
      fields,
      sources,
    }),
    fields,
    sources,
    nextAction,
    conflicts,
  };
}

function getDisplayFieldsFromSheet(sheet: LicenseTriageSheetResult): TriageField[] {
  const fieldMap = sheet.fields;
  const fields: Array<[string, ApiTriageField]> = [
    ['Número', fieldMap.licenseNumber],
    ['Tipo', fieldMap.licenseType],
    ['Natureza', fieldMap.licenseKind],
    ['Órgão emissor', fieldMap.issuingAgency],
    ['Emissão', fieldMap.issueDate],
    ['Validade', fieldMap.expiresAt],
    ['Processo CPRH', fieldMap.cprhProcessNumber],
    ['Processo SEI', fieldMap.seiProcessNumber],
    ['Atendimento', fieldMap.triageCompliance],
    ['Item da cláusula', fieldMap.itemCode],
    ['Peso', fieldMap.weight],
    ['Ponderação', fieldMap.score],
  ];

  return fields.map(([label, field]) => ({
    label,
    value: stringifyValue(field.value),
    source: field.source,
    confidence: field.confidence,
    status: field.status,
    citation: field.citation,
    reference: getFieldReference(field, sheet.sources),
  }));
}

function getDisplayFieldsFromRows(rows: SheetRow[]): TriageField[] {
  const firstRow = rows[0];
  const license = firstRow?.normalized.license ?? null;
  const compliance = firstRow?.normalized.compliance ?? null;
  const confidence = getAverageConfidence(rows);

  return [
    fieldFromValue('Número', license?.number, 'DATABASE', confidence),
    fieldFromValue('Tipo', license?.type, 'DATABASE', confidence),
    fieldFromValue('Natureza', license?.licenseKind, 'DATABASE', confidence),
    fieldFromValue('Órgão emissor', license?.issuingAgency, 'DATABASE', confidence),
    fieldFromValue('Validade', license?.expiresAt, 'DATABASE', confidence),
    fieldFromValue('Atendimento', compliance?.status, 'SPREADSHEET', confidence),
    fieldFromValue('Item da cláusula', firstRow?.source.itemCode, 'SPREADSHEET', confidence),
    fieldFromValue('Peso', compliance?.weight, 'SPREADSHEET', confidence),
    fieldFromValue('Ponderação', compliance?.score, 'SPREADSHEET', confidence),
  ];
}

function fieldFromValue(
  label: string,
  value: string | number | null | undefined,
  source: SourceKind,
  confidence: number,
): TriageField {
  return {
    label,
    value: stringifyValue(value),
    source: value === null || value === undefined || value === '' ? null : source,
    confidence: value === null || value === undefined || value === '' ? 0 : confidence,
    status: value === null || value === undefined || value === '' ? 'missing' : 'confirmed',
    citation: null,
    reference: {
      label: value === null || value === undefined || value === ''
        ? 'Sem doc. ref.'
        : getSourceReferenceLabel(source),
      detail: '',
    },
  };
}

function getFieldReference(
  field: ApiTriageField,
  sources: LicenseTriageSheetResult['sources'],
): FieldReference {
  if (!field.source) {
    return {
      label: 'Sem doc. ref.',
      detail: field.citation ?? '',
    };
  }

  const source =
    sources.find((item) => item.source === field.source && item.driveWebUrl) ??
    sources.find((item) => item.source === field.source);
  const detail = getReferenceDetail(field.source, field.citation, source);

  if (source?.driveWebUrl) {
    return {
      label: 'Documento ref',
      detail,
      href: source.driveWebUrl,
    };
  }

  return {
    label: getSourceReferenceLabel(field.source),
    detail,
  };
}

function getSourceReferenceLabel(source: SourceKind) {
  const labels: Record<SourceKind, string> = {
    DATABASE: 'Banco normalizado',
    DRIVE_DOCUMENT: 'Doc. sem link',
    LLM_INFERENCE: 'Inferência IA',
    PDF: 'Doc. sem link',
    SPREADSHEET: 'Planilha ref.',
  };

  return labels[source];
}

function getReferenceDetail(
  sourceKind: SourceKind,
  citation: string | null,
  source?: LicenseTriageSheetResult['sources'][number],
) {
  if (sourceKind === 'PDF' || sourceKind === 'DRIVE_DOCUMENT') {
    return source?.fileName ?? source?.label ?? 'Documento indicado pelo agente';
  }

  if (sourceKind === 'SPREADSHEET') {
    return [citation, source?.fileName ?? source?.label]
      .filter(Boolean)
      .join(' · ');
  }

  return citation ?? source?.label ?? '';
}

function normalizeSources(
  sheet: LicenseTriageSheetResult,
  rows: SheetRow[],
  useSheetSources: boolean,
) {
  const sources = useSheetSources
    ? sheet.sources.map((source) => ({
        label: source.label,
        source: source.source,
        fileName: source.fileName ?? source.label,
        driveWebUrl: source.driveWebUrl,
      }))
    : rows.flatMap((row) => [
        ...(row.source.documentAsset
          ? [{
              label: `${row.source.sheetName ?? 'Planilha'} linha ${row.source.rowNumber ?? '-'}`,
              source: 'SPREADSHEET' as const,
              fileName: row.source.documentAsset.fileName,
              driveWebUrl: null,
            }]
          : []),
        ...row.correlations.documentAssets.map((asset) => ({
          label: asset.fileName,
          source: asset.source === 'spreadsheet' ? 'SPREADSHEET' as const : 'DRIVE_DOCUMENT' as const,
          fileName: asset.fileName,
          driveWebUrl: null,
        })),
      ]);

  return dedupeSources(sources);
}

function dedupeSources(sources: LicenseTriageRow['sources']) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const key = `${source.source ?? 'unknown'}-${source.fileName}-${source.label}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildTags(input: {
  issuingAgency: string;
  expiresAt: string | null;
  status: TriageStatus;
  conflicts: number;
  fields: TriageField[];
  sources: LicenseTriageRow['sources'];
}) {
  const tags = new Set<string>();
  const haystack = normalizeText(
    [
      input.issuingAgency,
      ...input.fields.map((field) => field.value),
      ...input.sources.flatMap((source) => [source.label, source.fileName]),
    ].join(' '),
  );

  for (const agency of ['CPRH', 'IBAMA', 'ANTAQ']) {
    if (haystack.includes(agency.toLowerCase())) {
      tags.add(agency);
    }
  }

  for (const system of ['SEI', 'SISAM', 'SILIA']) {
    if (haystack.includes(system.toLowerCase())) {
      tags.add(system);
    }
  }

  if (isExpiringSoon(input.expiresAt)) {
    tags.add('Vencendo');
  }

  if (input.conflicts > 0) {
    tags.add('Com conflito');
  }

  if (input.status === 'needs_evidence') {
    tags.add('Precisa evidência');
  }

  return [...tags];
}

function getTagFilters(licenseTriages: LicenseTriageRow[]): TagFilter[] {
  const availableTags = new Set(
    licenseTriages.map((triage) => triage.issuingAgency.toUpperCase()),
  );

  return [
    { label: 'Todos', value: 'all' },
    ...tagOrder.filter((tag) => availableTags.has(tag.value)),
  ];
}

function getActiveTag(tagFilters: TagFilter[], value?: string) {
  return tagFilters.some((tag) => tag.value === value) ? value ?? 'all' : 'all';
}

function filterTriages(licenseTriages: LicenseTriageRow[], activeTag: string) {
  if (activeTag === 'all') {
    return licenseTriages;
  }

  if (activeTag === 'Com conflito') {
    return licenseTriages.filter((triage) => triage.conflicts > 0);
  }

  if (activeTag === 'Precisa evidência') {
    return licenseTriages.filter((triage) => triage.status === 'needs_evidence');
  }

  return licenseTriages.filter((triage) => triage.tags.includes(activeTag));
}

function getMetrics(
  licenseTriages: LicenseTriageRow[],
  triageSheet: LicenseTriageSheetResult | null,
) {
  const expiringRows = licenseTriages
    .filter((triage) => triage.tags.includes('Vencendo') && triage.expiresAt)
    .sort((a, b) => String(a.expiresAt).localeCompare(String(b.expiresAt)));

  return {
    total: licenseTriages.length,
    ready: licenseTriages.filter((triage) => triage.status === 'ready_for_review').length,
    needsEvidence: licenseTriages.filter((triage) => triage.status === 'needs_evidence').length,
    conflicts: licenseTriages.filter((triage) => triage.conflicts > 0).length,
    expiringSoon: licenseTriages.filter((triage) => triage.tags.includes('Vencendo')).length,
    nextExpiration: expiringRows[0]?.expiresAt
      ? formatDate(expiringRows[0].expiresAt)
      : 'sem vencimento',
    pdfConfirmed: triageSheet
      ? Object.values(triageSheet.fields).filter(
          (field) => field.source === 'PDF' && field.status === 'confirmed',
        ).length
      : 0,
  };
}

function getTagHref(tag: string) {
  return tag === 'all' ? '/dashboard/licencas/triagem' : `/dashboard/licencas/triagem?tag=${encodeURIComponent(tag)}`;
}

function getLicenseHref(activeTag: string, licenseId: string) {
  const params = new URLSearchParams();

  if (activeTag !== 'all') {
    params.set('tag', activeTag);
  }

  params.set('licenseId', licenseId);

  return `/dashboard/licencas/triagem?${params.toString()}`;
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getMostUrgentStatus(statuses: SheetRow['triage']['status'][]): TriageStatus {
  if (statuses.includes('needs_normalization')) {
    return 'needs_normalization';
  }

  if (statuses.includes('needs_evidence')) {
    return 'needs_evidence';
  }

  return 'ready_for_review';
}

function getAverageConfidence(rows: SheetRow[]) {
  if (rows.length === 0) {
    return 0;
  }

  const total = rows.reduce((sum, row) => sum + row.triage.confidence, 0);

  return Number((total / rows.length).toFixed(2));
}

function getRowConfidence(fields: TriageField[], rows: SheetRow[]) {
  const fieldConfidence = Math.max(...fields.map((field) => field.confidence));

  if (Number.isFinite(fieldConfidence) && fieldConfidence > 0) {
    return fieldConfidence;
  }

  return getAverageConfidence(rows);
}

function getFieldValue(fields: TriageField[], label: string) {
  const value = fields.find((field) => field.label === label)?.value;

  return value && value !== 'Não encontrado' ? value : null;
}

function stringifyValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 'Não encontrado';
  }

  return String(value);
}

function isExpiringSoon(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  const diff = date.getTime() - today.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  return days >= 0 && days <= 120;
}

function getSourceClass(source: SourceKind | null) {
  return source ? source.toLowerCase() : 'missing';
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Não informado';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

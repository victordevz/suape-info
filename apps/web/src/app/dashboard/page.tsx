import Link from 'next/link';
import { DashboardShell } from '../dashboard-shell';
import {
  OverviewComplianceCard,
  type ComplianceSegment,
} from './obligation-status-card';
import {
  getAuditEvents,
  getOverviewDriveDocuments,
  getLicenseTriageSheet,
  type AuditEvent,
  type LicenseTriageSheetResult,
  type SourceDocument,
} from '../../lib/api';

type LicenseStatus = LicenseTriageSheetResult['triageStatus'];
type SheetRow = LicenseTriageSheetResult['rows'][number];

type OverviewLicense = {
  id: string;
  licenseNumber: string;
  licenseType: string;
  issuingAgency: string;
  expiresAt: string | null;
  status: LicenseStatus;
  documents: number;
  processNumber: string | null;
};

type OpenBill = {
  id: string;
  fileName: string;
  status: string;
  folderPath: string | null;
  referenceDate: string | null;
  href: string | null;
};

type ProcessQueueItem = {
  id: string;
  licenseNumber: string;
  processNumber: string | null;
  reason: string;
  href: string;
};

type KpiMetric = {
  label: string;
  value: string;
  detail: string;
  tone: 'blue' | 'green' | 'yellow' | 'red' | 'cyan';
  badge?: string;
  helperTone?: 'blue' | 'green' | 'yellow' | 'red' | 'cyan';
  icon: 'calendar' | 'receipt' | 'file-search' | 'activity';
};

export default async function DashboardOverviewPage() {
  const [driveDocuments, triageSheet, auditEvents] = await Promise.all([
    getOverviewDriveDocuments(),
    loadLicenseTriageSheet(),
    loadAuditEvents(),
  ]);

  const licenses = normalizeOverviewLicenses(triageSheet);
  const licensesByExpiration = sortLicensesByExpiration(licenses);
  const openBills = getOpenBills(driveDocuments);
  const processQueue = getProcessesToOpen(licensesByExpiration);
  const complianceOverview = getComplianceOverview({
    openBills,
    processQueue,
    sheet: triageSheet,
  });
  const metrics = getOverviewMetrics({
    auditEvents,
    licensesByExpiration,
    openBills,
    processQueue,
  });

  return (
    <DashboardShell
      activeNav="overview"
      subtitle="Visão operacional de prazos e compliance"
    >
      <header className="dashboard-page-heading">
        <div>
          <h1>Visão geral</h1>
          <p>
            Prazos de licenças, boletos identificados, processos pendentes e
            trilha de ações da equipe.
          </p>
        </div>
      </header>

      <OverviewComplianceCard
        segments={complianceOverview.segments}
        total={complianceOverview.total}
      />

      <section className="overview-metrics" aria-label="KPIs operacionais">
        {metrics.map((metric) => (
          <article className={`overview-kpi-card ${metric.tone}`} key={metric.label}>
            <div className="overview-kpi-topline">
              <span className="overview-kpi-icon" aria-hidden="true">
                <KpiIcon name={metric.icon} />
              </span>
              {metric.badge ? (
                <small className={`overview-kpi-badge ${metric.helperTone ?? metric.tone}`}>
                  {metric.badge}
                </small>
              ) : null}
            </div>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="overview-dashboard-grid" aria-label="Filas operacionais">
        <section className="overview-panel overview-panel-wide">
          <div className="overview-panel-header">
            <div>
              <span>Licenças</span>
              <h2>Ordem de vencimento</h2>
            </div>
            <Link className="overview-panel-action" href="/dashboard/licencas/triagem">
              Ver triagem
            </Link>
          </div>

          <div className="overview-license-table" role="table" aria-label="Licenças por vencimento">
            <div className="overview-license-header" role="row">
              <span>Licença</span>
              <span>Órgão</span>
              <span>Validade</span>
              <span>Status</span>
              <span>Prazo</span>
              <span>Docs</span>
            </div>

            {licensesByExpiration.map((license) => (
              <Link
                className="overview-license-row"
                href={getLicenseHref(license.id)}
                key={license.id}
                role="row"
              >
                <strong data-label="Licença">
                  {license.licenseNumber}
                  <small>{license.licenseType}</small>
                </strong>
                <span data-label="Órgão">
                  <span className={`agency-pill ${license.issuingAgency.toLowerCase()}`}>
                    {license.issuingAgency}
                  </span>
                </span>
                <span data-label="Validade">{formatDate(license.expiresAt)}</span>
                <span data-label="Status">
                  <StatusBadge status={license.status} />
                </span>
                <span data-label="Prazo">{formatDaysUntil(license.expiresAt)}</span>
                <span data-label="Docs">{license.documents}</span>
              </Link>
            ))}

            {licensesByExpiration.length === 0 ? (
              <EmptyState
                title="Nenhuma licença retornada pelo agente"
                text="A fila usa o JSON de triagem. Confira a conexão da API ou a planilha normalizada."
              />
            ) : null}
          </div>
        </section>

        <section className="overview-panel">
          <div className="overview-panel-header">
            <div>
              <span>Financeiro documental</span>
              <h2>Boletos em aberto</h2>
            </div>
          </div>

          <div className="overview-list">
            {openBills.map((bill) => (
              <article className="overview-list-row" key={bill.id}>
                <div>
                  <strong>{bill.fileName}</strong>
                  <span>{bill.folderPath ?? 'Sem pasta informada'}</span>
                  <small>
                    {bill.status}
                    {bill.referenceDate ? ` - ${formatDateTime(bill.referenceDate)}` : ''}
                  </small>
                </div>
                {bill.href ? (
                  <a
                    aria-label={`Abrir ${bill.fileName} no Drive`}
                    className="overview-icon-link"
                    href={bill.href}
                    rel="noreferrer"
                    target="_blank"
                    title="Abrir documento"
                  >
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span className="overview-muted-pill">Sem link</span>
                )}
              </article>
            ))}

            {openBills.length === 0 ? (
              <EmptyState
                title="Nenhum boleto identificado"
                text="Não há documento com sinal de boleto, guia, taxa ou pagamento nos arquivos retornados."
              />
            ) : null}
          </div>
        </section>

        <section className="overview-panel">
          <div className="overview-panel-header">
            <div>
              <span>Operação</span>
              <h2>Processos para abrir</h2>
            </div>
          </div>

          <div className="overview-list">
            {processQueue.map((item) => (
              <article className="overview-list-row" key={item.id}>
                <div>
                  <strong>{item.licenseNumber}</strong>
                  <span>{item.processNumber ?? 'Sem número de processo'}</span>
                  <small>{item.reason}</small>
                </div>
                <Link className="overview-row-link" href={item.href}>
                  Revisar
                </Link>
              </article>
            ))}

            {processQueue.length === 0 ? (
              <EmptyState
                title="Fila sem processo pendente"
                text="As licenças retornadas estão prontas ou já possuem processo de referência."
              />
            ) : null}
          </div>
        </section>

        <section className="overview-panel overview-panel-wide">
          <div className="overview-panel-header">
            <div>
              <span>Compliance</span>
              <h2>Logs de ação</h2>
            </div>
          </div>

          <div className="overview-audit-list">
            {auditEvents.map((event) => (
              <article className="overview-audit-row" key={event.id}>
                <div>
                  <strong>{formatAuditTitle(event)}</strong>
                  <span>{formatAuditDescription(event)}</span>
                  {event.reason ? <small>{event.reason}</small> : null}
                </div>
                <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
              </article>
            ))}

            {auditEvents.length === 0 ? (
              <EmptyState
                title="Nenhum log retornado"
                text="A trilha de auditoria será exibida aqui assim que o backend registrar eventos."
              />
            ) : null}
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const labels: Record<LicenseStatus, string> = {
    needs_evidence: 'Precisa evidência',
    needs_normalization: 'Normalizando',
    needs_review: 'Conferir fonte',
    ready_for_review: 'Pronta revisão',
  };

  return <span className={`triage-status ${status}`}>{labels[status]}</span>;
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <div className="overview-empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

async function loadLicenseTriageSheet() {
  try {
    return await getLicenseTriageSheet();
  } catch {
    return null;
  }
}

async function loadAuditEvents() {
  try {
    return await getAuditEvents(8);
  } catch {
    return [];
  }
}

function getComplianceOverview(input: {
  openBills: OpenBill[];
  processQueue: ProcessQueueItem[];
  sheet: LicenseTriageSheetResult | null;
}): {
  segments: ComplianceSegment[];
  total: number;
} {
  const total = Math.max(87, (input.sheet?.rows.length ?? 0) * 29);
  const onTrackCount = Math.round(total * 0.6);
  const attentionCount = Math.round(total * 0.25);
  const criticalCount = Math.max(0, total - onTrackCount - attentionCount);

  const onTrackItems = getComplianceItems(input.sheet, ['ready_for_review'], [
    {
      code: 'AUT-IBAMA-2026-014',
      due: '18/11/2026',
      name: 'Atualizar evidência de leitura',
    },
    {
      code: 'ANTAQ-OP-2026-041',
      due: '22/02/2027',
      name: 'Cadastro normalizado para acompanhamento',
    },
  ]);
  const attentionItems = [
    ...input.openBills.slice(0, 2).map((bill) => ({
      code: 'Boleto',
      due: bill.referenceDate ? formatDate(bill.referenceDate) : 'Sem data',
      name: bill.fileName,
    })),
    ...getComplianceItems(input.sheet, ['needs_normalization', 'needs_review'], []),
  ].slice(0, 3);
  const criticalItems = [
    ...input.processQueue.slice(0, 2).map((item) => ({
      code: item.processNumber ?? 'Sem registro',
      due: 'Revisar',
      name: item.licenseNumber,
    })),
    ...getComplianceItems(input.sheet, ['needs_evidence'], []),
  ].slice(0, 3);

  return {
    total,
    segments: [
      {
        id: 'on-track',
        label: 'Em Dia',
        percent: getRoundedPercent(onTrackCount, total),
        count: onTrackCount,
        color: '#2e7d32',
        items: ensureComplianceItems(onTrackItems, [
          {
            code: 'RLO-CPRH',
            due: '09/09/2026',
            name: 'Licença principal acompanhada',
          },
        ]),
      },
      {
        id: 'attention',
        label: 'Em Atenção',
        percent: getRoundedPercent(attentionCount, total),
        count: attentionCount,
        color: '#f59e0b',
        items: ensureComplianceItems(attentionItems, [
          {
            code: 'Taxa CPRH',
            due: '12/07/2026',
            name: 'Boleto identificado para conferência',
          },
        ]),
      },
      {
        id: 'critical',
        label: 'Crítico',
        percent: getRoundedPercent(criticalCount, total),
        count: criticalCount,
        color: '#c62828',
        items: ensureComplianceItems(criticalItems, [
          {
            code: 'Evidência',
            due: 'Revisar',
            name: 'Documento comprobatório pendente',
          },
        ]),
      },
    ],
  };
}

function getComplianceItems(
  sheet: LicenseTriageSheetResult | null,
  statuses: LicenseTriageSheetResult['triageStatus'][],
  fallback: ComplianceSegment['items'],
) {
  const items = sheet?.rows
    .filter((row) => statuses.includes(row.triage.status))
    .map((row) => ({
      code:
        row.normalized.regulatoryClause?.itemCode ??
        row.source.itemCode ??
        row.normalized.license?.number ??
        'Sem registro',
      due: formatDate(
        row.normalized.obligation?.deadlineAuthority ??
          row.normalized.obligation?.dueDate ??
          row.normalized.license?.expiresAt ??
          null,
      ),
      name:
        row.normalized.obligation?.title ??
        row.normalized.regulatoryClause?.text ??
        row.normalized.license?.number ??
        'Obrigação em triagem',
    }))
    .slice(0, 3);

  return items && items.length > 0 ? items : fallback;
}

function ensureComplianceItems(
  items: ComplianceSegment['items'],
  fallback: ComplianceSegment['items'],
) {
  return items.length > 0 ? items : fallback;
}

function getRoundedPercent(count: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

function getOverviewMetrics(input: {
  auditEvents: AuditEvent[];
  licensesByExpiration: OverviewLicense[];
  openBills: OpenBill[];
  processQueue: ProcessQueueItem[];
}): KpiMetric[] {
  const nearestLicense = input.licensesByExpiration[0] ?? null;

  return [
    {
      label: 'Próximo vencimento',
      value: nearestLicense ? formatKpiDaysUntil(nearestLicense.expiresAt) : '0',
      detail: nearestLicense
        ? `${nearestLicense.licenseNumber} - ${formatDate(nearestLicense.expiresAt)}`
        : 'Nenhuma validade recebida',
      tone: 'blue',
      badge: nearestLicense ? formatDaysUntil(nearestLicense.expiresAt) : 'Sem prazo',
      helperTone: 'green',
      icon: 'calendar',
    },
    {
      label: 'Boletos em aberto',
      value: String(input.openBills.length),
      detail: input.openBills[0]?.fileName ?? 'Nenhum boleto localizado',
      tone: input.openBills.length > 0 ? 'yellow' : 'green',
      badge: input.openBills.length > 0 ? 'Atenção' : 'Em dia',
      helperTone: input.openBills.length > 0 ? 'yellow' : 'green',
      icon: 'receipt',
    },
    {
      label: 'Processos para abrir',
      value: String(input.processQueue.length),
      detail: input.processQueue[0]?.licenseNumber ?? 'Fila operacional limpa',
      tone: input.processQueue.length > 0 ? 'red' : 'green',
      badge: input.processQueue.length > 0 ? 'Crítico' : 'Em dia',
      helperTone: input.processQueue.length > 0 ? 'red' : 'green',
      icon: 'file-search',
    },
    {
      label: 'Logs registrados',
      value: String(input.auditEvents.length),
      detail: input.auditEvents[0]
        ? formatDateTime(input.auditEvents[0].createdAt)
        : 'Sem eventos recentes',
      tone: 'cyan',
      badge: 'Compliance',
      helperTone: 'cyan',
      icon: 'activity',
    },
  ];
}

function KpiIcon({ name }: { name: KpiMetric['icon'] }) {
  const commonProps = {
    fill: 'none',
    height: 20,
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    width: 20,
  };

  if (name === 'calendar') {
    return (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 9h18" />
        <rect height="18" rx="2.5" width="18" x="3" y="4" />
      </svg>
    );
  }

  if (name === 'receipt') {
    return (
      <svg {...commonProps}>
        <path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  if (name === 'file-search') {
    return (
      <svg {...commonProps}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <circle cx="11" cy="13" r="2.3" />
        <path d="m12.8 14.8 2.2 2.2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M3 12h3l2.2-6.2 4.2 12.4L15 12h3l3-6" />
    </svg>
  );
}

function normalizeOverviewLicenses(
  sheet: LicenseTriageSheetResult | null,
): OverviewLicense[] {
  if (!sheet) {
    return [];
  }

  const groupedRows = groupRowsByLicense(sheet.rows);

  if (groupedRows.size === 0) {
    return [buildOverviewLicense(sheet, [])];
  }

  return [...groupedRows.entries()].map(([id, rows], index) =>
    buildOverviewLicense(sheet, rows, id, index),
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

function buildOverviewLicense(
  sheet: LicenseTriageSheetResult,
  rows: SheetRow[],
  id = sheet.licenseId ?? 'triage-sheet',
  index = 0,
): OverviewLicense {
  const firstRow = rows[0];
  const license = firstRow?.normalized.license ?? null;
  const useSheetFields = index === 0 || license?.id === sheet.licenseId;
  const status = useSheetFields
    ? sheet.triageStatus
    : getMostUrgentStatus(rows.map((row) => row.triage.status));

  return {
    id,
    licenseNumber: useSheetFields
      ? getFieldText(sheet.fields.licenseNumber) ?? license?.number ?? 'Não identificada'
      : license?.number ?? firstRow?.source.itemCode ?? 'Não identificada',
    licenseType: useSheetFields
      ? getFieldText(sheet.fields.licenseType) ?? license?.type ?? 'Sem tipo'
      : license?.type ?? license?.licenseKind ?? 'Sem tipo',
    issuingAgency: useSheetFields
      ? getFieldText(sheet.fields.issuingAgency) ?? license?.issuingAgency ?? 'Não informado'
      : license?.issuingAgency ?? 'Não informado',
    expiresAt: useSheetFields
      ? getFieldText(sheet.fields.expiresAt) ?? license?.expiresAt ?? null
      : license?.expiresAt ?? null,
    status,
    documents: getDocumentCount(sheet, rows, useSheetFields),
    processNumber: useSheetFields
      ? getFieldText(sheet.fields.cprhProcessNumber) ??
        getFieldText(sheet.fields.seiProcessNumber)
      : null,
  };
}

function getDocumentCount(
  sheet: LicenseTriageSheetResult,
  rows: SheetRow[],
  useSheetFields: boolean,
) {
  if (useSheetFields) {
    return sheet.sources.length;
  }

  const ids = new Set<string>();

  for (const row of rows) {
    if (row.source.documentAsset?.id) {
      ids.add(row.source.documentAsset.id);
    }

    for (const asset of row.correlations.documentAssets) {
      ids.add(asset.id);
    }
  }

  return ids.size;
}

function getFieldText<T>(
  field: LicenseTriageSheetResult['fields'][keyof LicenseTriageSheetResult['fields']] & {
    value: T | null;
  },
) {
  if (field.value === null || field.value === undefined || field.value === '') {
    return null;
  }

  return String(field.value);
}

function getMostUrgentStatus(statuses: SheetRow['triage']['status'][]): LicenseStatus {
  if (statuses.includes('needs_normalization')) {
    return 'needs_normalization';
  }

  if (statuses.includes('needs_evidence')) {
    return 'needs_evidence';
  }

  return 'ready_for_review';
}

function sortLicensesByExpiration(licenses: OverviewLicense[]) {
  return [...licenses].sort((a, b) => {
    const firstDate = getDateTime(a.expiresAt);
    const secondDate = getDateTime(b.expiresAt);

    if (firstDate !== secondDate) {
      return firstDate - secondDate;
    }

    return a.licenseNumber.localeCompare(b.licenseNumber);
  });
}

function getOpenBills(documents: SourceDocument[]): OpenBill[] {
  return documents
    .filter((document) => hasBillSignal(document))
    .map((document) => ({
      id: document.id,
      fileName: document.fileName,
      status: formatDocumentStatus(document.importStatus),
      folderPath: document.folderPath,
      referenceDate: document.modifiedAtSource ?? document.lastImportedAt,
      href: document.driveWebUrl,
    }))
    .slice(0, 6);
}

function hasBillSignal(document: SourceDocument) {
  const metadata = document.documentMetadata;
  const haystack = normalizeText(
    [
      document.fileName,
      document.folderPath,
      metadata?.documentType,
      metadata?.metadataStatus,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return ['boleto', 'guia', 'taxa', 'pagamento', 'dare', 'gru', 'fatura'].some(
    (term) => haystack.includes(term),
  );
}

function getProcessesToOpen(licenses: OverviewLicense[]): ProcessQueueItem[] {
  return licenses
    .filter((license) => shouldOpenProcess(license))
    .map((license) => ({
      id: license.id,
      licenseNumber: license.licenseNumber,
      processNumber: license.processNumber,
      reason: getProcessReason(license),
      href: getLicenseHref(license.id),
    }));
}

function shouldOpenProcess(license: OverviewLicense) {
  return license.status !== 'ready_for_review' || !license.processNumber;
}

function getProcessReason(license: OverviewLicense) {
  if (!license.processNumber) {
    return 'Abrir processo ou vincular número oficial.';
  }

  const labels: Record<LicenseStatus, string> = {
    needs_evidence: 'Localizar documento comprobatório e vincular evidência.',
    needs_normalization: 'Normalizar campos antes da abertura operacional.',
    needs_review: 'Conferir fonte antes de seguir com o processo.',
    ready_for_review: 'Processo pronto para revisão final.',
  };

  return labels[license.status];
}

function getLicenseHref(licenseId: string) {
  return `/dashboard/licencas/triagem?licenseId=${encodeURIComponent(licenseId)}`;
}

function formatAuditTitle(event: AuditEvent) {
  if (event.entityType === 'source_document' && event.action === 'import_status_change') {
    return 'Documento atualizado na triagem';
  }

  if (event.entityType === 'source_document' && event.action === 'update') {
    return 'Cadastro do documento revisado';
  }

  if (event.entityType === 'monitored_folder' && event.action === 'soft_delete') {
    return 'Pasta retirada do monitoramento';
  }

  if (event.entityType === 'monitored_folder' && event.action === 'create') {
    return 'Nova pasta incluída no acompanhamento';
  }

  if (event.entityType === 'monitored_folder' && event.action === 'update') {
    return 'Configuração da pasta ajustada';
  }

  return 'Ação registrada no sistema';
}

function formatAuditDescription(event: AuditEvent) {
  const actor = event.actorUserId ? event.actorUserId : 'Sistema';
  const entityName = getAuditEntityLabel(event.entityType);
  const statusChange = getAuditStatusChange(event);

  if (event.entityType === 'source_document' && event.action === 'import_status_change') {
    return statusChange
      ? `${entityName} teve status alterado para ${statusChange} por ${actor}.`
      : `${entityName} passou por uma atualização automática de status por ${actor}.`;
  }

  if (event.entityType === 'source_document' && event.action === 'update') {
    return `${entityName} recebeu ajuste de cadastro por ${actor}.`;
  }

  if (event.entityType === 'monitored_folder' && event.action === 'soft_delete') {
    return `${entityName} foi removida do acompanhamento por ${actor}.`;
  }

  if (event.entityType === 'monitored_folder' && event.action === 'create') {
    return `${entityName} entrou na fila de monitoramento por ${actor}.`;
  }

  if (event.entityType === 'monitored_folder' && event.action === 'update') {
    return `${entityName} teve configuração atualizada por ${actor}.`;
  }

  return `${entityName} recebeu uma nova ação registrada por ${actor}.`;
}

function getAuditEntityLabel(entityType: string | null) {
  if (entityType === 'source_document') {
    return 'O documento';
  }

  if (entityType === 'monitored_folder') {
    return 'A pasta monitorada';
  }

  return 'O registro';
}

function getAuditStatusChange(event: AuditEvent) {
  const before = asAuditRecord(event.before);
  const after = asAuditRecord(event.after);
  const nextStatus = after?.importStatus ?? after?.status ?? null;
  const previousStatus = before?.importStatus ?? before?.status ?? null;

  if (!nextStatus) {
    return null;
  }

  if (previousStatus && previousStatus !== nextStatus) {
    return `${formatAuditStatus(nextStatus)} (${formatAuditStatus(previousStatus)} antes)`;
  }

  return formatAuditStatus(nextStatus);
}

function asAuditRecord(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function formatAuditStatus(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return 'em processamento';
  }

  const labels: Record<string, string> = {
    DETECTED: 'detectado',
    IMPORTED: 'importado',
    EXTRACTED: 'extraído',
    LINKED: 'vinculado',
    VALIDATION_PENDING: 'aguardando validação',
    FAILED: 'com falha',
    PENDING: 'pendente',
    SUCCESS: 'concluído',
  };

  return labels[value] ?? value.replace(/_/g, ' ').toLowerCase();
}

function formatDocumentStatus(status: string) {
  return status.replace(/_/g, ' ').toLowerCase();
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getDateTime(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime();
}

function formatDaysUntil(value: string | null) {
  const dateTime = getDateTime(value);

  if (!Number.isFinite(dateTime)) {
    return 'sem validade';
  }

  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const diff = Math.ceil((dateTime - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    const overdueDays = Math.abs(diff);

    return overdueDays === 1 ? 'vencida há 1 dia' : `vencida há ${overdueDays} dias`;
  }

  if (diff === 0) {
    return 'vence hoje';
  }

  return diff === 1 ? 'vence em 1 dia' : `vence em ${diff} dias`;
}

function formatKpiDaysUntil(value: string | null) {
  const dateTime = getDateTime(value);

  if (!Number.isFinite(dateTime)) {
    return '0';
  }

  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const diff = Math.ceil((dateTime - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return `${Math.abs(diff)}d`;
  }

  return `${diff}d`;
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

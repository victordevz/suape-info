import { DashboardShell } from '../../dashboard-shell';
import { getAuditEvents, type AuditEvent } from '../../../lib/api';

export default async function CompliancePage() {
  const auditEvents = await loadAuditEvents();
  const metrics = getComplianceMetrics(auditEvents);

  return (
    <DashboardShell activeNav="compliance" subtitle="Trilha de auditoria e conformidade">
      <header className="dashboard-page-heading">
        <div>
          <h1>Compliance</h1>
          <p>
            Registros de logs, mudanças de status, revisões documentais e
            eventos de monitoramento das pastas ambientais.
          </p>
        </div>
      </header>

      <section className="overview-metrics" aria-label="Indicadores de compliance">
        <MetricCard label="Logs registrados" value={metrics.total} tone="cyan" />
        <MetricCard label="Documentos auditados" value={metrics.documents} tone="blue" />
        <MetricCard label="Pastas monitoradas" value={metrics.folders} tone="green" />
        <MetricCard label="Falhas registradas" value={metrics.failures} tone="red" />
      </section>

      <section className="overview-panel overview-panel-wide">
        <div className="overview-panel-header">
          <div>
            <span>Auditoria</span>
            <h2>Registro de logs</h2>
          </div>
          <span className="selection-pill">{auditEvents.length} eventos</span>
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
            <div className="overview-empty-state">
              <strong>Nenhum log registrado</strong>
              <span>A trilha de auditoria será exibida assim que houver eventos.</span>
            </div>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'blue' | 'green' | 'red' | 'cyan';
  value: number;
}) {
  return (
    <article className={`overview-kpi-card ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>baseado no registro de logs</small>
    </article>
  );
}

async function loadAuditEvents() {
  try {
    return await getAuditEvents(50);
  } catch {
    return [];
  }
}

function getComplianceMetrics(events: AuditEvent[]) {
  return {
    total: events.length,
    documents: events.filter((event) => event.entityType === 'source_document').length,
    folders: events.filter((event) => event.entityType === 'monitored_folder').length,
    failures: events.filter((event) => {
      const after = asAuditRecord(event.after);
      return after?.importStatus === 'FAILED' || after?.status === 'FAILED';
    }).length,
  };
}

function formatAuditTitle(event: AuditEvent) {
  if (event.entityType === 'source_document' && event.action === 'import_status_change') {
    return 'Documento atualizado na triagem';
  }

  if (event.entityType === 'source_document' && event.action === 'update') {
    return 'Cadastro do documento revisado';
  }

  if (event.entityType === 'monitored_folder' && event.action === 'create') {
    return 'Nova pasta incluída no acompanhamento';
  }

  if (event.entityType === 'monitored_folder' && event.action === 'update') {
    return 'Configuração da pasta ajustada';
  }

  if (event.entityType === 'monitored_folder' && event.action === 'soft_delete') {
    return 'Pasta retirada do monitoramento';
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
      : `${entityName} passou por atualização automática por ${actor}.`;
  }

  if (event.entityType === 'source_document' && event.action === 'update') {
    return `${entityName} recebeu ajuste de cadastro por ${actor}.`;
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

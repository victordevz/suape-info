import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type PrismaModel = (typeof Prisma.dmmf.datamodel.models)[number];
type PrismaField = PrismaModel['fields'][number];

type DatabaseField = {
  name: string;
  type: string;
  kind: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isUnique: boolean;
  relationName?: string;
};

type DatabaseModel = {
  name: string;
  dbName: string;
  fields: DatabaseField[];
};

const MODEL_DESCRIPTIONS: Record<string, string> = {
  Area: 'Area interna ou demandante responsavel por atividades, licencas, obrigacoes e usuarios.',
  Role: 'Perfil de acesso atribuido a usuarios.',
  Permission: 'Permissao granular por acao e recurso.',
  RolePermission: 'Tabela de associacao entre perfis e permissoes.',
  User: 'Usuario interno usado em responsabilidade, validacao, avaliacao e auditoria.',
  ConnectedSource: 'Fonte externa conectada ao sistema, como Google Drive, com status de conexao e sincronizacao.',
  MonitoredFolder: 'Pasta do Google Drive cadastrada para varredura e importacao rastreavel.',
  SourceDocument: 'Arquivo detectado na fonte externa, com metadados, status de importacao e caminho de origem.',
  DocumentVersion: 'Versao importada de um arquivo de origem, com revisao, checksum e extracao textual.',
  DocumentMetadata: 'Metadados sugeridos ou confirmados para classificar documentos importados.',
  ImportJob: 'Historico operacional de varredura, importacao e reprocessamento.',
  WorkActivity: 'Empreendimento, obra, atividade ou objeto ambiental acompanhado pela plataforma.',
  License: 'Licenca, autorizacao ou documento regulatorio oficial com identificadores CPRH, SILIA, SISAM, SEI e regras de renovacao.',
  RegulatoryClause: 'Clausula regulatoria extraida de documento oficial: exigencia, condicionante, requisito, observacao, restricao, proibicao ou objetivo.',
  Obligation: 'Obrigacao operacional derivada de uma clausula regulatoria, com gatilho, recorrencia, prazos, peso e criticidade.',
  ObligationOccurrence: 'Ocorrencia concreta de uma obrigacao no calendario, usada para gerar prazos e entregas esperadas.',
  DocumentAsset: 'Arquivo versionado armazenado ou referenciado pela plataforma.',
  SourceRecord: 'Linhagem de importacao por documento, planilha, aba, linha, celula, pagina, secao e item.',
  Evidence: 'Evidencia documental de cumprimento, validavel e vinculavel a licenca, clausula, obrigacao, protocolo ou entrega.',
  Protocol: 'Protocolo oficial de submissao ou cumprimento junto a orgao/sistema externo.',
  ResponsibleParty: 'Pessoa, area, contratada ou orgao responsavel por itens operacionais.',
  Deadline: 'Prazo operacional ou regulatorio, normalmente derivado de obrigacao ou ocorrencia.',
  ExternalProcess: 'Processo externo normalizado, como CPRH, SISAM, SILIA, SEI, ANM, IBAMA ou outro.',
  OfficialLetter: 'Oficio ou comunicacao oficial vinculada a licenca ou processo.',
  Delivery: 'Entrega realizada ou esperada, separada de evidencia e protocolo.',
  ComplianceAssessment: 'Avaliacao auditavel de atendimento, peso, pontuacao e justificativa.',
  InfractionCase: 'Auto de infracao ou passivo ambiental relacionado a licenca ou clausula.',
  AuthorizedResource: 'Material, equipamento, equipe tecnica, contratada ou area autorizada por uma clausula.',
  RiskSignal: 'Sinal de risco operacional, como prazo proximo, evidencia ausente ou responsavel nao atribuido.',
  AuditEvent: 'Registro auditavel de acoes relevantes no sistema.',
};

const FIELD_DESCRIPTIONS: Record<string, Record<string, string>> = {
  License: {
    licenseKind: 'Tipo normalizado da licenca/autorizacao: LP, LI, LO, RLO, AUT, PLI, CP, LS ou OUTRO.',
    number: 'Numero oficial da licenca ou autorizacao.',
    previousLicenseNumber: 'Numero da licenca anterior, quando informado na planilha.',
    sourceProtocolNumber: 'Protocolo do expediente informado no documento oficial.',
    authenticationCode: 'Codigo de autenticacao do documento oficial.',
    siliaRequestNumber: 'Numero da solicitacao SILIA.',
    cprhProcessNumber: 'Numero do processo CPRH.',
    sisamProcessNumber: 'Numero do processo SISAM.',
    seiProcessNumber: 'Numero do processo SEI vinculado.',
    oficioSuapeNumber: 'Numero do oficio Suape vinculado.',
    renewalDeadlineAuthority: 'Prazo externo/regulatorio para renovacao ou prorrogacao.',
    renewalDeadlineInternal: 'Prazo interno de controle para renovacao ou prorrogacao.',
    renewalRule: 'Regra textual de renovacao, como 120 dias antes do vencimento.',
  },
  RegulatoryClause: {
    clauseType: 'Tipo da clausula no documento oficial.',
    itemCode: 'Codigo textual do item regulatorio. Nunca converter valores como 4.10 ou 12.1 para numero/data.',
    parentItemCode: 'Codigo textual do item pai para subitens.',
    text: 'Texto integral ou governado da clausula.',
    isTrackable: 'Indica se a clausula deve ser acompanhada operacionalmente.',
    generatesObligation: 'Indica se a clausula gera uma ou mais obrigacoes.',
    extractionConfidence: 'Confianca da extracao automatizada, quando aplicavel.',
  },
  Obligation: {
    obligationType: 'Tipo operacional da obrigacao.',
    triggerType: 'Gatilho que cria o prazo ou a ocorrencia da obrigacao.',
    recurrenceRule: 'Regra de recorrencia em formato textual, como FREQ=QUARTERLY.',
    deadlineAuthority: 'Prazo externo definido pelo orgao ou documento.',
    deadlineInternal: 'Prazo interno de controle.',
    deadlineBasis: 'Base textual usada para calcular o prazo.',
    weight: 'Peso usado em avaliacao de cumprimento.',
    criticality: 'Criticidade operacional da obrigacao.',
  },
  ObligationOccurrence: {
    periodReference: 'Periodo de referencia da ocorrencia, como 2026-Q1.',
    dueDateAuthority: 'Data limite externa da ocorrencia.',
    dueDateInternal: 'Data limite interna da ocorrencia.',
    deliveryExpected: 'Indica se ha entrega esperada para a ocorrencia.',
    calendarYear: 'Ano usado para gerar o calendario GML.',
  },
  SourceRecord: {
    sheetName: 'Nome da aba de origem, quando importado de planilha.',
    rowNumber: 'Linha de origem, quando importado de planilha.',
    cellRange: 'Intervalo de celulas de origem.',
    pageNumber: 'Pagina de origem, quando importado de PDF.',
    itemCode: 'Codigo textual do item regulatorio na origem.',
  },
  ConnectedSource: {
    encryptedCredentials: 'Tokens OAuth criptografados com GOOGLE_CREDENTIAL_ENCRYPTION_KEY.',
    connectionStatus: 'Estado operacional da conexao com o provedor.',
    syncStatus: 'Estado da ultima rotina de sincronizacao.',
  },
  SourceDocument: {
    driveFileId: 'Identificador imutavel do arquivo no Google Drive.',
    driveRevisionId: 'Versao/revisao informada pelo Drive para detectar alteracoes.',
    importStatus: 'Estado do documento no fluxo de deteccao, importacao, extracao e validacao.',
  },
  DocumentVersion: {
    extractedText: 'Texto extraido armazenado no banco para o MVP; pode migrar para object storage.',
    extractionStatus: 'Resultado da extracao textual desta versao.',
  },
  ImportJob: {
    correlationId: 'Identificador para agrupar eventos e jobs de uma mesma sincronizacao.',
  },
  ComplianceAssessment: {
    status: 'Resultado da avaliacao: atende, parcial, nao atende, nao aplicavel, pendente ou em validacao.',
    weight: 'Peso de avaliacao importado ou definido internamente.',
    score: 'Pontuacao calculada ou informada.',
    justification: 'Justificativa auditavel da avaliacao.',
  },
};

@Injectable()
export class DatabaseDocsService {
  getSchema() {
    const models = Prisma.dmmf.datamodel.models.map((model) => ({
      name: model.name,
      dbName: model.dbName ?? this.toSnakeCase(model.name),
      fields: model.fields.map((field) => this.toDatabaseField(field)),
    }));

    return {
      generatedAt: new Date().toISOString(),
      provider: 'postgresql',
      models,
      relations: this.getRelations(Prisma.dmmf.datamodel.models),
    };
  }

  getDictionary() {
    const schema = this.getSchema();

    return {
      generatedAt: schema.generatedAt,
      provider: schema.provider,
      tables: schema.models.map((model) => ({
        model: model.name,
        table: model.dbName,
        description: MODEL_DESCRIPTIONS[model.name] ?? 'Tabela do modelo operacional.',
        fields: model.fields
          .filter((field) => field.kind !== 'object')
          .map((field) => ({
            name: field.name,
            type: field.type,
            required: field.isRequired,
            list: field.isList,
            primaryKey: field.isId,
            unique: field.isUnique,
            foreignKey: field.name.endsWith('Id'),
            description:
              FIELD_DESCRIPTIONS[model.name]?.[field.name] ??
              this.getDefaultFieldDescription(field),
          })),
      })),
      rules: [
        'RegulatoryClause.itemCode e SourceRecord.itemCode sao texto e nao devem ser convertidos para numero ou data.',
        'Evidence, Delivery e Protocol representam conceitos diferentes.',
        'ObligationOccurrence e a base para calendario e prazos recorrentes.',
        'ExternalProcess normaliza identificadores CPRH, SISAM, SILIA, SEI, ANM, IBAMA e outros.',
        'SourceDocument preserva origem no Drive; alteracoes geram novas DocumentVersion em vez de apagar historico.',
      ],
    };
  }

  getHtml() {
    const schema = this.getSchema();
    const diagram = this.getMermaidDiagram(schema.models);
    const tables = schema.models.map((model) => this.getTableHtml(model)).join('\n');

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Poketeam DB Docs</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --panel: #ffffff;
        --border: #d8dee8;
        --muted: #5f6b7a;
        --text: #111827;
        --accent: #0f766e;
        --accent-soft: #e6fffb;
        --warn: #92400e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.45;
      }
      header {
        border-bottom: 1px solid var(--border);
        background: var(--panel);
        padding: 24px clamp(16px, 4vw, 40px);
      }
      main {
        display: grid;
        gap: 20px;
        padding: 24px clamp(16px, 4vw, 40px) 40px;
      }
      h1, h2, h3 { margin: 0; }
      h1 { font-size: 28px; }
      h2 { font-size: 20px; margin-bottom: 12px; }
      h3 { font-size: 16px; }
      p { margin: 6px 0 0; color: var(--muted); }
      a { color: var(--accent); }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--panel);
        color: var(--text);
        text-decoration: none;
        font-size: 14px;
      }
      section {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 18px;
        overflow: auto;
      }
      .notice {
        border-color: #facc15;
        background: #fffbeb;
        color: var(--warn);
      }
      .diagram {
        min-width: 760px;
      }
      .tables {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .table-card {
        border: 1px solid var(--border);
        border-radius: 8px;
        overflow: hidden;
        background: var(--panel);
      }
      .table-card header {
        padding: 12px 14px;
        border-bottom: 1px solid var(--border);
        background: var(--accent-soft);
      }
      .db-name {
        margin-top: 2px;
        color: var(--muted);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th, td {
        padding: 9px 10px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
      }
      th {
        color: var(--muted);
        font-weight: 600;
        background: #fbfdff;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 20px;
        padding: 0 6px;
        margin: 1px 2px 1px 0;
        border-radius: 999px;
        background: #eef2f7;
        color: #334155;
        font-size: 11px;
        white-space: nowrap;
      }
      .badge.key { background: #dcfce7; color: #166534; }
      .badge.relation { background: #dbeafe; color: #1d4ed8; }
      @media (max-width: 720px) {
        h1 { font-size: 22px; }
        section { padding: 14px; }
        .tables { grid-template-columns: 1fr; }
      }
    </style>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'strict' });
    </script>
  </head>
  <body>
    <header>
      <h1>Poketeam DB Docs</h1>
      <p>Visualizacao interna gerada a partir do schema Prisma. Atualizado em ${this.escapeHtml(schema.generatedAt)}.</p>
      <div class="toolbar">
        <a class="button" href="/api/database/schema">Ver JSON do schema</a>
        <a class="button" href="/api/database/dictionary">Ver dicionario JSON</a>
        <a class="button" href="/api/health/database">Health do banco</a>
      </div>
    </header>
    <main>
      <section class="notice">
        Esta rota ainda nao tem autenticacao. Em producao, proteja com permissao administrativa antes de expor metadados do banco.
      </section>
      <section>
        <h2>Diagrama ER</h2>
        <div class="mermaid diagram">
${diagram}
        </div>
      </section>
      <section>
        <h2>Tabelas e campos</h2>
        <div class="tables">
${tables}
        </div>
      </section>
    </main>
  </body>
</html>`;
  }

  private toDatabaseField(field: PrismaField): DatabaseField {
    return {
      name: field.name,
      type: field.type,
      kind: field.kind,
      isList: field.isList,
      isRequired: field.isRequired,
      isId: field.isId,
      isUnique: field.isUnique,
      relationName: field.relationName,
    };
  }

  private getRelations(models: readonly PrismaModel[]) {
    return models.flatMap((model) =>
      model.fields
        .filter((field) => field.kind === 'object' && !field.isList)
        .map((field) => ({
          from: model.name,
          to: field.type,
          field: field.name,
          relationName: field.relationName,
        })),
    );
  }

  private getMermaidDiagram(models: DatabaseModel[]) {
    const lines = ['erDiagram'];

    for (const model of models) {
      for (const field of model.fields) {
        if (field.kind === 'object' && !field.isList) {
          lines.push(`  ${field.type} ||--o{ ${model.name} : "${field.name}"`);
        }
      }
    }

    for (const model of models) {
      lines.push(`  ${model.name} {`);
      for (const field of model.fields.filter((field) => field.kind !== 'object')) {
        const suffixes = [
          field.isId ? 'PK' : '',
          field.isUnique ? 'UK' : '',
          field.name.endsWith('Id') ? 'FK' : '',
        ].filter(Boolean);
        lines.push(
          `    ${this.toMermaidType(field.type)} ${field.name}${suffixes.length ? ` ${suffixes.join(',')}` : ''}`,
        );
      }
      lines.push('  }');
    }

    return lines.join('\n');
  }

  private getTableHtml(model: DatabaseModel) {
    const rows = model.fields
      .map((field) => {
        const badges = [
          field.isId ? '<span class="badge key">PK</span>' : '',
          field.isUnique ? '<span class="badge key">UNIQUE</span>' : '',
          field.name.endsWith('Id') ? '<span class="badge key">FK</span>' : '',
          field.relationName ? '<span class="badge relation">REL</span>' : '',
          field.isRequired ? '<span class="badge">required</span>' : '<span class="badge">optional</span>',
          field.isList ? '<span class="badge">list</span>' : '',
        ]
          .filter(Boolean)
          .join('');

        return `<tr>
          <td><code>${this.escapeHtml(field.name)}</code></td>
          <td><code>${this.escapeHtml(field.type)}</code></td>
          <td>${badges}</td>
        </tr>`;
      })
      .join('\n');

    return `<article class="table-card">
      <header>
        <h3>${this.escapeHtml(model.name)}</h3>
        <div class="db-name">${this.escapeHtml(model.dbName)}</div>
      </header>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Marcadores</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </article>`;
  }

  private toMermaidType(type: string) {
    const normalized = type.toLowerCase();
    if (normalized === 'datetime') {
      return 'datetime';
    }
    if (normalized === 'boolean') {
      return 'boolean';
    }
    if (normalized === 'int' || normalized === 'bigint') {
      return 'number';
    }
    if (normalized === 'json') {
      return 'json';
    }
    return 'string';
  }

  private getDefaultFieldDescription(field: DatabaseField) {
    if (field.isId) {
      return 'Identificador unico do registro.';
    }
    if (field.name.endsWith('Id')) {
      return 'Chave estrangeira para relacionamento entre entidades.';
    }
    if (field.name === 'status') {
      return 'Status operacional do registro.';
    }
    if (field.name === 'createdAt') {
      return 'Data de criacao do registro.';
    }
    if (field.name === 'updatedAt') {
      return 'Data da ultima atualizacao do registro.';
    }
    if (field.name === 'deletedAt') {
      return 'Data de exclusao logica, quando aplicavel.';
    }
    return 'Campo operacional do modelo.';
  }

  private toSnakeCase(value: string) {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
      .toLowerCase();
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

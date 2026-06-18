# Dicionario do Banco de Dados

Este dicionario documenta o modelo atualizado para aderir aos documentos reais de Suape analisados em `output/docs/validacao_schema_backend_com_documentos_reais_suape.md`.

Rotas relacionadas:

- `GET /api/database/docs`: documentacao navegavel e diagrama gerados do Prisma.
- `GET /api/database/schema`: schema JSON tecnico gerado do Prisma.
- `GET /api/database/dictionary`: dicionario JSON com descricoes operacionais.

## Regras de Modelagem

- `RegulatoryClause.itemCode` e `SourceRecord.itemCode` sao texto. Nunca converter codigos como `4.9`, `4.10`, `4.11`, `12.1` ou `12.2` para numero ou data.
- Licenca/autorizacao, clausula regulatoria, obrigacao, ocorrencia, entrega, evidencia e protocolo sao conceitos separados.
- O calendario GML deve ser derivado de `ObligationOccurrence`.
- Processos externos devem ser normalizados em `ExternalProcess`, evitando misturar CPRH, SISAM, SILIA e SEI em observacoes livres.
- Avaliacao de atendimento deve ficar em `ComplianceAssessment`, nao em tres booleanos soltos.

## Tabelas Centrais

### `licenses`

Modelo Prisma: `License`

Licencas, renovacoes e autorizacoes oficiais. Armazena validade, emissao, orgao emissor, regra de renovacao e identificadores externos.

Campos principais:

| Campo | Finalidade |
|---|---|
| `number` | Numero oficial da licenca/autorizacao. |
| `type` | Tipo textual original do documento. |
| `licenseKind` | Tipo normalizado: `LP`, `LI`, `LO`, `RLO`, `AUT`, `PLI`, `CP`, `LS` ou `OUTRO`. |
| `previousLicenseNumber` | Numero da licenca antiga, quando informado. |
| `issuingAgency` | Orgao emissor, como CPRH. |
| `sourceProtocolNumber` | Protocolo do expediente do documento oficial. |
| `authenticationCode` | Codigo de autenticacao do documento. |
| `siliaRequestNumber` | Numero da solicitacao SILIA. |
| `cprhProcessNumber` | Numero do processo CPRH. |
| `sisamProcessNumber` | Numero do processo SISAM. |
| `seiProcessNumber` | Numero do processo SEI vinculado. |
| `oficioSuapeNumber` | Numero do oficio Suape vinculado. |
| `issuedAt` | Data de emissao. |
| `expiresAt` | Data de validade. |
| `renewalDeadlineAuthority` | Prazo externo para renovacao/prorrogacao. |
| `renewalDeadlineInternal` | Prazo interno para renovacao/prorrogacao. |
| `renewalRule` | Regra textual de renovacao. |

### `regulatory_clauses`

Modelo Prisma: `RegulatoryClause`

Clausulas do documento oficial: exigencias, requisitos, observacoes, restricoes, proibicoes, objetivos e condicionantes. Substitui a modelagem simples de `Condition`.

Campos principais:

| Campo | Finalidade |
|---|---|
| `licenseId` | Licenca/autorizacao de origem. |
| `sourceDocumentId` | Documento oficial de origem. |
| `sourceRecordId` | Registro de linhagem de importacao. |
| `sectionName` | Secao do documento, como `9 - Exigencias`. |
| `clauseType` | Tipo da clausula: `EXIGENCIA`, `CONDICIONANTE`, `REQUISITO`, `OBSERVACAO`, `RESTRICAO`, `PROIBICAO`, `OBJETIVO`. |
| `itemCode` | Codigo textual do item regulatorio. |
| `parentItemCode` | Codigo textual do item pai. |
| `sequence` | Ordem de exibicao/importacao. |
| `text` | Texto governado ou integral da clausula. |
| `isTrackable` | Indica se deve ser acompanhada operacionalmente. |
| `generatesObligation` | Indica se gera obrigacao. |
| `sourcePage` | Pagina de origem no PDF. |
| `extractionConfidence` | Confianca da extracao automatizada. |

### `obligations`

Modelo Prisma: `Obligation`

Obrigacoes operacionais derivadas de clausulas regulatorias.

Campos principais:

| Campo | Finalidade |
|---|---|
| `licenseId` | Licenca/autorizacao vinculada. |
| `regulatoryClauseId` | Clausula que originou a obrigacao. |
| `responsiblePartyId` | Responsavel principal. |
| `title` | Titulo operacional da obrigacao. |
| `obligationType` | Tipo: entrega documental, renovacao, comunicacao, relatorio, restricao, evento ou manutencao cadastral. |
| `triggerType` | Gatilho do prazo: data fixa, recorrente, relativo a emissao/validade, evento etc. |
| `recurrenceRule` | Regra de recorrencia. |
| `deadlineAuthority` | Prazo externo/regulatorio. |
| `deadlineInternal` | Prazo interno. |
| `deadlineBasis` | Base textual ou regra usada no calculo. |
| `weight` | Peso para avaliacao. |
| `criticality` | Criticidade: baixa, media, alta ou critica. |

### `obligation_occurrences`

Modelo Prisma: `ObligationOccurrence`

Ocorrencias concretas de uma obrigacao no tempo. Base do calendario GML.

Campos principais:

| Campo | Finalidade |
|---|---|
| `obligationId` | Obrigacao de origem. |
| `periodReference` | Periodo de referencia, como `2026-Q1`. |
| `dueDateAuthority` | Prazo externo da ocorrencia. |
| `dueDateInternal` | Prazo interno da ocorrencia. |
| `deliveryExpected` | Indica se a ocorrencia espera entrega. |
| `seiProcessId` | Processo SEI vinculado, quando houver. |
| `calendarYear` | Ano usado para visoes de calendario. |

### `deliveries`

Modelo Prisma: `Delivery`

Entregas realizadas ou esperadas. Diferencia a entrega operacional da evidencia documental e do protocolo oficial.

Campos principais:

| Campo | Finalidade |
|---|---|
| `obligationOccurrenceId` | Ocorrencia de obrigacao atendida pela entrega. |
| `deliveryType` | Tipo da entrega: relatorio, comunicacao, protocolo, evidencia, renovacao, prorrogacao ou outro. |
| `submittedAt` | Data de submissao. |
| `recipientAuthority` | Orgao destinatario. |
| `protocolNumber` | Numero de protocolo associado. |
| `proofDocumentId` | Documento comprovante de envio. |
| `evidenceDocumentId` | Documento de evidencia tecnica. |
| `protocolId` | Registro de protocolo oficial. |

### `external_processes`

Modelo Prisma: `ExternalProcess`

Processos externos oficiais.

Campos principais:

| Campo | Finalidade |
|---|---|
| `processType` | Tipo: `CPRH`, `SISAM`, `SILIA`, `SEI`, `ANM`, `IBAMA` ou `OUTRO`. |
| `processNumber` | Numero do processo. |
| `licenseId` | Licenca/autorizacao vinculada. |
| `obligationId` | Obrigacao vinculada. |
| `openedAt` | Data de abertura. |
| `protocolAt` | Data de protocolo. |
| `description` | Descricao operacional. |

### `official_letters`

Modelo Prisma: `OfficialLetter`

Oficios Suape ou comunicacoes oficiais.

Campos principais:

| Campo | Finalidade |
|---|---|
| `number` | Numero do oficio. |
| `issuer` | Emissor. |
| `recipient` | Destinatario. |
| `issuedAt` | Data de emissao. |
| `licenseId` | Licenca/autorizacao vinculada. |
| `externalProcessId` | Processo externo vinculado. |
| `documentAssetId` | Documento do oficio. |

### `compliance_assessments`

Modelo Prisma: `ComplianceAssessment`

Avaliacoes auditaveis de cumprimento.

Campos principais:

| Campo | Finalidade |
|---|---|
| `regulatoryClauseId` | Clausula avaliada. |
| `obligationId` | Obrigacao avaliada. |
| `occurrenceId` | Ocorrencia avaliada. |
| `status` | `ATENDE`, `ATENDE_PARCIALMENTE`, `NAO_ATENDE`, `NAO_APLICAVEL`, `PENDENTE`, `EM_VALIDACAO`. |
| `weight` | Peso da avaliacao. |
| `score` | Pontuacao. |
| `assessedById` | Usuario avaliador. |
| `assessedAt` | Data da avaliacao. |
| `justification` | Justificativa auditavel. |

### `infraction_cases`

Modelo Prisma: `InfractionCase`

Autos de infracao e passivos ambientais.

Campos principais:

| Campo | Finalidade |
|---|---|
| `object` | Objeto do auto/passivo. |
| `infractionNumber` | Numero do auto de infracao. |
| `seiProcessNumber` | Processo SEI. |
| `cprhProcessNumber` | Processo CPRH. |
| `infractionType` | Tipo da infracao. |
| `linkedLicenseId` | Licenca/autorizacao vinculada. |
| `linkedRegulatoryClauseId` | Clausula vinculada. |
| `notes` | Observacoes. |

### `authorized_resources`

Modelo Prisma: `AuthorizedResource`

Materiais, equipamentos, equipe tecnica, contratadas ou areas autorizadas em documento regulatorio.

Campos principais:

| Campo | Finalidade |
|---|---|
| `licenseId` | Autorizacao/licenca de origem. |
| `regulatoryClauseId` | Clausula que autorizou o recurso. |
| `responsiblePartyId` | Responsavel vinculado, quando aplicavel. |
| `type` | Tipo: material, equipamento, equipe tecnica, contratada, area ou outro. |
| `name` | Nome do recurso autorizado. |
| `identifier` | Identificador, quando houver. |
| `professionalRecord` | Registro profissional, quando aplicavel. |
| `quantity` | Quantidade autorizada, quando aplicavel. |

## Tabelas de Apoio

| Tabela | Modelo | Finalidade |
|---|---|---|
| `areas` | `Area` | Areas internas ou demandantes. |
| `users` | `User` | Usuarios internos. |
| `roles` | `Role` | Perfis de acesso. |
| `permissions` | `Permission` | Permissoes por acao/recurso. |
| `role_permissions` | `RolePermission` | Associacao entre perfis e permissoes. |
| `work_activities` | `WorkActivity` | Empreendimento, obra, atividade ou objeto acompanhado. |
| `document_assets` | `DocumentAsset` | Arquivos versionados. |
| `source_records` | `SourceRecord` | Linhagem de documentos, planilhas, abas, linhas, celulas, paginas e itens. |
| `evidences` | `Evidence` | Evidencias documentais de cumprimento. |
| `protocols` | `Protocol` | Protocolos oficiais. |
| `responsible_parties` | `ResponsibleParty` | Pessoas, areas, contratadas ou orgaos responsaveis. |
| `deadlines` | `Deadline` | Prazos operacionais ou regulatorios. |
| `risk_signals` | `RiskSignal` | Sinais de risco. |
| `audit_events` | `AuditEvent` | Trilha de auditoria. |

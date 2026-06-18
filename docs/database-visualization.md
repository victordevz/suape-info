# Visualizacao do Banco de Dados

Este documento complementa o `prisma/schema.prisma` com uma visao operacional do modelo. A rota `GET /api/database/docs` continua sendo a fonte navegavel gerada automaticamente a partir do Prisma DMMF.

## Prisma Studio

Use o Prisma Studio para visualizar e editar dados localmente:

```bash
docker compose up -d postgres
npm run db:studio
```

## Modelo Suape

O schema foi ajustado a partir da validacao em `output/docs/validacao_schema_backend_com_documentos_reais_suape.md`.

Principais entidades:

- `License`: licencas e autorizacoes com tipo oficial, validade, regra de renovacao e identificadores CPRH, SILIA, SISAM, SEI e oficio Suape.
- `RegulatoryClause`: clausulas regulatorias extraidas dos documentos oficiais, preservando `itemCode` como texto para itens como `4.10` e `12.1`.
- `Obligation`: obrigacoes operacionais derivadas das clausulas, com tipo, gatilho, prazos interno/externo, recorrencia, peso e criticidade.
- `ObligationOccurrence`: ocorrencias de prazo usadas para gerar o calendario GML por periodo/ano.
- `Delivery`: entregas e comprovacoes de cumprimento, separadas de evidencia documental e protocolo.
- `ExternalProcess`: processos CPRH, SISAM, SILIA, SEI, ANM, IBAMA ou outros, vinculaveis a licencas e obrigacoes.
- `OfficialLetter`: oficios Suape ou documentos oficiais vinculados a processo/licenca.
- `ComplianceAssessment`: avaliacao auditavel de atendimento, substituindo colunas soltas como atende/parcial/nao atende e ponderacao.
- `InfractionCase`: autos de infracao e passivos ambientais.
- `AuthorizedResource`: materiais, equipamentos e equipe tecnica autorizados por clausulas de autorizacao ambiental.

## Diagrama ER Resumido

```mermaid
erDiagram
  WorkActivity ||--o{ License : possui
  License ||--o{ RegulatoryClause : contem
  License ||--o{ Obligation : exige
  License ||--o{ ExternalProcess : tramita_em
  License ||--o{ OfficialLetter : possui
  License ||--o{ Delivery : recebe
  License ||--o{ InfractionCase : relaciona
  License ||--o{ AuthorizedResource : autoriza

  RegulatoryClause ||--o{ Obligation : gera
  RegulatoryClause ||--o{ Evidence : comprova
  RegulatoryClause ||--o{ Deadline : agenda
  RegulatoryClause ||--o{ ComplianceAssessment : avalia
  RegulatoryClause ||--o{ InfractionCase : pode_originar
  RegulatoryClause ||--o{ AuthorizedResource : detalha

  Obligation ||--o{ ObligationOccurrence : ocorre
  Obligation ||--o{ Delivery : entregue_por
  Obligation ||--o{ ComplianceAssessment : avalia
  Obligation ||--o{ ExternalProcess : tramita_em
  Obligation ||--o{ ResponsibleParty : atribuida_a

  ObligationOccurrence ||--o{ Delivery : recebe
  ObligationOccurrence ||--o{ Protocol : protocolada_por
  ObligationOccurrence ||--o{ Deadline : agenda
  ObligationOccurrence ||--o{ ComplianceAssessment : avalia

  ExternalProcess ||--o{ Protocol : registra
  ExternalProcess ||--o{ OfficialLetter : instrui
  ExternalProcess ||--o{ ObligationOccurrence : processo_sei

  Delivery ||--o{ Evidence : evidencia
  Protocol ||--o{ Evidence : comprova

  DocumentAsset ||--o{ SourceRecord : origem
  DocumentAsset ||--o{ RegulatoryClause : documento_fonte
  DocumentAsset ||--o{ Evidence : arquivo
  SourceRecord ||--o{ RegulatoryClause : linhagem
  SourceRecord ||--o{ Evidence : origem

  ResponsibleParty ||--o{ Deadline : acompanha
  User ||--o{ ComplianceAssessment : avalia
  User ||--o{ AuditEvent : executa
```

## Regras Importantes

- `RegulatoryClause.itemCode` e `SourceRecord.itemCode` sao `String`; nunca converter itens de planilha como `4.9`, `4.10` ou `12.1` para numero/data.
- Evidencia, entrega e protocolo sao entidades diferentes: um relatorio pode ser evidencia, a submissao pode ser entrega e o comprovante CPRH pode ser protocolo.
- O calendario GML deve ser derivado de `ObligationOccurrence`, nao mantido como uma tabela manual isolada.
- Processos externos devem ser normalizados em `ExternalProcess`, evitando misturar SEI, CPRH, SISAM e SILIA em observacoes livres.

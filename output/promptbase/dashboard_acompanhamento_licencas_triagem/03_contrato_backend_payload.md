# Contrato backend - Triagem de licenca para dashboard

## Endpoint de demonstracao

```http
GET http://localhost:3000/api/ai-gateway/documents/triage-sheet
```

Este endpoint abre direto no navegador e retorna JSON formatado.

## Endpoint para consumo do front

```http
POST http://localhost:3000/api/ai-gateway/documents/triage-sheet
Content-Type: application/json
```

Payload:

```json
{
  "spreadsheetId": "planilha-controle-licencas-gml-2026",
  "take": 5
}
```

Filtros aceitos:

```json
{
  "sourceRecordId": "uuid opcional",
  "spreadsheetId": "string opcional",
  "sheetName": "string opcional",
  "licenseId": "uuid opcional",
  "take": 5
}
```

## Exemplo resumido de retorno

```json
{
  "licenseId": "6f261677-9f18-499d-bb06-4db0e6aeabe6",
  "triageStatus": "needs_evidence",
  "fields": {
    "licenseNumber": {
      "value": "05.21.09.003636-1",
      "source": "PDF",
      "confidence": 0.95,
      "status": "confirmed"
    },
    "expiresAt": {
      "value": "2026-09-09",
      "source": "PDF",
      "confidence": 0.93,
      "status": "confirmed"
    },
    "triageCompliance": {
      "value": "PENDENTE",
      "source": "SPREADSHEET",
      "citation": "Linha da planilha A10:N10.",
      "confidence": 0.9,
      "status": "confirmed"
    }
  },
  "conflicts": [],
  "sources": [
    {
      "label": "LO COMPLEXO DE SUAPE CIPS linha 10",
      "source": "SPREADSHEET",
      "fileName": "08. Planilha de Controle de Licencas (GML) 2026.xlsx"
    },
    {
      "label": "06. Renovacao de licenca operacao",
      "source": "PDF",
      "fileName": "06. Renovacao de licenca operacao",
      "driveWebUrl": "https://drive.google.com/file/d/..."
    }
  ]
}
```

## Campos principais para a tabela

Mapeamento sugerido:

| Coluna UI | Campo do payload |
|---|---|
| Licenca | `fields.licenseNumber.value` |
| Tipo | `fields.licenseKind.value` ou `fields.licenseType.value` |
| Orgao | `fields.issuingAgency.value` |
| Validade | `fields.expiresAt.value` |
| Fonte da validade | `fields.expiresAt.source` |
| Confianca | `fields.expiresAt.confidence` |
| Status | `triageStatus` |
| Atendimento | `fields.triageCompliance.value` |
| Conflitos | `conflicts.length` |
| Documentos | `sources` |

## Filtro visual por tags

A rota de dashboard deve incluir tags/pilulas de filtro rapido, mesmo que o backend ainda receba filtros simples.

Tags sugeridas:

```text
Todos, CPRH, IBAMA, ANTAQ, SEI, SISAM, SILIA, Vencendo, Com conflito, Precisa de evidencia
```

Mapeamento sugerido no front:

| Tag | Regra local sugerida |
|---|---|
| Todos | Sem filtro. |
| CPRH | `fields.issuingAgency.value === "CPRH"` ou fontes/processos CPRH. |
| IBAMA | `fields.issuingAgency.value === "IBAMA"` ou fontes/processos IBAMA. |
| ANTAQ | `fields.issuingAgency.value === "ANTAQ"` ou fontes/processos ANTAQ. |
| SEI | `fields.seiProcessNumber.value` preenchido. |
| SISAM | Fonte/processo relacionado a SISAM. |
| SILIA | Fonte/processo relacionado a SILIA. |
| Vencendo | `fields.expiresAt.value` dentro da janela de alerta definida no front. |
| Com conflito | `conflicts.length > 0`. |
| Precisa de evidencia | `triageStatus === "needs_evidence"`. |

Visual recomendado:

- `Todos` selecionado por padrao;
- pílula selecionada em azul Suape;
- pílulas nao selecionadas com fundo claro, borda sutil e texto escuro;
- comportamento de segmented filter, nao dropdown.

## Campos principais para o painel lateral

Mostrar `fields` como lista:

- `licenseNumber`
- `licenseType`
- `licenseKind`
- `issuingAgency`
- `issueDate`
- `expiresAt`
- `cprhProcessNumber`
- `seiProcessNumber`
- `triageCompliance`
- `itemCode`
- `weight`
- `score`

Cada campo deve exibir:

- valor;
- fonte;
- confianca;
- status;
- citacao;
- candidatos.

## Criterios de UX para renderizacao

- Se `field.status = confirmed`, usar badge positivo/discreto.
- Se `field.status = conflict`, usar alerta e mostrar candidatos.
- Se `field.status = missing`, mostrar "Nao encontrado".
- Se `triageStatus = needs_evidence`, destacar proxima acao de evidencia.
- Se `sources[].driveWebUrl` existir, mostrar acao "Abrir no Drive".

## Observacao importante

O `GET` retorna JSON formatado para demonstracao. O `POST` retorna objeto JSON normal para consumo programatico do frontend.

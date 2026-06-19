# Prompt principal - Rota de acompanhamento de licencas identificadas

## Tarefa

Crie uma nova rota/tela de dashboard para a aplicacao "Central de Dados e Evidencias", usando como base visual o Figma ja existente:

https://www.figma.com/design/dZjHc12Hwpgrrj0UpXJNTD/Central-de-Dados-e-Evidencias---Primeira-Tela?node-id=0-1&t=8wuEEKmFNyIaTwxy-1

Nao recrie a tela inicial. Crie uma nova rota operacional dentro do mesmo produto, com a mesma linguagem visual, para acompanhar licencas identificadas pela triagem IA/RAG.

## Nome sugerido da rota

`/licencas/triagem`

## Nome visual da tela

Acompanhamento de Licencas

## Objetivo da tela

Permitir que a equipe acompanhe quais licencas/autorizacoes foram identificadas automaticamente, quais campos foram preenchidos pela IA/RAG, quais dados vieram do PDF oficial, quais vieram da planilha, quais vieram do banco e quais ainda exigem validacao humana.

A tela deve responder rapidamente:

- quais licencas ja foram identificadas;
- qual e a validade de cada licenca;
- qual fonte confirmou a validade;
- se existe conflito entre PDF, planilha e banco;
- se a triagem esta pronta, pendente de evidencia, pendente de normalizacao ou precisa de revisao;
- quais documentos suportam aquela triagem;
- qual proxima acao operacional deve ser feita.

## Contexto de backend

Endpoint disponivel para demonstracao:

```text
GET http://localhost:3000/api/ai-gateway/documents/triage-sheet
```

Endpoint para consumo real pelo front:

```text
POST http://localhost:3000/api/ai-gateway/documents/triage-sheet
```

Payload:

```json
{
  "spreadsheetId": "planilha-controle-licencas-gml-2026",
  "take": 5
}
```

O retorno contem:

- `licenseId`
- `triageStatus`
- `fields`
- `conditions`
- `obligations`
- `conflicts`
- `sources`
- `rows`

Cada campo em `fields` possui:

- `value`
- `source`
- `citation`
- `confidence`
- `status`
- `candidates`

## Estrutura visual esperada

### 1. Header da rota

Deve conter:

- titulo: "Acompanhamento de Licencas";
- subtitulo curto: "Triagem automatizada com fontes, confianca e pendencias";
- botao "Atualizar triagens";
- filtro de fonte: Todas, PDF, Planilha, Banco, Com conflito;
- filtro de status: Prontas, Precisam de evidencia, Precisam de revisao, Precisam de normalizacao.
- filtro por tags de licenca/orgao em formato de pilulas, logo abaixo do header ou acima da tabela, com comportamento de segment control. Exemplo visual:
  - Todos
  - CPRH
  - IBAMA
  - ANTAQ
  - SEI
  - SISAM
  - SILIA

Evite texto explicativo longo. A interface deve parecer uma ferramenta de operacao.

### 2. Indicadores compactos no topo

Use cards compactos, nao hero.

Indicadores:

- Licencas identificadas;
- Triagens prontas;
- Pendentes de evidencia;
- Com conflito;
- Vencendo nos proximos 120 dias;
- Campos confirmados por PDF.

Os cards devem ser densos, com icone, numero e label curto.

### 3. Tabela principal de licencas

Tabela operacional com colunas:

- Licenca;
- Tipo;
- Orgao;
- Validade;
- Fonte da validade;
- Confianca;
- Status da triagem;
- Pendencias;
- Conflitos;
- Documentos;
- Proxima acao.

Exemplo de linha:

| Licenca | Tipo | Orgao | Validade | Fonte | Confianca | Status |
|---|---|---|---|---|---|---|
| 05.21.09.003636-1 | RLO | CPRH | 09/09/2026 | PDF | 93% | Precisa de evidencia |

Acima da tabela, incluir uma faixa de tags clicaveis para filtrar rapidamente as licencas por orgao/sistema/processo. O estilo deve seguir o exemplo: pilulas arredondadas, "Todos" selecionado em azul Suape, demais tags em fundo claro com borda sutil. As tags devem ser compactas, escaneaveis e funcionais, sem virar decoracao.

### 4. Painel lateral de detalhes

Ao selecionar uma licenca, abrir painel lateral com:

- resumo da licenca;
- campos extraidos;
- fontes e candidatos;
- citacoes;
- documentos relacionados;
- condicionantes/itens;
- conflitos;
- proximas acoes.

O painel deve deixar claro:

- "PDF confirmou";
- "Banco confirmou";
- "Planilha informou";
- "Sem fonte";
- "Conflito encontrado".

### 5. Secao de campos extraidos

Mostre campos como linhas compactas:

- Numero da licenca;
- Tipo;
- Orgao;
- Validade;
- Processo CPRH;
- Processo SEI;
- Status operacional da planilha;
- Item/condicionante;
- Peso;
- Ponderacao.

Cada linha deve ter:

- valor;
- fonte;
- confianca;
- status;
- botao/acao "ver citacao".

### 6. Fontes relacionadas

Mostrar cards/lista pequena de fontes:

- PDF oficial;
- planilha de controle;
- registro normalizado;
- documento do Drive.

Cada fonte deve ter:

- nome do arquivo;
- tipo;
- qualidade da extracao quando existir;
- link "abrir no Drive";
- badge de fonte: PDF, SPREADSHEET, DATABASE.

### 7. Estados visuais

Use badges claros:

- `confirmed`: confirmado;
- `suggested`: sugerido;
- `conflict`: conflito;
- `missing`: ausente;
- `needs_evidence`: precisa de evidencia;
- `needs_review`: precisa de revisao;
- `needs_normalization`: precisa normalizar;
- `ready_for_review`: pronto para revisao.

## Tom visual

Manter a identidade da tela existente:

- institucional;
- operacional;
- densa;
- clara;
- sem hero;
- sem linguagem de marketing;
- sem "IA magica" como protagonista.

Use a IA como camada de rastreabilidade: "valor + fonte + citacao + confianca".

## Regras importantes

- Nunca mostrar um campo extraido como verdade absoluta sem fonte.
- Sempre mostrar a fonte do campo critico: validade, numero da licenca e processo.
- Se houver divergencia entre PDF e banco, marcar como conflito.
- Planilha deve ser considerada fonte operacional, especialmente para status de atendimento, peso e ponderacao.
- PDF oficial deve ser fonte prioritaria para numero, validade, orgao e processo.
- Banco deve indicar valor normalizado/confirmado.
- O front deve permitir abrir o documento original no Drive.

## Dados de exemplo

Use o payload real abaixo como exemplo principal:

- Licenca: `05.21.09.003636-1`
- Tipo: `Renovacao da Licenca de Operacao`
- Kind: `RLO`
- Orgao: `CPRH`
- Validade: `2026-09-09`
- Fonte da validade: `PDF`
- Status da triagem: `needs_evidence`
- Planilha: `08. Planilha de Controle de Licencas (GML) 2026.xlsx`
- PDF: `06. Renovacao de licenca operacao`
- Linha: `A10:N10`
- Item: `4.10`
- Atendimento: `PENDENTE`
- Peso: `1`
- Ponderacao: `0`

Tags de filtro sugeridas:

- Todos
- CPRH
- IBAMA
- ANTAQ
- SEI
- SISAM
- SILIA
- Vencendo
- Com conflito
- Precisa de evidencia

## Resultado esperado

Uma tela de acompanhamento onde o usuario consiga enxergar uma lista de licencas e, ao selecionar uma delas, entender:

- o que a IA preencheu;
- de onde veio cada campo;
- se o PDF confirmou;
- se a planilha informou;
- se o banco concorda;
- o que falta para concluir a triagem.

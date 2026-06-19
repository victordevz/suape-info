# Brief de produto e UX - Acompanhamento de licencas

## Problema

A equipe possui documentos regulatorios espalhados entre PDFs, planilhas e pastas no Drive. Mesmo quando o documento existe, ainda e dificil saber:

- qual licenca aquele documento representa;
- se a validade esta correta;
- se a planilha concorda com o PDF;
- se o banco ja normalizou os dados;
- quais condicionantes/itens ainda precisam de evidencia;
- quais processos precisam de revisao humana.

## Hipotese

Se o sistema mostrar uma lista de licencas identificadas com campos preenchidos, fonte, citacao, confianca e pendencias, a equipe consegue acompanhar o processo regulatorio com mais seguranca do que olhando manualmente Drive + planilha + PDF.

## Usuario principal

Equipe GML / governanca ambiental / responsaveis por licencas, condicionantes, prazos e evidencias.

## Momento de uso

O usuario abre a rota para:

- revisar licencas detectadas automaticamente;
- acompanhar vencimentos;
- validar se o PDF oficial confirma dados da planilha;
- identificar conflitos;
- priorizar pendencias;
- abrir documentos originais no Drive;
- preparar validacao humana.

## Conceito de interface

A tela deve funcionar como uma mesa de acompanhamento de triagem, nao como repositorio de arquivos.

Na tela inicial de documentos, o usuario pergunta:

"Quais arquivos chegaram do Drive?"

Nesta rota, o usuario pergunta:

"Quais licencas o sistema ja entendeu e em que estado esta cada processo?"

## Hierarquia de informacao

Prioridade 1:

- numero da licenca;
- validade;
- status da triagem;
- fonte da validade;
- confianca;
- pendencias.
- filtro rapido por tags de licenca/orgao, como Todos, CPRH, IBAMA e ANTAQ.

Prioridade 2:

- tipo da licenca;
- orgao;
- processo CPRH/SEI;
- documentos relacionados;
- conflitos.

Prioridade 3:

- candidatos por campo;
- texto da citacao;
- detalhes de extracao;
- payload completo.

## Estados de triagem

| Estado | Significado |
|---|---|
| `ready_for_review` | Dados principais preenchidos e sem conflito critico. |
| `needs_evidence` | Licenca identificada, mas falta evidencia/documento vinculado a algum item. |
| `needs_review` | Existe conflito entre fontes ou campo critico incerto. |
| `needs_normalization` | Linha/registro ainda nao foi normalizado no banco. |

## Estados de campo

| Estado | Significado |
|---|---|
| `confirmed` | Fontes concordam ou ha fonte prioritaria confiavel. |
| `suggested` | Valor sugerido, mas ainda precisa de validacao. |
| `conflict` | Fontes retornaram valores diferentes. |
| `missing` | Campo nao encontrado. |

## Fontes

| Fonte | Uso principal |
|---|---|
| `PDF` | Numero, validade, orgao, processo e texto oficial. |
| `SPREADSHEET` | Status operacional, item, peso, ponderacao, acompanhamento. |
| `DATABASE` | Valor normalizado/confirmado pelo sistema. |
| `DRIVE_DOCUMENT` | Documento textual auxiliar. |
| `LLM_INFERENCE` | Sugestao quando nao ha fonte estruturada suficiente. |

## Regras de prioridade

- PDF oficial vence para numero, validade, orgao e processo.
- Planilha vence para status operacional, peso e ponderacao.
- Banco confirma o valor normalizado e ajuda a detectar divergencia.
- IA nunca deve esconder a fonte.
- Campo critico sem fonte deve aparecer como ausente ou sugerido, nao confirmado.

## Layout recomendado

1. Header com titulo e filtros.
2. Indicadores compactos.
3. Barra de tags/pilulas para filtro rapido por orgao, sistema, conflito ou urgencia.
4. Tabela de licencas.
5. Painel lateral de detalhes.
6. Secao de campos extraidos.
7. Secao de fontes e citacoes.
8. Lista de proximas acoes.

## Filtro por tags

Adicionar uma faixa de tags em formato de pilulas, inspirada no exemplo visual:

- `Todos` selecionado por padrao;
- `CPRH`;
- `IBAMA`;
- `ANTAQ`;
- `SEI`;
- `SISAM`;
- `SILIA`;
- `Vencendo`;
- `Com conflito`;
- `Precisa de evidencia`.

Comportamento esperado:

- clicar em uma tag filtra a tabela de licencas;
- `Todos` limpa o filtro;
- tags de orgao filtram por `fields.issuingAgency.value` ou por processo/fonte associada;
- tags como `Com conflito` e `Precisa de evidencia` filtram por `conflicts.length` e `triageStatus`;
- a tag selecionada deve usar azul Suape;
- tags nao selecionadas devem usar fundo claro, texto escuro e borda sutil.

## O que evitar

- Evitar visual de chat de IA.
- Evitar texto longo explicando a IA.
- Evitar cards grandes demais.
- Evitar esconder o documento original.
- Evitar mostrar validade sem fonte.
- Evitar tratar triagem pendente como concluida.

## Mensagens curtas sugeridas

- "Confirmado pelo PDF"
- "Informado pela planilha"
- "Normalizado no banco"
- "Conflito entre fontes"
- "Sem fonte suficiente"
- "Precisa de evidencia"
- "Abrir documento original"

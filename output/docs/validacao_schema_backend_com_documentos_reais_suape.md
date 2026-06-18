# Validação do schema/backend com documentos reais de Suape

Data: 18 de junho de 2026

Arquivos analisados:

- `/Users/victorcorreia/Downloads/06. Renovação de licença operação`
- `/Users/victorcorreia/Downloads/07. Autorização ambiental.pdf`
- `/Users/victorcorreia/Downloads/08. Planilha de Controle de Licenças (GML) 2026.xlsx`

## 1. Conclusão executiva

O modelo backend proposto está bem direcionado para o problema central: organizar licenças, condicionantes, obrigações, evidências, protocolos, responsáveis, prazos e auditoria.

Porém, os documentos reais mostram que o schema precisa ser ajustado antes de qualquer integração automatizada. O principal ajuste é separar melhor:

- documento regulatório oficial;
- cláusulas do documento, como exigências, requisitos, restrições e observações;
- obrigações operacionais geradas por essas cláusulas;
- ocorrências de prazo no calendário;
- entregas, evidências e protocolos;
- processos administrativos, SEI/SISAM/SILIA e autos de infração.

Sem esses ajustes, a integração com Google Sheets e PDFs corre risco de importar dados, mas manter ambiguidade operacional.

## 2. O que os documentos reais mostraram

### 2.1 Renovação da Licença de Operação

Documento: `06. Renovação de licença operação`

Campos identificados:

- Tipo: Renovação da Licença de Operação - RLO.
- Número: `05.21.09.003636-1`.
- Validade: `09/09/2026`.
- Data de emissão: `10/09/2021`.
- Órgão emissor: CPRH.
- Protocolo do expediente: `001701/2021`.
- Código de autenticação: `BW373CS7`.
- Empreendimento, razão social, CNPJ, endereço e caracterização.

Estrutura normativa:

- Seção 9 - Exigências: 27 itens principais.
- Há subitens relevantes, por exemplo 4.1 a 4.11 e 12.1 a 12.7.
- Seção 10 - Requisitos: 4 itens.
- Seção 11 - Observação: inclui regra de renovação até 120 dias antes do vencimento e consequência de perda de validade por não atendimento.

Impacto no schema:

- "Condicionante" precisa representar exigências e requisitos.
- Subitens devem ser preservados como texto, não como número/data.
- Algumas exigências geram entregas recorrentes, outras são restrições permanentes, outras são acionadas por evento.
- Observações também podem gerar regras de negócio, como prazo de renovação.

### 2.2 Autorização Ambiental

Documento: `07. Autorização ambiental.pdf`

Campos identificados:

- Tipo: Autorização Ambiental.
- Número: `04.25.04.002491-3`.
- Validade: `24/04/2026`.
- Data de emissão: `24/04/2025`.
- Órgão emissor: CPRH.
- Protocolo do expediente: `001708/2025`.
- Código de autenticação: `KY358GX3`.
- Empreendimento, razão social, CNPJ, endereço e sumário da atividade.

Estrutura normativa:

- Seção 9 - Exigências: 11 itens principais.
- Item 1 lista materiais e equipamentos autorizados.
- Item 2 lista equipe técnica autorizada, com identificação profissional.
- Item 3 cria obrigação de entregar relatórios trimestrais e relatório final.
- Itens 4 a 11 trazem restrições, comunicações, responsabilidades e limitações.
- Seção 10 - Objetivo da Autorização.
- Seção 11 - Observação, com hipóteses de modificação, suspensão ou cancelamento.

Impacto no schema:

- Nem toda exigência é "entrega de documento". Algumas representam permissão, restrição, equipe autorizada ou material permitido.
- Para IA e busca, texto integral basta; para operação governada, convém estruturar equipe autorizada, materiais/equipamentos e restrições.

### 2.3 Planilha de Controle de Licenças GML 2026

Abas encontradas:

- `LO COMPLEXO DE SUAPE CIPS`
- `Licenças e Autorizações`
- `Processos Administrativos`
- `AUTOS DE INFRAÇÃO`
- `CALENDÁRIO GML - 2026`

#### Aba LO Complexo de Suape CIPS

Colunas principais:

- Nº
- Condicionantes
- Responsável
- Prazo CPRH
- Prazo Interno
- Peso
- Atende
- Atende parcialmente
- Não atende
- Ponderação
- Status
- Protocolo CPRH
- Observações
- Nº SEI vinculado

Observações:

- A aba reproduz as 27 exigências da RLO.
- Subitens 4.1 a 4.11 e 12.1 a 12.7 foram incluídos como linhas.
- Alguns subitens foram convertidos pelo Excel em datas, por exemplo `4.9`, `4.10`, `4.11`, `12.1`, `12.2`, etc.
- O controle de atendimento é feito por colunas de marcação e fórmula de ponderação.

Impacto no schema:

- O código do item regulatório deve ser `text`, nunca número ou data.
- O atendimento deve ser enum/status próprio, não três colunas booleanas.
- Peso e ponderação devem existir como avaliação ou métrica, não como fórmula central de verdade.

#### Aba Licenças e Autorizações

Colunas principais:

- Objeto
- Tipo de licenciamento
- Localização
- Descrição do empreendimento/obra
- Área demandante
- Nº da solicitação SILIA
- Nº do processo
- Ofício Suape
- Data da solicitação
- Data do protocolo
- Exigências
- Prazo para cumprimento de exigência
- Cumprimento
- Evidência do cumprimento
- Andamento
- Status
- Nº da licença/autorização
- Data da emissão
- Validade
- Processo SEI vinculado
- Nº licença antiga
- Validade antiga
- Responsável/ponto focal
- Exigências/condicionante
- Protocolo CPRH de cumprimento
- Prazo interno para prorrogação/renovação
- Prazo externo para prorrogação/renovação
- Observação

Impacto no schema:

- O modelo precisa cobrir o processo antes e depois da emissão da licença.
- É necessário armazenar solicitação SILIA, processo CPRH/SISAM, processo SEI, ofício Suape e licença antiga.
- Renovação/prorrogação precisa ter campos próprios.

#### Aba Processos Administrativos

Colunas principais:

- Objeto
- Tipo de licenciamento vinculado
- Nº da licença/autorização
- Validade
- Descrição da solicitação
- Área demandante
- Nº do processo administrativo
- Nº do processo vinculado
- Ofício Suape
- Data do protocolo
- Status
- Processo SEI vinculado
- Exigências/condicionante
- Protocolo CPRH cumprimento de condicionantes
- Observação

Impacto no schema:

- Processo administrativo deve ser entidade própria ou subtipo de processo.
- Ele pode existir vinculado a uma licença, mas também tem vida operacional própria.

#### Aba Autos de Infração

Colunas principais:

- Objeto
- Auto de infração
- Processo SEI
- Processo CPRH
- Tipo
- Status

Impacto no schema:

- O modelo inicial não contempla bem autos de infração/passivos ambientais.
- Recomenda-se criar entidade própria para auto de infração ou caso de fiscalização.

#### Aba Calendário GML 2026

Colunas principais:

- Prazo interno
- Prazo CPRH
- Objeto
- Licença/autorização
- Validade da licença
- Demanda
- Itens
- Entrega
- Nº processo SEI
- Breve histórico

Demandas encontradas:

- Condicionante
- Renovação
- RLO

Impacto no schema:

- O calendário não deve ser apenas tabela manual.
- Ele deve ser derivado de ocorrências de obrigações, renovações e eventos.
- Deve existir entidade de ocorrência/prazo para cada entrega esperada.

## 3. Ajustes recomendados no modelo

### 3.1 Renomear ou ampliar Condicionante para Cláusula Regulatória

Criar entidade `regulatory_clause` ou ampliar `condicionante`.

Campos recomendados:

- `id`
- `license_id`
- `source_document_id`
- `section_name`
- `clause_type`: `EXIGENCIA`, `CONDICIONANTE`, `REQUISITO`, `OBSERVACAO`, `RESTRICAO`, `PROIBICAO`, `OBJETIVO`
- `item_code` como texto
- `parent_item_code`
- `sequence`
- `text`
- `is_trackable`
- `generates_obligation`
- `source_page`
- `extraction_confidence`

Motivo:

Os documentos reais usam "Exigências", "Requisitos" e "Observações", enquanto a planilha chama parte disso de condicionante.

### 3.2 Separar Cláusula Regulatória de Obrigação

Criar ou reforçar entidade `obligation`.

Campos recomendados:

- `id`
- `regulatory_clause_id`
- `license_id`
- `obligation_type`: `ENTREGA_DOCUMENTAL`, `RENOVACAO`, `COMUNICACAO`, `RELATORIO`, `RESTRICAO`, `EVENTO`, `MANUTENCAO_CADASTRAL`
- `trigger_type`: `FIXED_DATE`, `RELATIVE_TO_ISSUE_DATE`, `RELATIVE_TO_EXPIRY_DATE`, `RECURRENT`, `EVENT_BASED`, `WHEN_UPDATED`, `IMMEDIATE`
- `recurrence_rule`
- `deadline_authority`
- `deadline_internal`
- `deadline_basis`
- `responsible_id`
- `status`
- `weight`
- `criticality`

Motivo:

Uma exigência pode gerar várias entregas no tempo. Exemplo: exigência semestral ou trimestral.

### 3.3 Criar ocorrência de obrigação para calendário

Criar entidade `obligation_occurrence`.

Campos recomendados:

- `id`
- `obligation_id`
- `period_reference`
- `due_date_authority`
- `due_date_internal`
- `status`
- `delivery_expected`
- `delivery_id`
- `protocol_id`
- `sei_process_id`
- `calendar_year`

Motivo:

A aba `CALENDÁRIO GML - 2026` é melhor representada como uma visão derivada de ocorrências.

### 3.4 Fortalecer entidade Licença/Autorização

Campos adicionais recomendados:

- `license_kind`: `LP`, `LI`, `LO`, `RLO`, `AUT`, `PLI`, `CP`, `LS`, etc.
- `license_number`
- `previous_license_number`
- `issuing_authority`
- `issue_date`
- `valid_until`
- `renewal_deadline_authority`
- `renewal_deadline_internal`
- `renewal_rule`
- `source_protocol_number`
- `authentication_code`
- `silia_request_number`
- `cprh_process_number`
- `sisam_process_number`
- `sei_process_number`
- `oficio_suape_number`
- `activity_summary`
- `legal_typology`
- `location`

Motivo:

Os PDFs e a planilha trazem muitos identificadores oficiais que não devem ficar só em observação.

### 3.5 Separar protocolo, processo e ofício

Criar entidade `external_process`.

Campos recomendados:

- `id`
- `process_type`: `CPRH`, `SISAM`, `SILIA`, `SEI`, `ANM`, `IBAMA`, `OUTRO`
- `process_number`
- `linked_license_id`
- `linked_obligation_id`
- `status`
- `opened_at`
- `protocol_at`
- `description`

Criar entidade `official_letter` ou `oficio`.

Motivo:

A planilha diferencia solicitação SILIA, processo CPRH, processo SEI e ofício Suape.

### 3.6 Criar entrega/protocolo de cumprimento

Criar entidade `delivery`.

Campos recomendados:

- `id`
- `obligation_occurrence_id`
- `delivery_type`
- `submitted_at`
- `recipient_authority`
- `protocol_number`
- `proof_document_id`
- `evidence_document_id`
- `status`
- `notes`

Motivo:

Evidência não é igual a protocolo. Um relatório pode ser evidência, e o comprovante de envio pode ser outro documento.

### 3.7 Criar avaliação de cumprimento

Criar entidade `compliance_assessment`.

Campos recomendados:

- `id`
- `clause_id`
- `obligation_id`
- `occurrence_id`
- `status`: `ATENDE`, `ATENDE_PARCIALMENTE`, `NAO_ATENDE`, `NAO_APLICAVEL`, `PENDENTE`, `EM_VALIDACAO`
- `weight`
- `score`
- `assessed_by`
- `assessed_at`
- `justification`

Motivo:

A planilha usa peso, atende, atende parcialmente, não atende e ponderação. No backend, isso deve virar avaliação auditável.

### 3.8 Criar entidade para autos de infração

Criar `infraction_case`.

Campos recomendados:

- `id`
- `object`
- `infraction_number`
- `sei_process_number`
- `cprh_process_number`
- `infraction_type`
- `status`
- `linked_license_id`
- `linked_clause_id`
- `notes`

Motivo:

Autos de infração aparecem como passivos ambientais e podem se relacionar a obrigações, condicionantes ou descumprimentos.

### 3.9 Preservar código de item como texto

Regra obrigatória:

- `item_code` deve ser string.
- Nunca converter códigos como `4.9`, `4.10`, `12.1` em número ou data.

Motivo:

A planilha real já sofreu conversões automáticas do Excel, transformando subitens em datas.

## 4. Validação do modelo inicial

| Área | Situação | Ajuste necessário |
|---|---|---|
| Licença/autorização | Parcialmente alinhado | Adicionar identificadores oficiais, licença anterior, renovação e sistemas externos |
| Condicionante | Parcialmente alinhado | Ampliar para cláusula regulatória com tipos |
| Obrigação | Bem direcionado | Separar de cláusula e adicionar recorrência, gatilhos e ocorrências |
| Evidência | Alinhado | Separar evidência de entrega/protocolo |
| Protocolo | Parcialmente alinhado | Distinguir protocolo, processo, SEI, SILIA, SISAM e ofício |
| Responsável | Alinhado | Incluir ponto focal, área demandante, equipe autorizada e contratadas |
| Auditoria | Alinhado | Manter como requisito central |
| Calendário | Parcialmente alinhado | Criar ocorrência de obrigação para gerar calendário |
| IA/RAG | Alinhado | Aguardar base governada antes de automatizar respostas |
| Autos de infração | Não contemplado | Criar entidade própria |

## 5. Recomendação antes das integrações

Antes de desenvolver conectores Google Drive/Sheets, ajustar o schema para suportar:

1. Cláusula regulatória com tipos.
2. Obrigação derivada da cláusula.
3. Ocorrência de obrigação para calendário.
4. Entrega/protocolo de cumprimento.
5. Processo externo e ofício.
6. Licença/autorização com identificadores oficiais completos.
7. Auto de infração/passivo ambiental.
8. Avaliação de cumprimento com status, peso e score.
9. Item regulatório como texto.
10. Linhagem por PDF/página/seção/item e por planilha/aba/linha/célula.

Com esses ajustes, a integração conseguirá importar tanto a planilha quanto os PDFs sem forçar dados reais em campos genéricos.

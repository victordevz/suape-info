# Plano da feature backend - Integração Google Drive para sistema e banco

## Objetivo da feature

Criar a primeira feature estratégica do backend: conectar uma conta ou workspace Google Drive, selecionar pastas monitoradas, detectar documentos e planilhas, importar metadados, registrar origem, persistir no banco e disponibilizar esses itens para consulta/classificação na aplicação.

Essa feature não precisa implementar todo o backend de governança ambiental. Ela deve construir a base para que os dados continuem nas ferramentas atuais, mas passem a ser rastreados e consultáveis pelo sistema.

## Escopo da primeira entrega

### Dentro do escopo

- Conectar Google Drive via OAuth ou service account.
- Listar pastas e arquivos autorizados.
- Permitir registrar pastas monitoradas.
- Detectar arquivos novos ou alterados.
- Importar metadados de arquivos.
- Copiar ou referenciar arquivos conforme política definida.
- Registrar origem, versão e caminho no Drive.
- Criar job de processamento.
- Extrair texto básico de PDFs e documentos suportados.
- Registrar status de importação.
- Expor API para frontend listar documentos importados.
- Permitir status: importado, extraído, erro, aguardando classificação, aguardando validação e vinculado.

### Fora do escopo inicial

- Envio automático para órgãos externos.
- Validação automática de evidência oficial.
- IA generativa completa.
- Integração com todos os sistemas externos.
- Migração completa do legado.
- CRUD completo de todas as entidades regulatórias.

## Fluxo principal

1. Usuário conecta o Google Drive.
2. Sistema recebe autorização e armazena credenciais seguras.
3. Usuário escolhe uma ou mais pastas para monitorar.
4. Sistema cria registros de fontes conectadas.
5. Job inicial lista arquivos da pasta.
6. Para cada arquivo, sistema cria um `source_document`.
7. Sistema verifica se o arquivo já existe por `drive_file_id`, `revision_id` e hash/metadados.
8. Sistema cria job assíncrono de importação.
9. Worker baixa ou acessa o arquivo conforme permissão.
10. Sistema extrai texto e metadados.
11. Sistema salva documento, origem, versão e status no banco.
12. Frontend exibe documento na Central de Dados e Evidências.
13. Usuário valida ou corrige classificação futuramente.

## Modelo mínimo de dados

### connected_source

Representa uma fonte conectada ao sistema.

Campos:

- `id`
- `provider`: `GOOGLE_DRIVE`, `GOOGLE_SHEETS`, `MANUAL_UPLOAD`
- `display_name`
- `connection_status`: `CONNECTED`, `ERROR`, `EXPIRED`, `PENDING_PERMISSION`
- `connected_by_user_id`
- `connected_at`
- `last_sync_at`
- `sync_status`: `IDLE`, `SYNCING`, `FAILED`
- `error_message`

### monitored_folder

Representa uma pasta do Drive monitorada.

Campos:

- `id`
- `connected_source_id`
- `drive_folder_id`
- `folder_name`
- `folder_path`
- `parent_folder_id`
- `is_active`
- `last_scan_at`
- `created_at`

### source_document

Representa o arquivo detectado na fonte.

Campos:

- `id`
- `connected_source_id`
- `monitored_folder_id`
- `provider`: `GOOGLE_DRIVE`
- `drive_file_id`
- `drive_revision_id`
- `drive_web_url`
- `file_name`
- `mime_type`
- `file_extension`
- `file_size`
- `checksum`
- `folder_path`
- `modified_at_source`
- `created_at_source`
- `import_status`: `DETECTED`, `QUEUED`, `IMPORTED`, `EXTRACTED`, `CLASSIFICATION_PENDING`, `VALIDATION_PENDING`, `LINKED`, `FAILED`
- `last_imported_at`
- `error_message`

### document_version

Representa uma versão importada de um documento.

Campos:

- `id`
- `source_document_id`
- `revision_id`
- `checksum`
- `storage_object_key`
- `extracted_text_object_key`
- `extraction_status`: `PENDING`, `SUCCESS`, `PARTIAL`, `FAILED`
- `extraction_quality`
- `created_at`

### document_metadata

Metadados extraídos ou informados.

Campos:

- `id`
- `source_document_id`
- `document_type`: `LICENCA`, `AUTORIZACAO`, `PLANILHA_CONTROLE`, `OFICIO`, `RELATORIO`, `PROTOCOLO`, `AUTO_INFRACAO`, `OUTRO`
- `issuing_authority`
- `license_number`
- `valid_until`
- `issue_date`
- `process_number`
- `sei_number`
- `authentication_code`
- `confidence_score`
- `metadata_status`: `SUGGESTED`, `CONFIRMED`, `REJECTED`

### import_job

Fila e histórico de processamento.

Campos:

- `id`
- `source_document_id`
- `job_type`: `SCAN`, `IMPORT`, `EXTRACT_TEXT`, `EXTRACT_METADATA`, `REINDEX`
- `status`: `QUEUED`, `RUNNING`, `SUCCESS`, `FAILED`, `RETRYING`
- `attempts`
- `started_at`
- `finished_at`
- `error_message`
- `correlation_id`

### audit_event

Registro de ações relevantes.

Campos:

- `id`
- `actor_user_id`
- `event_type`
- `entity_type`
- `entity_id`
- `before`
- `after`
- `source`
- `created_at`
- `ip_address`

## APIs mínimas

### Conexão

- `POST /integrations/google-drive/connect`
- `GET /integrations/google-drive/status`
- `DELETE /integrations/google-drive/disconnect`

### Pastas monitoradas

- `GET /integrations/google-drive/folders`
- `POST /monitored-folders`
- `GET /monitored-folders`
- `PATCH /monitored-folders/{id}`
- `DELETE /monitored-folders/{id}`

### Sincronização

- `POST /sync/google-drive/run`
- `GET /sync/jobs`
- `GET /sync/jobs/{id}`
- `POST /sync/jobs/{id}/retry`

### Documentos

- `GET /documents`
- `GET /documents/{id}`
- `GET /documents/{id}/versions`
- `GET /documents/{id}/preview`
- `PATCH /documents/{id}/metadata`
- `POST /documents/{id}/mark-validation-pending`

### Auditoria

- `GET /audit-events?entity_type=source_document&entity_id={id}`

## Estados de importação

| Estado | Significado |
|---|---|
| DETECTED | Arquivo encontrado no Drive. |
| QUEUED | Job de importação criado. |
| IMPORTED | Metadados e arquivo/origem registrados. |
| EXTRACTED | Texto ou conteúdo extraído com sucesso. |
| CLASSIFICATION_PENDING | Precisa de classificação automática ou manual. |
| VALIDATION_PENDING | Sugestão existe, mas precisa validação humana. |
| LINKED | Documento vinculado a entidade regulatória. |
| FAILED | Falha de leitura, permissão, download ou processamento. |

## Estratégia de integração Google Drive

### Autenticação

Opções:

1. OAuth por usuário.
   - Melhor para MVP quando o usuário conecta sua conta.
   - Permite respeitar permissões reais do Drive.

2. Service account com delegação.
   - Melhor para operação corporativa.
   - Exige configuração administrativa do Google Workspace.

Recomendação para MVP:

- Começar com OAuth.
- Preparar arquitetura para migrar ou complementar com service account.

### Detecção de mudanças

Fase 1:

- Job agendado com polling.
- Listar arquivos por pasta monitorada.
- Comparar `file_id`, `modifiedTime`, `version/revision` e checksum quando disponível.

Fase 2:

- Usar Google Drive Changes API ou push notifications.
- Reduzir latência e custo de varredura.

## Regras críticas

- Nunca considerar arquivo como evidência oficial apenas por estar no Drive.
- Todo arquivo importado deve preservar origem e versão.
- Nenhum vínculo crítico deve ser confirmado sem validação humana.
- Arquivo alterado no Drive deve gerar nova versão no sistema.
- Exclusão no Drive não deve apagar histórico no sistema.
- Falha de permissão deve aparecer para o usuário como erro operacional rastreável.
- Arquivos de planilha devem ser tratados como fonte estruturada, não apenas anexo.

## Primeira fatia implementável

### Sprint 1 - Base de integração

- Criar tabelas `connected_source`, `monitored_folder`, `source_document`, `import_job`.
- Implementar OAuth Google Drive.
- Listar pastas e arquivos.
- Registrar pasta monitorada.
- Rodar sincronização manual.
- Exibir documentos importados via API.

### Sprint 2 - Processamento

- Criar `document_version`.
- Baixar arquivo ou armazenar referência segura.
- Extrair texto básico de PDF.
- Registrar status de extração.
- Implementar reprocessamento.
- Registrar auditoria dos eventos de importação.

### Sprint 3 - Metadados e tela

- Criar `document_metadata`.
- Extrair metadados simples por heurística:
  - número da licença/autorização;
  - validade;
  - data de emissão;
  - órgão emissor;
  - código de autenticação;
  - protocolo do expediente.
- Expor filtros para frontend.
- Criar status `CLASSIFICATION_PENDING` e `VALIDATION_PENDING`.

### Sprint 4 - Preparação para governança

- Criar vínculos opcionais com entidades regulatórias futuras.
- Preparar criação de `regulatory_clause`, `obligation` e `obligation_occurrence`.
- Implementar histórico de versões e eventos.
- Preparar integração com Google Sheets.

## Critérios de aceite da feature

- Usuário consegue conectar Google Drive.
- Usuário consegue selecionar uma pasta monitorada.
- Sistema lista documentos da pasta.
- Sistema detecta arquivo novo ou alterado.
- Sistema registra origem, caminho, versão e metadados do Drive.
- Sistema cria job de importação.
- Sistema extrai texto básico de PDFs.
- Sistema exibe documento importado na API.
- Sistema mostra status de importação.
- Sistema registra erro quando não consegue acessar arquivo.
- Sistema preserva histórico quando arquivo muda.

## Riscos e cuidados

- Permissões do Drive podem impedir leitura de arquivos compartilhados.
- Arquivos grandes exigem fila e limite de processamento.
- Google Docs e Google Sheets exigem exportação para formato legível.
- Planilhas podem ter células mescladas, abas vazias e fórmulas.
- PDFs podem vir digitalizados e exigir OCR.
- Subitens regulatórios não podem ser convertidos em número ou data.
- Exclusão no Drive não deve apagar prova histórica.

## Decisão recomendada

Construir primeiro a Central de Dados e Evidências com integração Google Drive e importação rastreável. Depois, evoluir para classificação regulatória, Google Sheets, cláusulas/obrigações, calendário e IA/RAG.

Essa ordem entrega valor cedo sem exigir que todo o backend regulatório esteja pronto desde o início.

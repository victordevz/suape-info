# Promptbase - Primeira tela frontend

## Prompt principal

Crie a primeira tela de uma aplicação web de governança ambiental e gestão de evidências para o Porto de Suape. A tela deve ser a experiência inicial do sistema e deve focar na integração real já disponível com Google Drive: conexão OAuth, seleção de pastas monitoradas, sincronização manual, importação de metadados, extração textual básica e consulta de documentos importados.

O objetivo da tela é transmitir familiaridade para usuários que já trabalham com Google Drive, planilhas e pastas, mas sem copiar visualmente a marca ou interface proprietária do Google. Use padrões familiares de organização de arquivos: sidebar de fonte conectada, lista de pastas monitoradas, breadcrumb simples, lista/tabela de documentos, filtros suportados pelo backend, busca, preview lateral e status de sincronização.

## Contexto do produto

Hoje a equipe controla licenças, autorizações, condicionantes, exigências, prazos, protocolos, evidências e documentos regulatórios em Google Drive, Google Sheets e documentos PDF. O sistema não deve obrigar o usuário a abandonar essas ferramentas no início. Em vez disso, nesta primeira versão ele deve se conectar ao Google Drive, importar documentos, registrar origem, versão, caminho, status de importação e texto extraído quando possível.

A tela deve representar a ponte entre o Google Drive e o sistema governado.

Google Sheets, classificação automática, vínculos regulatórios e validação formal de evidência devem aparecer como capacidades futuras ou estados visuais preparados, sem depender de APIs reais nesta primeira versão.

## Contexto de branding Suape

Use o Manual de Identidade Visual Suape como referência visual da interface. A tela deve parecer um produto institucional da Suape, mas sem virar uma peça promocional. A aplicação é operacional e densa; portanto, a marca deve aparecer de forma funcional, contida e consistente.

Diretrizes de marca:

- Marca: SUAPE - Complexo Industrial Portuário de Pernambuco.
- Conceito visual: símbolo geométrico com sol/estrela central e composição modular, remetendo ao território, ao porto, ao Brasil e à expansão "do Brasil para o mundo".
- Cor primária: azul Suape / Pantone Blue 072 C / `#2E60AD` / RGB 46 96 173.
- Cor secundária: amarelo Suape / Pantone 137 C / `#FCB316` / RGB 252 179 22.
- Tipografia de apoio: Matt Regular, Matt Medium, Matt Bold e Matt Black. Caso a fonte não esteja disponível no ambiente, usar uma alternativa geométrica e institucional, como Inter, Manrope ou similar, mantendo boa legibilidade em tabela.
- Usar azul para navegação, cabeçalhos, ícones principais, seleção ativa e elementos de confiança.
- Usar amarelo como acento controlado: status positivo, ponto de atenção leve, ícone de sincronização, detalhe de marca ou microinteração.
- Evitar dominar a interface com blocos grandes amarelos; a tela precisa continuar silenciosa e operacional.
- Usar branco, cinzas frios e azul muito claro como base de superfície para preservar leitura.
- O padrão gráfico modular da marca pode aparecer de forma discreta em empty states, ilustrações pequenas, marca d'água leve ou detalhe lateral, mas não deve competir com a tabela de documentos.
- A logo Suape deve aparecer no topo/sidebar em tamanho discreto, preferencialmente na versão horizontal ou simplificada.
- Respeitar contraste e acessibilidade, principalmente em badges, botões, tabelas e filtros.

## Nome sugerido da tela

Central de Dados e Evidências

## Objetivo da tela

Permitir que o usuário veja se o Google Drive está conectado, quais pastas estão monitoradas, acompanhe a sincronização, encontre documentos importados, veja o status de importação/extração, consulte o preview textual e abra o arquivo original no Drive.

Classificação, vínculos com licença/autorização/condicionante e validação humana podem aparecer no layout como campos "a implementar", "não classificado" ou "aguardando validação", mas não devem exigir API real além dos endpoints disponíveis.

## Layout esperado

Crie uma interface de aplicação SaaS operacional, densa, clara e profissional.

Estrutura:

1. Barra superior
   - Nome do módulo: Central de Dados e Evidências.
   - Campo de busca global.
   - Botão de sincronizar agora.
   - Indicador de última sincronização.
   - Menu de usuário.

2. Sidebar esquerda
   - Seção "Fontes conectadas".
   - Itens:
     - Google Drive (funcional)
     - Google Sheets (em breve/desabilitado)
     - Uploads manuais (em breve/desabilitado)
     - Importações pendentes
   - Lista de pastas monitoradas retornadas pelo backend, usando `folderName`, `folderPath`, `isActive` e `lastScanAt`.
   - Exemplo de pastas reais/possíveis:
     - Meu Drive
     - Recursos Design
     - Album de Figurinhas
     - Licenças e Autorizações
     - Renovação de Licença de Operação
     - Processos Administrativos
   - Cada fonte deve ter indicador visual: conectado, erro, sincronizando, pendente de permissão.

3. Área principal
   - Breadcrumb da pasta ou fonte selecionada.
   - Tabs:
     - Todos os documentos
     - Importados
     - Extraídos
     - Não classificados
     - Aguardando validação
     - Vinculados
     - Com erro de importação
   - Barra de filtros:
     - Busca por nome (`q`)
     - Pasta monitorada (`monitoredFolderId`)
     - Fonte conectada (`connectedSourceId`)
     - Status de importação (`importStatus`)
     - Tipo/mime type visual calculado no front
     - Filtros futuros exibidos como desabilitados: órgão, licença/autorização, prazo e responsável
   - Tabela/lista de documentos com colunas:
     - Nome
     - Tipo/mime type
     - Origem
     - Caminho no Drive
     - Status de importação
     - Status de extração
     - Última atualização no Drive
     - Última sincronização
     - Versão/revisão
     - Ação "Abrir no Drive"
   - A lista deve lembrar um gerenciador de arquivos, mas com metadados de rastreabilidade e governança.

4. Painel lateral direito
   - Preview do item selecionado.
   - Metadados:
     - Nome do arquivo
     - Origem
     - Caminho no Drive
     - Hash/versão
     - Data de importação
     - Status de extração
     - Status de importação
     - Status de classificação como "não classificado" quando não houver metadata confirmada
   - Vinculações sugeridas:
     - Licença/autorização (placeholder)
     - Exigência/condicionante/requisito (placeholder)
     - Obrigação (placeholder)
     - Processo SEI/SISAM/CPRH (placeholder)
   - Ações:
     - Marcar como aguardando validação
     - Editar metadados básicos
     - Ver histórico de auditoria/importação
     - Abrir no Drive

5. Cards ou indicadores compactos no topo da área principal
   - Pastas conectadas
   - Documentos importados
   - Documentos extraídos
   - Pendentes de validação
   - Erros de sincronização
   - Vinculados (placeholder/futuro)

## Estados importantes

Inclua estados visuais para:

- Pasta conectada e sincronizada.
- Pasta aguardando permissão.
- Documento importado.
- Documento extraído.
- Documento extraído, mas ainda não classificado.
- Documento com metadata sugerida manualmente ou futura sugestão automática.
- Documento aguardando validação humana.
- Documento validado e vinculado (estado futuro).
- Erro de leitura ou permissão.
- Alteração detectada no Drive e nova versão importada.

## Dados de exemplo para popular a interface

Use exemplos próximos do trabalho real:

- Renovação da Licença de Operação - RLO CIPS
  - Número: 05.21.09.003636-1
  - Validade: 09/09/2026
  - Órgão: CPRH
  - Status: Vinculado

- Autorização Ambiental - Monitoramento de Fauna
  - Número: 04.25.04.002491-3
  - Validade: 24/04/2026
  - Órgão: CPRH
  - Status: Aguardando validação

- Planilha de Controle de Licenças GML 2026
  - Tipo: Google Sheets
  - Status: Em breve / importação estruturada futura
  - Conteúdo esperado futuro: prazos, responsáveis, condicionantes, renovações e calendário GML

- brief ecommerce vitoria400anos
  - Tipo: Google Docs
  - Status: Extraído
  - Origem: Google Drive
  - Exemplo real de documento detectado e exportado como texto pelo backend

- Condicionante 13 - RLO CIPS
  - Demanda: relatório trimestral / cronograma PAM
  - Status: Pendente de evidência (placeholder)

- Auto de Infração nº 089/2012
  - Tipo: Passivo ambiental
  - Status: Quitado (placeholder)

## Tom visual

A tela deve parecer um sistema operacional de trabalho, não uma landing page.

Direção visual:

- Profissional, institucional, limpo e confiável.
- Denso o suficiente para operação diária.
- Familiar para quem usa Drive, planilhas e pastas.
- Com indicadores claros de status e rastreabilidade.
- Sem visual excessivamente decorativo.
- Sem hero marketing.
- Sem cards grandes desnecessários.
- Use tabelas, listas, filtros, breadcrumbs, tabs, sidebar e painel de detalhes.

## Componentes esperados

- Sidebar de fontes e pastas.
- Breadcrumb.
- Busca global.
- Botão de sincronização.
- Tabela de documentos.
- Filtros suportados pelo backend e filtros futuros desabilitados.
- Tabs de status.
- Painel lateral de detalhes.
- Badges de status.
- Indicadores compactos.
- Empty states para fonte ainda não conectada.
- Toast ou banner discreto para resultado da sincronização.

## Interações esperadas

- Clicar em uma pasta altera a lista central.
- Clicar em um documento abre o painel lateral.
- Clicar em "Sincronizar agora" mostra estado de sincronização.
- Filtrar por "Aguardando validação" mostra documentos que precisam de conferência humana.
- "Marcar como aguardando validação" muda o status do documento via API.
- "Editar metadados" permite salvar metadados básicos via API.
- "Validar vínculo" deve aparecer desabilitado ou como ação futura, pois ainda não há endpoint real de vínculo regulatório.
- "Abrir no Drive" mantém a ponte com a fonte original.
- "Ver histórico" mostra origem, versão e eventos de importação.

## Regras de produto

- O Google Drive continua sendo fonte de criação e armazenamento operacional.
- O sistema passa a ser fonte de consulta, governança, auditoria e validação.
- Nenhum documento deve ser considerado evidência oficial sem origem, versão e vínculo validado.
- Nesta versão, IA e classificação automática não são protagonistas e não devem ser tratadas como funcionais.
- O usuário deve enxergar claramente o que veio do Drive, o que foi interpretado pelo sistema e o que foi validado por pessoa.

## Contrato real do backend disponível

Base URL local:

```text
http://localhost:3000/api
```

Endpoints disponíveis para o frontend:

- `GET /health`
- `GET /health/database`
- `POST /integrations/google-drive/connect`
  - Sem `code`: retorna `authorizationUrl`, `redirectUri` e `scopes`.
  - Com `code`: cria a conexão OAuth.
- `GET /integrations/google-drive/status`
  - Retorna `configured` e `sources`.
- `DELETE /integrations/google-drive/disconnect?connectedSourceId={id}`
- `GET /integrations/google-drive/folders?connectedSourceId={id}&q={termo}`
- `POST /monitored-folders`
- `GET /monitored-folders?connectedSourceId={id}`
- `PATCH /monitored-folders/{id}`
- `DELETE /monitored-folders/{id}`
- `POST /sync/google-drive/run`
- `GET /sync/jobs`
- `GET /sync/jobs/{id}`
- `POST /sync/jobs/{id}/retry`
- `GET /documents?q={termo}&importStatus={status}&connectedSourceId={id}&monitoredFolderId={id}&take={n}`
- `GET /documents/{id}`
- `GET /documents/{id}/versions`
- `GET /documents/{id}/preview`
- `PATCH /documents/{id}/metadata`
- `POST /documents/{id}/mark-validation-pending`
- `GET /audit-events?entity_type=source_document&entity_id={id}`

Campos reais importantes em documentos:

- `id`
- `fileName`
- `mimeType`
- `driveWebUrl`
- `folderPath`
- `driveRevisionId`
- `checksum`
- `modifiedAtSource`
- `lastImportedAt`
- `importStatus`
- `latestVersion.extractionStatus`
- `latestVersion.hasExtractedText`
- `monitoredFolder.folderName`

Status reais de importação:

- `DETECTED`
- `QUEUED`
- `IMPORTED`
- `EXTRACTED`
- `CLASSIFICATION_PENDING`
- `VALIDATION_PENDING`
- `LINKED`
- `FAILED`

O frontend deve mapear esses status para rótulos em português.

## Resultado esperado

Entregar uma tela inicial funcional e navegável, com aparência de produto real, focada em conectar Google Drive, monitorar pastas, sincronizar documentos, consultar documentos importados e visualizar texto extraído. A tela deve deixar claro que o sistema é uma camada de governança sobre as fontes existentes, não apenas um novo repositório manual.

Recursos ainda não implementados no backend devem aparecer como placeholders discretos, estados futuros ou controles desabilitados, sem quebrar a experiência principal.

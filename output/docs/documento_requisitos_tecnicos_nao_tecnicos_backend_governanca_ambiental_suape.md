# Documento de Requisitos Técnicos e Não Técnicos

## Backend de Governança Ambiental, Evidências e Dados Regulatórios

**Versão:** 1.0  
**Data:** 18 de junho de 2026  
**Referências:** fluxograma backend Mermaid, documento técnico de governança ambiental e documentação técnica de implementação do backend.

## 1. Objetivo

Definir, de forma objetiva, os requisitos necessários para entrega do backend da plataforma de governança ambiental, com foco em importação automática de dados, organização regulatória, armazenamento auditável, consulta estruturada, gestão de evidências, prazos, responsáveis, protocolos e ponto de extensão para IA/RAG seguro.

O projeto deve permitir que Google Drive e Google Sheets continuem sendo fontes de trabalho, mas que a aplicação se torne o ponto principal de consulta, rastreabilidade, validação, auditoria e tomada de decisão.

## 2. Escopo

### Dentro do escopo

- Integração com Google Drive para importação e sincronização de documentos.
- Integração com Google Sheets para importação e atualização de dados estruturados.
- Registro de origem, versão, metadados e histórico de processamento.
- Estruturação das entidades centrais: obra/atividade, licença/autorização, condicionante, obrigação, evidência, protocolo, responsável e evento auditável.
- Armazenamento versionado de arquivos e metadados.
- Trilha de auditoria para ações relevantes.
- Busca estruturada e textual.
- Agenda de prazos, recorrências, vencimentos e renovações.
- Motor inicial de risco baseado em prazos, evidências faltantes, responsáveis e protocolos.
- Geração de dossiês e exportações controladas.
- Ponto de extensão para microserviço de IA/RAG com consulta segura.

### Fora do escopo inicial

- Substituir o Google Workspace como ferramenta de criação de documentos.
- Automatizar envio oficial para órgãos externos sem validação humana.
- Permitir que a IA crie, aprove, exclua ou altere dados oficiais automaticamente.
- Migrar todo o acervo histórico de uma única vez.
- Integrar sistemas externos que não tenham API, exportação padronizada ou autorização formal.
- Desenvolver aplicativo mobile dedicado.

## 3. Critérios de prioridade

- **P0 - Obrigatório para MVP:** requisito necessário para operação mínima segura.
- **P1 - Importante:** requisito relevante para eficiência, governança ou escala, mas não bloqueia o MVP.
- **P2 - Evolução:** requisito previsto para maturidade futura da solução.

## 4. Requisitos técnicos

| ID | Prioridade | Requisito | Critério de aceite |
|---|---|---|---|
| RT-01 | P0 | O backend deve integrar-se ao Google Drive para listar, ler e importar documentos de pastas autorizadas. | Arquivos novos ou alterados em pastas monitoradas devem gerar registros de importação com origem, versão, identificador do arquivo e status. |
| RT-02 | P0 | O backend deve integrar-se ao Google Sheets para ler abas e linhas autorizadas. | Alterações em planilhas mapeadas devem ser convertidas em eventos ou atualizações rastreáveis no sistema. |
| RT-03 | P0 | O backend deve possuir mecanismo de monitoramento de mudanças. | O sistema deve identificar criação, alteração, exclusão lógica, renomeação ou movimentação de itens monitorados. |
| RT-04 | P0 | O backend deve processar importações por fila assíncrona. | Jobs devem possuir status, tentativas, logs de erro, reprocessamento e proteção contra duplicidade. |
| RT-05 | P0 | O backend deve registrar a origem de cada dado importado. | Todo documento ou dado estruturado deve manter fonte, arquivo/planilha, aba, linha, versão, data de captura e usuário/origem quando disponível. |
| RT-06 | P0 | O backend deve extrair conteúdo e metadados de documentos importados. | PDFs, documentos, imagens e planilhas devem gerar texto consultável, metadados e indicadores de qualidade da extração. |
| RT-07 | P0 | O backend deve preservar o arquivo original e gerar versão consultável. | O original deve ser mantido em storage versionado, com hash, metadados e referência para versão indexada. |
| RT-08 | P1 | O backend deve permitir classificação assistida por IA ou regras. | O sistema deve sugerir tipo documental, obra, licença, condicionante, obrigação, prazo e confidencialidade com score ou justificativa. |
| RT-09 | P0 | O backend deve exigir validação humana para vínculos críticos. | Evidências que comprovam obrigações, protocolos ou prazos só devem ser publicadas após confirmação de usuário autorizado ou regra aprovada. |
| RT-10 | P0 | O backend deve usar banco relacional para entidades de negócio. | Entidades centrais devem possuir chaves, relacionamentos, constraints, status e histórico mínimo. |
| RT-11 | P0 | O backend deve armazenar arquivos em object storage versionado. | Originais, anexos, comprovantes e evidências devem possuir versionamento, controle de acesso e referência no banco. |
| RT-12 | P0 | O backend deve implementar trilha de auditoria imutável. | Criação, edição, exclusão lógica, aprovação, download, envio, exportação e alteração de status devem gerar evento auditável. |
| RT-13 | P0 | O backend deve implementar exclusão lógica. | Registros e arquivos não devem ser apagados fisicamente no fluxo comum; devem ficar inativos/revogados com justificativa e histórico. |
| RT-14 | P0 | O backend deve aplicar controle de acesso por perfil, área e sensibilidade. | Usuários devem acessar apenas dados permitidos conforme papel, área, empresa, tipo documental e nível de confidencialidade. |
| RT-15 | P0 | O backend deve oferecer API para consulta e operação das entidades centrais. | A aplicação deve consultar obras, licenças, condicionantes, obrigações, evidências, protocolos, responsáveis, prazos e auditoria via API. |
| RT-16 | P1 | O backend deve manter índice de busca textual e filtros estruturados. | Usuários devem conseguir consultar por obra, licença, órgão, condicionante, prazo, status, responsável, evidência e protocolo. |
| RT-17 | P0 | O backend deve gerar agenda de prazos e recorrências. | Licenças, condicionantes e obrigações devem gerar alertas de vencimento, renovação, atraso e recorrência. |
| RT-18 | P1 | O backend deve implementar motor inicial de risco. | O sistema deve apontar riscos por prazo próximo, evidência faltante, protocolo sem comprovante, responsável indefinido ou atraso recorrente. |
| RT-19 | P1 | O backend deve gerar dossiês digitais. | Deve ser possível montar dossiê por obra, licença, condicionante, processo, órgão ou obrigação, com evidências e histórico. |
| RT-20 | P1 | O backend deve permitir exportação controlada. | Exportações devem registrar usuário, data, filtros, finalidade, documentos incluídos e evento de auditoria. |
| RT-21 | P2 | O backend deve expor base segura para IA/RAG. | O RAG deve consultar apenas dados autorizados, retornar citações e registrar perguntas, fontes e respostas. |
| RT-22 | P0 | O backend deve possuir logs estruturados e observabilidade mínima. | Erros de integração, falhas de importação, tempo de processamento e ações críticas devem ser rastreáveis. |
| RT-23 | P0 | O backend deve possuir estratégia de backup e recuperação. | Banco, arquivos e trilha de auditoria devem possuir rotina de backup e teste de restauração. |
| RT-24 | P1 | O backend deve suportar importação assistida de legado. | Arquivos históricos devem poder entrar por lote, com metadados mínimos, validação e prioridade de migração. |

## 5. Requisitos não técnicos

| ID | Prioridade | Requisito | Critério de aceite |
|---|---|---|---|
| RNT-01 | P0 | O projeto deve definir responsáveis pela governança dos dados. | Deve existir responsável funcional por dados regulatórios, evidências, permissões e validação de vínculos. |
| RNT-02 | P0 | O projeto deve definir matriz de responsabilidade. | Obras, licenças, condicionantes e obrigações devem possuir área responsável, responsável operacional e aprovador quando aplicável. |
| RNT-03 | P0 | O projeto deve definir política de metadados obrigatórios. | Não deve ser possível publicar evidência oficial sem contexto mínimo: origem, tipo, vínculo, responsável, confidencialidade e data. |
| RNT-04 | P0 | O projeto deve definir fluxo de homologação das evidências. | Deve existir processo claro para aprovar, rejeitar, corrigir vínculo ou solicitar complemento de uma evidência. |
| RNT-05 | P0 | O projeto deve definir política de acesso e confidencialidade. | Perfis de usuário, áreas, empresas terceiras e documentos sensíveis devem ter regra de acesso validada pela organização. |
| RNT-06 | P0 | O projeto deve alinhar requisitos de LGPD e segurança da informação. | Dados pessoais ou sensíveis devem ter finalidade, base de acesso, minimização e tratamento documentados. |
| RNT-07 | P1 | O projeto deve definir plano de migração progressiva. | O legado deve ser priorizado por licenças ativas, condicionantes críticas, auditorias e processos em andamento. |
| RNT-08 | P1 | O projeto deve definir plano de adoção e treinamento. | Usuários-chave devem receber treinamento para consulta, validação, auditoria, upload eventual e leitura de alertas. |
| RNT-09 | P1 | O projeto deve definir processo de suporte operacional. | Deve existir fluxo para reportar erro de importação, corrigir vínculo, reprocessar documento e tratar inconsistência. |
| RNT-10 | P0 | O projeto deve definir critérios de aceite da entrega. | A entrega deve ser validada com cenários reais de importação, consulta, evidência, prazo, auditoria e exportação. |
| RNT-11 | P1 | O projeto deve definir governança para mudanças em planilhas fonte. | Alterações de estrutura em Google Sheets monitorados devem ser comunicadas e homologadas antes de impactar produção. |
| RNT-12 | P1 | O projeto deve definir responsabilidade sobre documentos externos. | Documentos vindos de órgãos externos ou contratadas devem ter origem, responsável por conferência e status de validade. |
| RNT-13 | P1 | O projeto deve estabelecer rotina de revisão de prazos e riscos. | Alertas e riscos devem ser revisados periodicamente por responsáveis definidos. |
| RNT-14 | P2 | O projeto deve definir política de uso da IA. | Usuários devem saber que respostas da IA são apoio à consulta e devem conter fontes, limites e registro de auditoria. |

## 6. Requisitos mínimos para MVP

- Integração inicial com Google Drive.
- Integração inicial com Google Sheets.
- Fila de importação e registro de origem.
- Banco relacional com entidades centrais.
- Object storage versionado.
- Validação humana de evidências.
- Auditoria imutável.
- Exclusão lógica.
- Busca por filtros estruturados.
- Agenda de prazos e recorrências.
- Painel inicial de riscos.
- Exportação controlada ou dossiê básico.
- Controle de acesso por perfil.
- Logs operacionais e backup.

## 7. Critérios gerais de aceite do projeto

- O sistema importa documento do Google Drive e preserva origem, versão, metadados e arquivo original.
- O sistema lê dados de Google Sheets e registra a linha/aba de origem.
- Uma evidência pode ser vinculada a obrigação, licença, condicionante, responsável e protocolo.
- Alterações relevantes aparecem na trilha de auditoria.
- Exclusões são lógicas e mantêm histórico.
- Usuários sem permissão não acessam documentos ou dados restritos.
- Prazos e recorrências geram alertas operacionais.
- O sistema permite consultar informações pela aplicação, sem depender de busca manual no Google Workspace.
- Um dossiê ou exportação registra escopo, usuário, finalidade e documentos incluídos.
- A base fica preparada para futura camada de IA/RAG sem comprometer segurança e auditoria.

## 8. Entregáveis esperados

- Backend com APIs de importação, consulta, operação, auditoria e exportação.
- Integrações iniciais com Google Drive e Google Sheets.
- Modelo de dados implementado e documentado.
- Tabelas e eventos de auditoria.
- Storage versionado para documentos.
- Busca estruturada e textual inicial.
- Agenda e motor inicial de risco.
- Dossiê/exportação controlada.
- Documentação técnica de setup, operação, permissões e reprocessamento.
- Plano de migração progressiva e critérios de homologação.

## 9. Observação final

O sucesso do projeto depende menos da criação manual de cadastros e mais da capacidade de transformar fontes já utilizadas pela operação em uma base governada, auditável e consultável. A plataforma deve preservar o conforto operacional do Google Workspace, mas deslocar a governança, a consulta e a comprovação para o backend e para a aplicação.

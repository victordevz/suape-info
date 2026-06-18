# Prontidao ANPD/LGPD do Banco

Este projeto ja possui uma base tecnica para governanca, mas ainda nao deve ser tratado como plenamente adequado a ANPD/LGPD.

## O que ja existe no banco

| Tema | Status | Implementacao atual |
|---|---:|---|
| Auditoria operacional | Parcial | `AuditEvent` registra ator, acao, recurso, dados anteriores/novos, justificativa, IP e correlacao. |
| Exclusao logica | Parcial | Entidades principais usam `deletedAt` para evitar apagamento fisico no fluxo comum. |
| Classificacao de confidencialidade | Parcial | `ConfidentialityLevel` existe em licencas/autorizacoes, clausulas regulatorias, obrigacoes, evidencias e documentos. |
| Controle de acesso | Parcial | `User`, `Role`, `Permission` e `Area` existem, mas ainda falta enforcement nos endpoints. |
| Rastreabilidade de origem | Parcial | `SourceRecord` guarda tipo de fonte, arquivo, planilha, aba, linha, versao, captura e metadados. |
| Evidencia validada por humano | Parcial | `Evidence` tem `validatedAt`, `validatedById` e `status`. |
| Registro de eventos de IA | Inicial | `AuditAction.AI_QUERY` existe, mas ainda nao ha modelo especifico para pergunta, fontes e resposta. |

## O que ainda falta para uma base ANPD/LGPD mais completa

| Lacuna | Por que importa | Sugestao de implementacao |
|---|---|---|
| Inventario de tratamento de dados pessoais | Sustenta finalidade, adequacao, necessidade e prestacao de contas. | Criar tabela `DataProcessingActivity` com finalidade, base legal, categorias de dados, titulares, operador/controlador, retencao e compartilhamentos. |
| Base legal por tratamento | Nem todo tratamento depende de consentimento; a base precisa estar registrada. | Criar enum `LegalBasis` e relacionar ao inventario de tratamento. |
| Retencao e descarte | `deletedAt` nao e politica de retencao. | Adicionar `retentionUntil`, `retentionReason` e processo de descarte/anonimizacao. |
| Direitos do titular | Confirmacao, acesso, correcao, eliminacao, oposicao e outros direitos precisam de fluxo rastreavel. | Criar `DataSubjectRequest` com tipo, status, prazo, resposta e auditoria. |
| Incidentes de seguranca | ANPD pode exigir comunicacao e plano de resposta em caso de incidente. | Criar `SecurityIncident` com severidade, dados afetados, titulares, medidas tomadas e comunicacoes. |
| Minimização e dados sensiveis | Confidencialidade nao identifica dado pessoal/sensivel nem minimizacao. | Adicionar classificacao de dado pessoal/sensivel por campo, documento ou categoria. |
| Imutabilidade forte da auditoria | A tabela de auditoria existe, mas ainda pode ser alterada por quem tem acesso ao banco. | Aplicar controles de permissao, append-only por politica de aplicacao e, depois, hash chain ou storage WORM. |
| Mascaramento e acesso por sensibilidade | O schema tem confidencialidade, mas nao ha regra de mascaramento. | Implementar guard/policy no backend e registrar downloads/exportacoes em `AuditEvent`. |

## Conclusao

O banco ja esta bem encaminhado para auditoria, rastreabilidade e governanca regulatoria. Para dizer que esta padronizado para ANPD/LGPD, ainda faltam modelos e fluxos especificos de privacidade, principalmente inventario de tratamento, base legal, retencao, direitos dos titulares, incidentes e enforcement real de acesso.

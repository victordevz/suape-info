# Promptbase - Dashboard de acompanhamento de licencas por triagem IA

Esta pasta reune a base de prompt para criar uma nova rota/tela no dashboard, dentro do Figma ja existente da "Central de Dados e Evidencias - Primeira Tela".

## Figma de referencia

- Arquivo: Central de Dados e Evidencias - Primeira Tela
- Link: https://www.figma.com/design/dZjHc12Hwpgrrj0UpXJNTD/Central-de-Dados-e-Evidencias---Primeira-Tela?node-id=0-1&t=8wuEEKmFNyIaTwxy-1

## Objetivo

Criar uma rota de acompanhamento das licencas identificadas automaticamente pelo backend a partir da correlacao entre:

- PDF oficial da licenca/autorizacao;
- planilha de controle de licencas;
- registros normalizados no banco;
- trechos recuperados por RAG;
- campos extraidos com fonte, citacao e confianca.

Esta rota nao deve substituir a tela de documentos. Ela deve ser uma visao operacional de acompanhamento das licencas ja identificadas e do estado do processo de triagem de cada uma.

## Arquivos

1. `01_prompt_rota_dashboard_licencas_triagem.md`
   - Prompt principal para criar a rota/tela no Figma ou frontend.

2. `02_brief_produto_ux.md`
   - Brief de produto, usuario, estados e regras de UX.

3. `03_contrato_backend_payload.md`
   - Contrato do endpoint e exemplo de payload que a tela deve consumir.

## Direcao de produto

A tela deve mostrar, para cada licenca:

- numero;
- tipo;
- orgao;
- validade;
- status da triagem;
- fonte do vencimento;
- confianca;
- pendencias;
- conflitos;
- documentos relacionados;
- origem dos dados;
- proxima acao recomendada.

O foco visual nao e "IA generica". O foco e governanca, rastreabilidade e acompanhamento operacional.

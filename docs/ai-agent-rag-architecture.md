# Arquitetura do agente IA/RAG

Este projeto deve tratar o Google Drive como fonte viva de conhecimento, mas nao como unico indice de consulta. O Drive continua sendo o local de trabalho e evidencia original; a API mantem uma camada governada com metadados, versoes, texto extraido, citacoes e trilha de auditoria.

## Fluxo principal

1. A integracao Google Drive lista pastas monitoradas e registra arquivos em `SourceDocument`.
2. Cada revisao importada gera `DocumentVersion`, com texto extraido quando possivel.
3. O `ai-gateway` recupera trechos desses documentos para respostas RAG citaveis.
4. Micro-agentes especializados enriquecem a leitura:
   - `Document Intelligence Agent`: avalia tipo, metadados, qualidade da extracao e necessidade de OCR/parser.
   - `Drive RAG Retriever`: busca trechos dos documentos importados.
   - `License Triage Agent`: cruza licencas, obrigacoes, prazos e fontes recuperadas.
   - `Citation Guard`: etapa planejada para impedir resposta final sem fonte e permissao.
5. A triagem de licencas gera um rascunho operacional com prioridades, pendencias e fontes.

## Endpoints adicionados

- `GET /api/ai-gateway/status`
- `POST /api/ai-gateway/rag/query`
- `POST /api/ai-gateway/licenses/triage`
- `GET /api/ai-gateway/documents/:id/intelligence`

Exemplo de consulta RAG:

```json
{
  "query": "renovacao licenca operacao CPRH condicionantes",
  "take": 8
}
```

Exemplo de triagem por licenca:

```json
{
  "licenseId": "4f2df8c8-1d1a-4b10-9902-64da71b184de",
  "take": 8
}
```

## Evolucao recomendada

- Adicionar indice vetorial com chunks por `DocumentVersion`, preservando `sourceDocumentId`, pagina, trecho e hash.
- Criar worker assíncrono para OCR de imagens e PDFs digitalizados.
- Criar parser dedicado para Google Sheets/XLSX, gerando `SourceRecord` por linha/aba.
- Adicionar provedor LLM atras de interface propria, com prompts versionados e saida estruturada.
- Persistir execucoes de IA com pergunta, resposta, fontes, usuario, confidencialidade e decisao humana.
- Aplicar checagem de permissao e confidencialidade antes da recuperacao RAG.

# Poketeam

Monorepo da plataforma de governanca ambiental, evidencias e dados regulatorios. A estrutura separa a API NestJS/Prisma e o frontend Next.js/TypeScript antes da publicacao no GitHub.

## Stack

- Node.js + TypeScript
- Workspaces npm
- `apps/api`: NestJS, PostgreSQL e Prisma ORM
- `apps/web`: Next.js App Router com TypeScript
- Docker Compose para ambiente local

## Estrutura

```text
apps/
  api/      API NestJS e Prisma
  web/      Frontend Next.js + TypeScript
docs/       Documentacao tecnica e banco
output/     Materiais de apoio, prompts e PDFs gerados
```

## Setup local

```bash
npm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d postgres
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev:api
```

Em outro terminal:

```bash
npm run dev:web
```

URLs locais:

- API: `http://localhost:3000/api`
- Frontend: `http://localhost:3001`

Endpoints uteis da API:

- `GET http://localhost:3000/api/health`
- `GET http://localhost:3000/api/health/database`
- `GET http://localhost:3000/api/database/docs`
- `GET http://localhost:3000/api/database/schema`
- `GET http://localhost:3000/api/database/dictionary`
- `POST http://localhost:3000/api/integrations/google-drive/connect`
- `GET http://localhost:3000/api/integrations/google-drive/status`
- `GET http://localhost:3000/api/integrations/google-drive/folders`
- `POST http://localhost:3000/api/monitored-folders`
- `POST http://localhost:3000/api/sync/google-drive/run`
- `GET http://localhost:3000/api/documents`

Ferramentas uteis:

```bash
npm run build
npm run typecheck
npm test
npm run db:studio
```

Documentacao util:

- [Visualizacao do banco](docs/database-visualization.md)
- [Dicionario do banco](docs/database-dictionary.md)
- [Prontidao ANPD/LGPD](docs/anpd-lgpd-readiness.md)
- [Credenciais Google Drive](docs/google-drive-credentials.md)
- [Arquitetura IA/RAG](docs/ai-agent-rag-architecture.md)

## Modulos iniciais

- `regulatory`: obras, licencas/autorizacoes, clausulas regulatorias, obrigacoes, processos e ocorrencias.
- `evidence`: documentos, evidencias, origem e versionamento logico.
- `responsibility`: responsaveis, areas e matriz de responsabilidade.
- `audit`: eventos auditaveis e trilha imutavel.
- `deadlines`: prazos, recorrencias e vencimentos.
- `access`: usuarios, papeis, permissoes e confidencialidade.
- `ingestion`: integracao Google Drive por OAuth, pastas monitoradas, sincronizacao manual, jobs de importacao e documentos detectados.
- `ai-gateway`: contratos iniciais para RAG sobre Drive importado, micro-agentes de leitura documental e triagem de licencas.

## Escopo desta etapa

O projeto comeca como monolito modular para acelerar a entrega do hackathon. As fronteiras dos modulos foram criadas para permitir extracao futura de servicos, especialmente ingestao e IA/RAG, sem antecipar complexidade de mensageria agora.

Nesta etapa ha integracao inicial com Google Drive para rastrear origem, metadados, versoes e extracao textual basica. Google Sheets estruturado, filas externas, object storage dedicado e IA/RAG ficam preparados para proximas iteracoes.

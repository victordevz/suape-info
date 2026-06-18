import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { DocumentFieldExtractionAgent } from '../src/modules/ai-gateway/agents/document-field-extraction.agent';
import { DocumentIntelligenceAgent } from '../src/modules/ai-gateway/agents/document-intelligence.agent';
import { DocumentTriageAgent } from '../src/modules/ai-gateway/agents/document-triage.agent';
import { LicenseTriageAgent } from '../src/modules/ai-gateway/agents/license-triage.agent';
import { OpenAiLlmClient } from '../src/modules/ai-gateway/openai-llm.client';
import { RagRetrievalService } from '../src/modules/ai-gateway/rag-retrieval.service';

const sourceDocumentId = '4f2df8c8-1d1a-4b10-9902-64da71b184de';
const documentVersionId = '7c37f9d4-4dd2-4c6d-a472-3759f2ccaa71';
const licenseId = '8a58fc1e-38cc-4ea0-bc4a-204786c3242d';

describe('ai gateway agents', () => {
  afterEach(() => {
    globalThis.fetch = undefined as unknown as typeof fetch;
  });

  it('retrieves imported Google Drive document text as RAG citations', async () => {
    const prisma = {
      documentVersion: {
        findMany: async () => [
          {
            id: documentVersionId,
            sourceDocumentId,
            revisionId: '12',
            extractedText:
              'Renovacao da Licenca de Operacao CPRH com condicionantes ambientais e prazo interno de renovacao.',
            extractionStatus: 'SUCCESS',
            extractionQuality: 0.93,
            sourceDocument: {
              id: sourceDocumentId,
              fileName: '06. Renovacao de licenca operacao.pdf',
              driveFileId: 'drive-file-1',
              driveWebUrl: 'https://drive.google.com/file/d/drive-file-1/view',
              documentMetadata: {
                documentType: 'LICENCA',
                licenseNumber: 'RLO 05.21.09.003636-1',
                processNumber: 'CPRH 123',
                validUntil: new Date('2027-06-30T00:00:00.000Z'),
              },
            },
          },
        ],
      },
    };
    const service = new RagRetrievalService(prisma as never);

    const result = await service.query({
      query: 'licenca operacao CPRH condicionantes',
      take: 3,
    });

    assert.equal(result.citations.length, 1);
    assert.equal(result.citations[0]?.sourceDocumentId, sourceDocumentId);
    assert.equal(result.citations[0]?.fileName, '06. Renovacao de licenca operacao.pdf');
    assert.match(result.citations[0]?.snippet ?? '', /Licenca de Operacao/);
    assert.equal(result.llm.status, 'not_configured');
  });

  it('detects when a Drive image document needs OCR processing', async () => {
    const prisma = {
      sourceDocument: {
        findUnique: async () => ({
          id: sourceDocumentId,
          fileName: 'foto-condicionante.jpg',
          mimeType: 'image/jpeg',
          documentMetadata: null,
          documentVersions: [],
        }),
      },
    };
    const agent = new DocumentIntelligenceAgent(prisma as never);

    const result = await agent.inspect(sourceDocumentId);

    assert.equal(result.extractionStatus, 'MISSING_VERSION');
    assert.equal(result.requiredAgent, 'ocr');
    assert.deepEqual(result.signals, ['possui_condicionantes_ou_exigencias']);
  });

  it('builds license triage from regulatory records and Drive citations', async () => {
    const prisma = {
      license: {
        findUnique: async () => ({
          id: licenseId,
          number: 'RLO 05.21.09.003636-1',
          type: 'Renovacao da Licenca de Operacao',
          status: 'ACTIVE',
          expiresAt: new Date('2027-06-30T00:00:00.000Z'),
          renewalDueAt: new Date('2027-02-28T00:00:00.000Z'),
          renewalDeadlineInternal: new Date('2027-01-30T00:00:00.000Z'),
          renewalDeadlineAuthority: new Date('2027-02-28T00:00:00.000Z'),
          issuingAgency: 'CPRH',
          processNumber: 'CPRH 123',
          cprhProcessNumber: 'CPRH 123',
          seiProcessNumber: null,
          obligations: [
            {
              title: 'Apresentar relatorio semestral',
              status: 'PENDING',
              dueDate: new Date('2026-12-31T00:00:00.000Z'),
            },
          ],
          deadlines: [
            {
              title: 'Renovar licenca',
              status: 'SCHEDULED',
              dueDate: new Date('2027-01-30T00:00:00.000Z'),
            },
          ],
        }),
      },
    };
    const rag = {
      query: async () => ({
        citations: [
          {
            sourceDocumentId,
            documentVersionId,
            fileName: '06. Renovacao de licenca operacao.pdf',
            driveFileId: 'drive-file-1',
            driveWebUrl: null,
            revisionId: '12',
            extractionStatus: 'SUCCESS',
            extractionQuality: 0.9,
            metadata: {
              documentType: 'LICENCA',
              licenseNumber: 'RLO 05.21.09.003636-1',
              processNumber: 'CPRH 123',
              validUntil: new Date('2027-06-30T00:00:00.000Z'),
            },
            snippet: 'Licenca de Operacao com condicionantes.',
            score: 10,
          },
        ],
      }),
    };
    const agent = new LicenseTriageAgent(prisma as never, rag as never);

    const result = await agent.triage({ licenseId });

    assert.equal(result.mode, 'license_record');
    assert.equal(result.license?.number, 'RLO 05.21.09.003636-1');
    assert.equal(result.pendingItems.length, 2);
    assert.equal(result.citations.length, 1);
  });

  it('builds document triage from spreadsheet rows and normalized records', async () => {
    const prisma = {
      sourceRecord: {
        findMany: async () => [
          {
            id: 'source-record-1',
            sourceKind: 'GOOGLE_SHEETS',
            spreadsheetId: 'planilha-controle-licencas-gml-2026',
            sheetName: 'LO COMPLEXO DE SUAPE CIPS',
            rowNumber: 10,
            cellRange: 'A10:N10',
            itemCode: '4.10',
            rawMetadata: { note: 'Linha da planilha real.' },
            documentAsset: {
              id: 'asset-sheet',
              fileName: '08. Planilha de Controle de Licencas (GML) 2026.xlsx',
              kind: 'OTHER',
              mimeType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              checksum: 'sheet-checksum',
            },
            regulatoryClauses: [
              {
                id: 'clause-410',
                itemCode: '4.10',
                clauseType: 'EXIGENCIA',
                text: 'Subitem 4.10 preservado como texto.',
                periodicity: null,
                status: 'ACTIVE',
                sourceDocument: {
                  id: 'asset-pdf',
                  fileName: '06. Renovacao de licenca operacao.pdf',
                  kind: 'LICENSE',
                  mimeType: 'application/pdf',
                },
                license: {
                  id: licenseId,
                  number: '05.21.09.003636-1',
                  type: 'Renovacao da Licenca de Operacao',
                  licenseKind: 'RLO',
                  issuingAgency: 'CPRH',
                  expiresAt: new Date('2026-09-09T00:00:00.000Z'),
                  status: 'ACTIVE',
                  cprhProcessNumber: '001701/2021',
                  seiProcessNumber: null,
                },
                obligations: [],
                complianceAssessments: [
                  {
                    status: 'PENDENTE',
                    weight: { toNumber: () => 1 },
                    score: { toNumber: () => 0 },
                    justification:
                      'Controle importado deve exigir avaliacao operacional.',
                  },
                ],
                evidences: [],
              },
            ],
          },
        ],
      },
    };
    const rag = {
      query: async () => ({
        citations: [
          {
            sourceDocumentId,
            documentVersionId,
            fileName: '06. Renovacao de licenca operacao.pdf',
            driveFileId: 'drive-file-1',
            driveWebUrl: null,
            revisionId: '12',
            extractionStatus: 'SUCCESS',
            extractionQuality: 0.9,
            metadata: {
              documentType: 'LICENCA',
              licenseNumber: '05.21.09.003636-1',
              processNumber: '001701/2021',
              validUntil: null,
            },
            snippet: 'Subitem 4.10 preservado como texto.',
            score: 10,
          },
        ],
      }),
    };
    const agent = new DocumentTriageAgent(
      prisma as never,
      rag as never,
      new DocumentFieldExtractionAgent(),
    );

    const result = await agent.triage({
      spreadsheetId: 'planilha-controle-licencas-gml-2026',
    });
    const row = result.rows[0];

    assert.equal(result.totals.triagedRows, 1);
    assert.equal(row?.source.itemCode, '4.10');
    assert.equal(row?.normalized.license?.number, '05.21.09.003636-1');
    assert.equal(row?.triageColumns.pendente, true);
    assert.equal(row?.triageColumns.peso, 1);
    assert.equal(row?.triageColumns.ponderacao, 0);
    assert.equal(row?.correlations.documentAssets.length, 2);
    assert.equal(row?.correlations.ragCitations.length, 1);
    assert.equal(row?.triage.status, 'needs_evidence');
  });

  it('extracts official license fields from PDF citations', () => {
    const agent = new DocumentFieldExtractionAgent();

    const result = agent.extractFromCitations([
      {
        sourceDocumentId,
        documentVersionId,
        fileName: '06. Renovacao de licenca operacao.pdf',
        driveFileId: 'drive-file-1',
        driveWebUrl: 'https://drive.google.com/file/d/drive-file-1/view',
        revisionId: '12',
        extractionStatus: 'SUCCESS',
        extractionQuality: 0.9,
        metadata: {
          documentType: 'LICENCA',
          licenseNumber: null,
          processNumber: null,
          validUntil: null,
        },
        snippet:
          'RENOVAÇÃO DA LICENÇA DE OPERAÇÃO Nº 05.21.09.003636-1 VALIDADE 09/09/2026 Agência Estadual de Meio Ambiente - CPRH protocolado sob o nº 001701/2021 expede a presente RLO.',
        score: 10,
      },
    ]);

    assert.equal(result.licenseNumber[0]?.value, '05.21.09.003636-1');
    assert.equal(result.expiresAt[0]?.value, '2026-09-09');
    assert.equal(result.issuingAgency[0]?.value, 'CPRH');
    assert.equal(result.cprhProcessNumber[0]?.value, '001701/2021');
    assert.equal(result.licenseKind[0]?.value, 'RLO');
  });

  it('builds front-ready triage sheet with field sources and citations', async () => {
    const prisma = {
      sourceRecord: {
        findMany: async () => [
          {
            id: 'source-record-1',
            sourceKind: 'GOOGLE_SHEETS',
            spreadsheetId: 'planilha-controle-licencas-gml-2026',
            sheetName: 'LO COMPLEXO DE SUAPE CIPS',
            rowNumber: 10,
            cellRange: 'A10:N10',
            itemCode: '4.10',
            rawMetadata: { note: 'Linha da planilha real.' },
            documentAsset: {
              id: 'asset-sheet',
              fileName: '08. Planilha de Controle de Licencas (GML) 2026.xlsx',
              kind: 'OTHER',
              mimeType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              checksum: 'sheet-checksum',
            },
            regulatoryClauses: [
              {
                id: 'clause-410',
                itemCode: '4.10',
                clauseType: 'EXIGENCIA',
                text: 'Subitem 4.10 preservado como texto.',
                periodicity: null,
                status: 'ACTIVE',
                sourceDocument: {
                  id: 'asset-pdf',
                  fileName: '06. Renovacao de licenca operacao.pdf',
                  kind: 'LICENSE',
                  mimeType: 'application/pdf',
                },
                license: {
                  id: licenseId,
                  number: '05.21.09.003636-1',
                  type: 'Renovacao da Licenca de Operacao',
                  licenseKind: 'RLO',
                  issuingAgency: 'CPRH',
                  expiresAt: new Date('2026-09-09T00:00:00.000Z'),
                  status: 'ACTIVE',
                  cprhProcessNumber: '001701/2021',
                  seiProcessNumber: null,
                },
                obligations: [],
                complianceAssessments: [
                  {
                    status: 'PENDENTE',
                    weight: { toNumber: () => 1 },
                    score: { toNumber: () => 0 },
                    justification:
                      'Controle importado deve exigir avaliacao operacional.',
                  },
                ],
                evidences: [],
              },
            ],
          },
        ],
      },
    };
    const rag = {
      query: async () => ({
        citations: [
          {
            sourceDocumentId,
            documentVersionId,
            fileName: '06. Renovacao de licenca operacao.pdf',
            driveFileId: 'drive-file-1',
            driveWebUrl: 'https://drive.google.com/file/d/drive-file-1/view',
            revisionId: '12',
            extractionStatus: 'SUCCESS',
            extractionQuality: 0.9,
            metadata: {
              documentType: 'LICENCA',
              licenseNumber: null,
              processNumber: null,
              validUntil: null,
            },
            snippet:
              'RENOVAÇÃO DA LICENÇA DE OPERAÇÃO Nº 05.21.09.003636-1 VALIDADE 09/09/2026 Agência Estadual de Meio Ambiente - CPRH protocolado sob o nº 001701/2021 expede a presente RLO. Subitem 4.10.',
            score: 10,
          },
        ],
      }),
    };
    const agent = new DocumentTriageAgent(
      prisma as never,
      rag as never,
      new DocumentFieldExtractionAgent(),
    );

    const result = await agent.triageSheet({
      spreadsheetId: 'planilha-controle-licencas-gml-2026',
    });

    assert.equal(result.licenseId, licenseId);
    assert.equal(result.fields.licenseNumber.value, '05.21.09.003636-1');
    assert.equal(result.fields.licenseNumber.source, 'PDF');
    assert.equal(result.fields.expiresAt.value, '2026-09-09');
    assert.equal(result.fields.triageCompliance.source, 'SPREADSHEET');
    assert.equal(result.fields.weight.value, 1);
    assert.equal(result.fields.score.value, 0);
    assert.equal(result.conflicts.length, 0);
    assert.equal(result.sources.some((source) => source.source === 'PDF'), true);
  });

  it('calls OpenAI Responses API without leaking the configured token', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init });

      return new Response(
        JSON.stringify({
          output_text:
            'A licenca possui fonte recuperada e precisa de validacao humana.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;
    const config = {
      get: (key: string) =>
        ({
          OPENAI_API_KEY: 'sk-test-secret',
          OPENAI_MODEL: 'gpt-4o-mini',
        })[key],
    };
    const client = new OpenAiLlmClient(config as never);

    const result = await client.generateRagAnswer({
      query: 'Qual a situacao da licenca?',
      citations: [
        {
          sourceDocumentId,
          documentVersionId,
          fileName: 'licenca.pdf',
          driveFileId: 'drive-file-1',
          driveWebUrl: null,
          revisionId: '1',
          extractionStatus: 'SUCCESS',
          extractionQuality: 1,
          metadata: {
            documentType: 'LICENCA',
            licenseNumber: 'LO 1',
            processNumber: 'CPRH 1',
            validUntil: null,
          },
          snippet: 'Licenca de operacao vigente.',
          score: 5,
        },
      ],
    });

    assert.equal(result?.model, 'gpt-4o-mini');
    assert.match(result?.answer ?? '', /validacao humana/);
    assert.equal(requests.length, 1);
    assert.equal(
      (requests[0]?.init?.headers as Record<string, string>).Authorization,
      'Bearer sk-test-secret',
    );
  });
});

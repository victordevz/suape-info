import { Inject, Injectable } from '@nestjs/common';
import { ComplianceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  DocumentTriageInput,
  DocumentTriageResult,
  DocumentTriageRow,
  LicenseTriageSheetResult,
  RagCitation,
  TriageConflict,
  TriageField,
  TriageFieldSource,
} from '../ai-gateway.types';
import {
  DocumentFieldExtractionAgent,
  ExtractedFieldCandidate,
} from './document-field-extraction.agent';
import { RagRetrievalService } from '../rag-retrieval.service';

type SourceRecordForTriage = Prisma.SourceRecordGetPayload<{
  include: {
    documentAsset: true;
    regulatoryClauses: {
      include: {
        license: true;
        sourceDocument: true;
        obligations: true;
        complianceAssessments: true;
        evidences: {
          include: {
            documentAsset: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class DocumentTriageAgent {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(RagRetrievalService)
    private readonly rag: RagRetrievalService,
    @Inject(DocumentFieldExtractionAgent)
    private readonly fieldExtraction: DocumentFieldExtractionAgent,
  ) {}

  async triage(input: DocumentTriageInput): Promise<DocumentTriageResult> {
    const sourceRecords = await this.prisma.sourceRecord.findMany({
      where: {
        id: input.sourceRecordId,
        spreadsheetId: input.spreadsheetId,
        sheetName: input.sheetName,
        sourceKind: input.sourceRecordId ? undefined : 'GOOGLE_SHEETS',
        regulatoryClauses: input.licenseId
          ? { some: { licenseId: input.licenseId } }
          : undefined,
      },
      include: {
        documentAsset: true,
        regulatoryClauses: {
          include: {
            license: true,
            sourceDocument: true,
            obligations: true,
            complianceAssessments: true,
            evidences: {
              include: {
                documentAsset: true,
              },
            },
          },
          orderBy: { itemCode: 'asc' },
        },
      },
      orderBy: [{ sheetName: 'asc' }, { rowNumber: 'asc' }],
      take: input.take ?? 20,
    });
    const rows = await Promise.all(
      sourceRecords.map((sourceRecord) => this.toTriageRow(sourceRecord)),
    );

    return {
      generatedAt: new Date().toISOString(),
      mode: 'spreadsheet_rows_to_normalized_triage',
      filters: input,
      totals: {
        sourceRows: sourceRecords.length,
        triagedRows: rows.length,
        rowsMissingNormalizedClause: rows.filter(
          (row) => !row.normalized.regulatoryClause,
        ).length,
      },
      rows,
    };
  }

  async triageSheet(input: DocumentTriageInput): Promise<LicenseTriageSheetResult> {
    const documentTriage = await this.triage(input);
    const rows = documentTriage.rows;
    const firstRow = rows[0];
    const license = firstRow?.normalized.license ?? null;
    const citations = this.dedupeCitations(
      rows.flatMap((row) => row.correlations.ragCitations),
    );
    const extracted = this.fieldExtraction.extractFromCitations(citations);
    const compliance = firstRow?.normalized.compliance ?? null;
    const clause = firstRow?.normalized.regulatoryClause ?? null;
    const fields = {
      licenseNumber: this.resolveField<string>('licenseNumber', [
        ...extracted.licenseNumber,
        this.databaseCandidate(license?.number, 0.88),
      ]),
      licenseType: this.resolveField<string>('licenseType', [
        this.databaseCandidate(license?.type, 0.86),
      ]),
      licenseKind: this.resolveField<string>('licenseKind', [
        ...extracted.licenseKind,
        this.databaseCandidate(license?.licenseKind, 0.85),
      ]),
      issuingAgency: this.resolveField<string>('issuingAgency', [
        ...extracted.issuingAgency,
        this.databaseCandidate(license?.issuingAgency, 0.84),
      ]),
      issueDate: this.resolveField<string>('issueDate', []),
      expiresAt: this.resolveField<string>('expiresAt', [
        ...extracted.expiresAt,
        this.databaseCandidate(this.toIsoDate(license?.expiresAt), 0.84),
      ]),
      cprhProcessNumber: this.resolveField<string>('cprhProcessNumber', [
        ...extracted.cprhProcessNumber,
      ]),
      seiProcessNumber: this.resolveField<string>('seiProcessNumber', []),
      triageCompliance: this.resolveField<ComplianceStatus>('triageCompliance', [
        this.spreadsheetCandidate(compliance?.status, firstRow?.source.cellRange, 0.9),
      ]),
      itemCode: this.resolveField<string>('itemCode', [
        this.spreadsheetCandidate(firstRow?.source.itemCode, firstRow?.source.cellRange, 0.9),
        this.databaseCandidate(clause?.itemCode, 0.82),
      ]),
      weight: this.resolveField<number>('weight', [
        this.spreadsheetCandidate(compliance?.weight, firstRow?.source.cellRange, 0.88),
      ]),
      score: this.resolveField<number>('score', [
        this.spreadsheetCandidate(compliance?.score, firstRow?.source.cellRange, 0.88),
      ]),
    };
    const conflicts = this.detectConflicts(fields);
    const rowStatuses = rows.map((row) => row.triage.status);

    return {
      licenseId: license?.id ?? input.licenseId ?? null,
      generatedAt: new Date().toISOString(),
      triageStatus: conflicts.length > 0
        ? 'needs_review'
        : rowStatuses.includes('needs_normalization')
          ? 'needs_normalization'
          : rowStatuses.includes('needs_evidence')
            ? 'needs_evidence'
            : 'ready_for_review',
      fields,
      conditions: rows
        .map((row) => row.normalized.regulatoryClause)
        .filter((condition): condition is NonNullable<typeof condition> => Boolean(condition))
        .map((condition) => ({
          id: condition.id,
          itemCode: condition.itemCode,
          clauseType: condition.clauseType,
          text: condition.text,
          sourceRecordId: firstRow?.source.sourceRecordId ?? null,
          sourceDocumentId:
            rows
              .flatMap((row) => row.correlations.documentAssets)
              .find((asset) => asset.source === 'regulatory_clause')?.id ?? null,
        })),
      obligations: rows
        .map((row) => row.normalized.obligation)
        .filter((obligation): obligation is NonNullable<typeof obligation> => Boolean(obligation)),
      conflicts,
      sources: this.buildSources(rows, citations),
      rows,
    };
  }

  private async toTriageRow(
    sourceRecord: SourceRecordForTriage,
  ): Promise<DocumentTriageRow> {
    const clause = sourceRecord.regulatoryClauses[0] ?? null;
    const obligation = clause?.obligations[0] ?? null;
    const compliance = clause?.complianceAssessments[0] ?? null;
    const ragCitations = clause ? await this.findRagCitations(clause) : [];
    const triageColumns = this.toTriageColumns(compliance);

    return {
      source: {
        sourceRecordId: sourceRecord.id,
        sourceKind: sourceRecord.sourceKind,
        spreadsheetId: sourceRecord.spreadsheetId,
        sheetName: sourceRecord.sheetName,
        rowNumber: sourceRecord.rowNumber,
        cellRange: sourceRecord.cellRange,
        itemCode: sourceRecord.itemCode,
        documentAsset: sourceRecord.documentAsset
          ? {
              id: sourceRecord.documentAsset.id,
              fileName: sourceRecord.documentAsset.fileName,
              mimeType: sourceRecord.documentAsset.mimeType,
              checksum: sourceRecord.documentAsset.checksum,
            }
          : null,
        rawMetadata: sourceRecord.rawMetadata,
      },
      normalized: {
        license: clause
          ? {
              id: clause.license.id,
              number: clause.license.number,
              type: clause.license.type,
              licenseKind: clause.license.licenseKind,
              issuingAgency: clause.license.issuingAgency,
              expiresAt: clause.license.expiresAt,
              status: clause.license.status,
            }
          : null,
        regulatoryClause: clause
          ? {
              id: clause.id,
              itemCode: clause.itemCode,
              clauseType: clause.clauseType,
              text: clause.text,
              periodicity: clause.periodicity,
              status: clause.status,
            }
          : null,
        obligation: obligation
          ? {
              id: obligation.id,
              title: obligation.title,
              status: obligation.status,
              dueDate: obligation.dueDate,
              deadlineInternal: obligation.deadlineInternal,
              deadlineAuthority: obligation.deadlineAuthority,
              criticality: obligation.criticality,
            }
          : null,
        compliance: compliance
          ? {
              status: compliance.status,
              weight: this.toNumber(compliance.weight),
              score: this.toNumber(compliance.score),
              justification: compliance.justification,
            }
          : null,
      },
      triageColumns,
      correlations: {
        documentAssets: this.getDocumentAssets(sourceRecord, clause),
        ragCitations,
      },
      triage: this.buildTriageDecision({
        hasClause: Boolean(clause),
        hasObligation: Boolean(obligation),
        hasCompliance: Boolean(compliance),
        hasEvidence: Boolean(clause?.evidences.length),
        ragCitations,
        complianceStatus: compliance?.status,
      }),
    };
  }

  private async findRagCitations(
    clause: SourceRecordForTriage['regulatoryClauses'][number],
  ) {
    const query = [
      clause.license.number,
      clause.license.cprhProcessNumber,
      clause.license.seiProcessNumber,
      clause.itemCode,
      clause.text,
    ]
      .filter(Boolean)
      .join(' ');

    if (!query.trim()) {
      return [];
    }

    const result = await this.rag.query({ query, take: 8 });

    return result.citations
      .filter((citation) => this.isRelevantCitation(citation, clause))
      .slice(0, 5);
  }

  private isRelevantCitation(
    citation: RagCitation,
    clause: SourceRecordForTriage['regulatoryClauses'][number],
  ) {
    const haystack = this.normalize(
      [
        citation.fileName,
        citation.snippet,
        citation.metadata.licenseNumber,
        citation.metadata.processNumber,
      ]
        .filter(Boolean)
        .join(' '),
    );
    const identifiers = [
      clause.license.number,
      clause.license.cprhProcessNumber,
      clause.license.seiProcessNumber,
      clause.itemCode,
      clause.license.licenseKind,
    ]
      .filter(Boolean)
      .map((value) => this.normalize(String(value)))
      .filter((value) => value.length >= 3);

    return identifiers.some((identifier) => haystack.includes(identifier));
  }

  private toTriageColumns(
    compliance: SourceRecordForTriage['regulatoryClauses'][number]['complianceAssessments'][number] | null,
  ) {
    const status = compliance?.status;

    return {
      atende: status === ComplianceStatus.ATENDE,
      atendeParcialmente: status === ComplianceStatus.ATENDE_PARCIALMENTE,
      naoAtende: status === ComplianceStatus.NAO_ATENDE,
      pendente: !status || status === ComplianceStatus.PENDENTE,
      naoAplicavel: status === ComplianceStatus.NAO_APLICAVEL,
      emValidacao: status === ComplianceStatus.EM_VALIDACAO,
      peso: this.toNumber(compliance?.weight),
      ponderacao: this.toNumber(compliance?.score),
    };
  }

  private getDocumentAssets(
    sourceRecord: SourceRecordForTriage,
    clause: SourceRecordForTriage['regulatoryClauses'][number] | null,
  ) {
    const assets = [];

    if (sourceRecord.documentAsset) {
      assets.push({
        id: sourceRecord.documentAsset.id,
        fileName: sourceRecord.documentAsset.fileName,
        kind: sourceRecord.documentAsset.kind,
        mimeType: sourceRecord.documentAsset.mimeType,
        source: 'spreadsheet' as const,
      });
    }

    if (clause?.sourceDocument) {
      assets.push({
        id: clause.sourceDocument.id,
        fileName: clause.sourceDocument.fileName,
        kind: clause.sourceDocument.kind,
        mimeType: clause.sourceDocument.mimeType,
        source: 'regulatory_clause' as const,
      });
    }

    for (const evidence of clause?.evidences ?? []) {
      assets.push({
        id: evidence.documentAsset.id,
        fileName: evidence.documentAsset.fileName,
        kind: evidence.documentAsset.kind,
        mimeType: evidence.documentAsset.mimeType,
        source: 'evidence' as const,
      });
    }

    return assets;
  }

  private buildTriageDecision(input: {
    hasClause: boolean;
    hasObligation: boolean;
    hasCompliance: boolean;
    hasEvidence: boolean;
    ragCitations: RagCitation[];
    complianceStatus?: ComplianceStatus;
  }) {
    const reasons: string[] = [];
    const nextActions: string[] = [];

    if (!input.hasClause) {
      reasons.push('Linha da planilha ainda nao possui condicionante normalizada.');
      nextActions.push('Mapear linha da planilha para RegulatoryClause.');
    }

    if (!input.hasCompliance) {
      reasons.push('Linha ainda nao possui avaliacao de atendimento normalizada.');
      nextActions.push('Criar ComplianceAssessment a partir das colunas de triagem.');
    }

    if (!input.hasEvidence) {
      reasons.push('Nenhuma evidencia vinculada diretamente ao item.');
      nextActions.push('Localizar documento comprobatorio no Drive e vincular evidencia.');
    }

    if (input.ragCitations.length === 0) {
      reasons.push('Nenhum trecho textual do Drive foi recuperado para este item.');
      nextActions.push('Reprocessar extracao/OCR dos PDFs ou planilhas relacionados.');
    }

    if (input.hasObligation) {
      reasons.push('Item ja possui obrigacao operacional correlacionada.');
    }

    const needsNormalization = !input.hasClause || !input.hasCompliance;
    const needsEvidence =
      input.complianceStatus !== ComplianceStatus.ATENDE &&
      (!input.hasEvidence || input.ragCitations.length === 0);

    return {
      status: needsNormalization
        ? 'needs_normalization' as const
        : needsEvidence
          ? 'needs_evidence' as const
          : 'ready_for_review' as const,
      confidence: this.getConfidence(input),
      reasons,
      nextActions,
    };
  }

  private getConfidence(input: {
    hasClause: boolean;
    hasObligation: boolean;
    hasCompliance: boolean;
    hasEvidence: boolean;
    ragCitations: RagCitation[];
  }) {
    let confidence = 0.25;

    if (input.hasClause) confidence += 0.25;
    if (input.hasCompliance) confidence += 0.2;
    if (input.hasObligation) confidence += 0.1;
    if (input.hasEvidence) confidence += 0.1;
    if (input.ragCitations.length > 0) confidence += 0.1;

    return Number(Math.min(confidence, 0.95).toFixed(2));
  }

  private toNumber(value: unknown) {
    if (value === undefined || value === null) {
      return null;
    }

    const parsed =
      typeof value === 'object' && 'toNumber' in value
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private resolveField<T>(
    fieldName: string,
    candidates: Array<ExtractedFieldCandidate<T> | null>,
  ): TriageField<T> {
    const validCandidates = candidates.filter(
      (candidate): candidate is ExtractedFieldCandidate<T> =>
        candidate !== null && candidate.value !== null && candidate.value !== undefined,
    );

    if (validCandidates.length === 0) {
      return {
        value: null,
        source: null,
        citation: null,
        confidence: 0,
        status: 'missing',
        candidates: [],
      };
    }

    const sorted = [...validCandidates].sort(
      (a, b) => this.getSourcePriority(fieldName, b.source) - this.getSourcePriority(fieldName, a.source) ||
        b.confidence - a.confidence,
    );
    const winner = sorted[0];
    const uniqueValues = new Set(sorted.map((candidate) => String(candidate.value)));

    return {
      value: winner.value,
      source: winner.source,
      citation: winner.citation,
      confidence: winner.confidence,
      status: uniqueValues.size > 1 ? 'conflict' : 'confirmed',
      candidates: sorted,
    };
  }

  private getSourcePriority(fieldName: string, source: TriageFieldSource) {
    if (['triageCompliance', 'weight', 'score', 'itemCode'].includes(fieldName)) {
      return source === 'SPREADSHEET' ? 5 : source === 'DATABASE' ? 4 : 3;
    }

    if (source === 'PDF') return 5;
    if (source === 'DATABASE') return 4;
    if (source === 'DRIVE_DOCUMENT') return 3;
    if (source === 'SPREADSHEET') return 2;

    return 1;
  }

  private databaseCandidate<T>(
    value: T | null | undefined,
    confidence: number,
  ): ExtractedFieldCandidate<T> | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return {
      value,
      source: 'DATABASE',
      citation: 'Valor normalizado no banco de dados.',
      confidence,
    };
  }

  private spreadsheetCandidate<T>(
    value: T | null | undefined,
    cellRange: string | null | undefined,
    confidence: number,
  ): ExtractedFieldCandidate<T> | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return {
      value,
      source: 'SPREADSHEET',
      citation: cellRange ? `Linha da planilha ${cellRange}.` : 'Linha da planilha.',
      confidence,
    };
  }

  private detectConflicts(fields: LicenseTriageSheetResult['fields']) {
    const conflicts: TriageConflict[] = [];

    for (const [field, value] of Object.entries(fields)) {
      const uniqueValues = new Map(
        value.candidates.map((candidate) => [
          String(candidate.value),
          {
            value: String(candidate.value),
            source: candidate.source,
            citation: candidate.citation,
          },
        ]),
      );

      if (uniqueValues.size <= 1) {
        continue;
      }

      conflicts.push({
        field,
        severity: ['expiresAt', 'licenseNumber', 'cprhProcessNumber'].includes(field)
          ? 'HIGH'
          : 'MEDIUM',
        values: [...uniqueValues.values()],
        recommendation: `Revisar ${field} porque as fontes retornaram valores divergentes.`,
      });
    }

    return conflicts;
  }

  private buildSources(rows: DocumentTriageRow[], citations: RagCitation[]) {
    const spreadsheetSources = rows
      .map((row) => row.source)
      .map((source) => ({
        label: `${source.sheetName ?? 'Planilha'} linha ${source.rowNumber ?? '-'}`,
        source: 'SPREADSHEET' as const,
        fileName: source.documentAsset?.fileName,
        sourceRecordId: source.sourceRecordId,
      }));
    const citationSources = citations.map((citation) => ({
      label: citation.fileName,
      source: this.citationSource(citation),
      fileName: citation.fileName,
      driveWebUrl: citation.driveWebUrl,
      documentVersionId: citation.documentVersionId,
      extractionQuality: citation.extractionQuality,
    }));

    return [...spreadsheetSources, ...citationSources];
  }

  private citationSource(citation: RagCitation): TriageFieldSource {
    if (
      citation.fileName.toLowerCase().endsWith('.pdf') ||
      citation.driveWebUrl?.includes('/file/d/')
    ) {
      return 'PDF';
    }

    if (citation.driveWebUrl?.includes('/spreadsheets/')) {
      return 'SPREADSHEET';
    }

    return 'DRIVE_DOCUMENT';
  }

  private dedupeCitations(citations: RagCitation[]) {
    const seen = new Set<string>();

    return citations.filter((citation) => {
      if (seen.has(citation.documentVersionId)) {
        return false;
      }

      seen.add(citation.documentVersionId);
      return true;
    });
  }

  private toIsoDate(value?: Date | string | null) {
    if (!value) {
      return null;
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 10);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RagCitation, RagQueryInput, RagQueryResult } from './ai-gateway.types';

type VersionWithSource = Prisma.DocumentVersionGetPayload<{
  include: {
    sourceDocument: {
      include: {
        documentMetadata: true;
      };
    };
  };
}>;

@Injectable()
export class RagRetrievalService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async query(input: RagQueryInput): Promise<RagQueryResult> {
    const terms = this.tokenize(input.query);

    if (terms.length === 0) {
      const answerDraft = 'Consulta sem termos suficientes para recuperar fontes.';

      return {
        query: input.query,
        citations: [],
        answer: answerDraft,
        answerDraft,
        llm: {
          provider: 'openai',
          model: null,
          status: 'not_configured',
        },
      };
    }

    const candidates = await this.prisma.documentVersion.findMany({
      where: {
        sourceDocumentId: input.sourceDocumentId,
        extractedText: { not: null },
      },
      include: {
        sourceDocument: {
          include: {
            documentMetadata: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
    const citations = candidates
      .map((version) => this.scoreVersion(version, terms))
      .filter((citation): citation is RagCitation => citation !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.take ?? 8);

    const answerDraft = this.buildAnswerDraft(input.query, citations);

    return {
      query: input.query,
      citations,
      answer: answerDraft,
      answerDraft,
      llm: {
        provider: 'openai',
        model: null,
        status: 'not_configured',
      },
    };
  }

  private scoreVersion(
    version: VersionWithSource,
    terms: string[],
  ): RagCitation | null {
    const text = version.extractedText ?? '';
    const normalizedText = this.normalize(text);
    let score = 0;

    for (const term of terms) {
      if (normalizedText.includes(term)) {
        score += term.length > 4 ? 2 : 1;
      }
    }

    const metadata = version.sourceDocument.documentMetadata;
    const metadataText = this.normalize(
      [
        version.sourceDocument.fileName,
        metadata?.licenseNumber,
        metadata?.processNumber,
        metadata?.documentType,
      ]
        .filter(Boolean)
        .join(' '),
    );

    for (const term of terms) {
      if (metadataText.includes(term)) {
        score += 3;
      }
    }

    if (score === 0) {
      return null;
    }

    return {
      sourceDocumentId: version.sourceDocumentId,
      documentVersionId: version.id,
      fileName: version.sourceDocument.fileName,
      driveFileId: version.sourceDocument.driveFileId,
      driveWebUrl: version.sourceDocument.driveWebUrl,
      revisionId: version.revisionId,
      extractionStatus: version.extractionStatus,
      extractionQuality: version.extractionQuality,
      metadata: {
        documentType: metadata?.documentType ?? null,
        licenseNumber: metadata?.licenseNumber ?? null,
        processNumber: metadata?.processNumber ?? null,
        validUntil: metadata?.validUntil ?? null,
      },
      snippet: this.buildSnippet(text, terms),
      score,
    };
  }

  private buildAnswerDraft(query: string, citations: RagCitation[]) {
    if (citations.length === 0) {
      return [
        'Nao encontrei fonte importada suficiente para responder com citacao.',
        'Execute a sincronizacao do Drive ou revise a extracao dos documentos relacionados.',
      ].join(' ');
    }

    const sourceNames = citations
      .slice(0, 3)
      .map((citation) => citation.fileName)
      .join('; ');

    return [
      `Rascunho baseado em ${citations.length} fonte(s) recuperada(s) para "${query}".`,
      `Principais fontes: ${sourceNames}.`,
      'Antes de gerar uma decisao operacional, valide os trechos citados e os metadados da licenca.',
    ].join(' ');
  }

  private buildSnippet(text: string, terms: string[]) {
    const normalizedText = this.normalize(text);
    const firstIndex = terms
      .map((term) => normalizedText.indexOf(term))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0] ?? 0;
    const start = Math.max(0, firstIndex - 180);
    const end = Math.min(text.length, firstIndex + 420);

    return text.slice(start, end).replace(/\s+/g, ' ').trim();
  }

  private tokenize(value: string) {
    return this.normalize(value)
      .split(' ')
      .filter((term) => term.length >= 3)
      .filter((term, index, list) => list.indexOf(term) === index);
  }

  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

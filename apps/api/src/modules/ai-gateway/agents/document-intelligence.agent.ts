import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { DocumentIntelligenceResult } from '../ai-gateway.types';

type SourceDocumentForIntelligence = Prisma.SourceDocumentGetPayload<{
  include: {
    documentMetadata: true;
    documentVersions: {
      orderBy: {
        createdAt: 'desc';
      };
      take: 1;
    };
  };
}>;

@Injectable()
export class DocumentIntelligenceAgent {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async inspect(sourceDocumentId: string): Promise<DocumentIntelligenceResult> {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { id: sourceDocumentId },
      include: {
        documentMetadata: true,
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento fonte nao encontrado.');
    }

    return this.toResult(document);
  }

  toResult(document: SourceDocumentForIntelligence): DocumentIntelligenceResult {
    const latestVersion = document.documentVersions[0];
    const signals = this.getSignals(document, latestVersion?.extractedText);

    return {
      sourceDocumentId: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      extractionStatus: latestVersion?.extractionStatus ?? 'MISSING_VERSION',
      extractionQuality: latestVersion?.extractionQuality ?? null,
      documentType: document.documentMetadata?.documentType ?? null,
      licenseNumber: document.documentMetadata?.licenseNumber ?? null,
      processNumber: document.documentMetadata?.processNumber ?? null,
      validUntil: document.documentMetadata?.validUntil ?? null,
      signals,
      requiredAgent: this.getRequiredAgent(document.mimeType, latestVersion?.extractedText),
    };
  }

  private getSignals(
    document: SourceDocumentForIntelligence,
    extractedText?: string | null,
  ) {
    const text = [document.fileName, extractedText].filter(Boolean).join(' ');
    const normalized = this.normalize(text);
    const signals: string[] = [];

    if (normalized.includes('licenca') || normalized.includes('licenca')) {
      signals.push('possivel_licenca');
    }

    if (normalized.includes('autorizacao')) {
      signals.push('possivel_autorizacao');
    }

    if (normalized.includes('condicionante') || normalized.includes('exigencia')) {
      signals.push('possui_condicionantes_ou_exigencias');
    }

    if (normalized.includes('protocolo') || normalized.includes('sei')) {
      signals.push('possui_protocolo_ou_processo');
    }

    if (document.mimeType.includes('spreadsheet') || document.mimeType.includes('sheet')) {
      signals.push('fonte_estruturada_planilha');
    }

    return signals;
  }

  private getRequiredAgent(mimeType: string, extractedText?: string | null) {
    if (mimeType.startsWith('image/')) {
      return 'ocr';
    }

    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) {
      return 'spreadsheet_parser';
    }

    if (mimeType === 'application/pdf' && !extractedText) {
      return 'ocr';
    }

    if (mimeType === 'application/pdf') {
      return 'pdf_parser';
    }

    return 'llm_metadata_extractor';
  }

  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}

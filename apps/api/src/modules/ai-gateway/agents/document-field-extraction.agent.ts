import { Injectable } from '@nestjs/common';
import type {
  RagCitation,
  TriageFieldSource,
} from '../ai-gateway.types';

export type ExtractedDocumentFields = {
  licenseNumber: ExtractedFieldCandidate<string>[];
  licenseKind: ExtractedFieldCandidate<string>[];
  issuingAgency: ExtractedFieldCandidate<string>[];
  expiresAt: ExtractedFieldCandidate<string>[];
  cprhProcessNumber: ExtractedFieldCandidate<string>[];
};

export type ExtractedFieldCandidate<T> = {
  value: T;
  source: TriageFieldSource;
  citation: string;
  confidence: number;
};

@Injectable()
export class DocumentFieldExtractionAgent {
  extractFromCitations(citations: RagCitation[]): ExtractedDocumentFields {
    const fields: ExtractedDocumentFields = {
      licenseNumber: [],
      licenseKind: [],
      issuingAgency: [],
      expiresAt: [],
      cprhProcessNumber: [],
    };

    for (const citation of citations) {
      const source = this.getCitationSource(citation);
      const text = [citation.fileName, citation.snippet].join(' ');

      this.pushMatch(fields.licenseNumber, {
        value: this.matchLicenseNumber(text),
        source,
        citation: citation.snippet,
        confidence: source === 'PDF' ? 0.95 : 0.82,
      });
      this.pushMatch(fields.expiresAt, {
        value: this.matchDate(text, /validade\s+(\d{2}\/\d{2}\/\d{4})/i),
        source,
        citation: citation.snippet,
        confidence: source === 'PDF' ? 0.93 : 0.78,
      });
      this.pushMatch(fields.cprhProcessNumber, {
        value:
          this.matchProcess(text, /protocolado\s+sob\s+o\s+n[ºo]?\s+(\d+\/\d{4})/i) ??
          this.matchProcess(text, /processo\s+(?:cprh\s+)?(?:n[ºo]?\s*)?(\d+\/\d{4})/i),
        source,
        citation: citation.snippet,
        confidence: source === 'PDF' ? 0.9 : 0.76,
      });

      if (this.normalize(text).includes('cprh')) {
        fields.issuingAgency.push({
          value: 'CPRH',
          source,
          citation: citation.snippet,
          confidence: source === 'PDF' ? 0.9 : 0.75,
        });
      }

      if (
        this.normalize(text).includes('renovacao da licenca de operacao') ||
        /\bRLO\b/i.test(text)
      ) {
        fields.licenseKind.push({
          value: 'RLO',
          source,
          citation: citation.snippet,
          confidence: source === 'PDF' ? 0.91 : 0.76,
        });
      }
    }

    return {
      licenseNumber: this.dedupe(fields.licenseNumber),
      licenseKind: this.dedupe(fields.licenseKind),
      issuingAgency: this.dedupe(fields.issuingAgency),
      expiresAt: this.dedupe(fields.expiresAt),
      cprhProcessNumber: this.dedupe(fields.cprhProcessNumber),
    };
  }

  private pushMatch<T>(
    candidates: ExtractedFieldCandidate<T>[],
    input: {
      value: T | null;
      source: TriageFieldSource;
      citation: string;
      confidence: number;
    },
  ) {
    if (input.value === null || input.value === undefined || input.value === '') {
      return;
    }

    candidates.push({
      value: input.value,
      source: input.source,
      citation: input.citation,
      confidence: input.confidence,
    });
  }

  private matchLicenseNumber(text: string) {
    return text.match(/\b\d{2}\.\d{2}\.\d{2}\.\d{6}-\d\b/)?.[0] ?? null;
  }

  private matchDate(text: string, pattern: RegExp) {
    const raw = text.match(pattern)?.[1];

    if (!raw) {
      return null;
    }

    const [day, month, year] = raw.split('/');

    if (!day || !month || !year) {
      return null;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  private matchProcess(text: string, pattern: RegExp) {
    return text.match(pattern)?.[1] ?? null;
  }

  private getCitationSource(citation: RagCitation): TriageFieldSource {
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

  private dedupe<T>(candidates: ExtractedFieldCandidate<T>[]) {
    const seen = new Set<string>();

    return candidates.filter((candidate) => {
      const key = `${String(candidate.value)}:${candidate.source}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}

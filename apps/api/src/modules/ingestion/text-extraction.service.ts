import { Injectable } from '@nestjs/common';
import { ExtractionStatus } from '@prisma/client';

export type TextExtractionResult = {
  text: string | null;
  status: ExtractionStatus;
  quality: number | null;
};

@Injectable()
export class TextExtractionService {
  extract(buffer: Buffer, mimeType: string): TextExtractionResult {
    if (mimeType === 'application/pdf') {
      return this.extractPdfText(buffer);
    }

    if (
      mimeType === 'application/json' ||
      mimeType === 'application/csv' ||
      mimeType === 'text/csv' ||
      mimeType.startsWith('text/')
    ) {
      return this.fromPlainText(buffer.toString('utf8'));
    }

    return {
      text: null,
      status: 'SKIPPED',
      quality: null,
    };
  }

  private fromPlainText(text: string): TextExtractionResult {
    const normalized = this.normalizeText(text);

    return {
      text: normalized || null,
      status: normalized ? 'SUCCESS' : 'FAILED',
      quality: normalized ? 1 : 0,
    };
  }

  private extractPdfText(buffer: Buffer): TextExtractionResult {
    const pdf = buffer.toString('latin1');
    const chunks: string[] = [];

    for (const match of pdf.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
      chunks.push(this.decodePdfLiteral(match[0].replace(/\)\s*Tj$/, '')));
    }

    for (const match of pdf.matchAll(/\[((?:.|\n|\r)*?)\]\s*TJ/g)) {
      const arrayContent = match[1] ?? '';

      for (const item of arrayContent.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
        chunks.push(this.decodePdfLiteral(item[0]));
      }
    }

    const text = this.normalizeText(chunks.join(' '));

    return {
      text: text || null,
      status: text ? 'SUCCESS' : 'FAILED',
      quality: text ? 0.6 : 0,
    };
  }

  private decodePdfLiteral(value: string) {
    const literal = value.startsWith('(') && value.endsWith(')')
      ? value.slice(1, -1)
      : value;
    let output = '';

    for (let index = 0; index < literal.length; index += 1) {
      const char = literal[index];

      if (char !== '\\') {
        output += char;
        continue;
      }

      const next = literal[index + 1];

      if (!next) {
        continue;
      }

      const mapped = this.decodeEscape(next);

      if (mapped !== undefined) {
        output += mapped;
        index += 1;
        continue;
      }

      if (/[0-7]/.test(next)) {
        const octal = literal.slice(index + 1).match(/^[0-7]{1,3}/)?.[0] ?? '';
        output += String.fromCharCode(Number.parseInt(octal, 8));
        index += octal.length;
        continue;
      }

      if (next === '\n' || next === '\r') {
        index += 1;
        continue;
      }

      output += next;
      index += 1;
    }

    return output;
  }

  private decodeEscape(value: string) {
    const escapes: Record<string, string> = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      '(': '(',
      ')': ')',
      '\\': '\\',
    };

    return escapes[value];
  }

  private normalizeText(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }
}

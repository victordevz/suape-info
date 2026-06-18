import { Injectable } from '@nestjs/common';
import { ExtractionStatus } from '@prisma/client';
import { inflateRawSync, inflateSync } from 'node:zlib';

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
      mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return this.extractXlsxText(buffer);
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
    const pdf = this.getPdfTextSources(buffer).join('\n');
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

    for (const match of pdf.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
      chunks.push(this.decodePdfHex(match[1] ?? ''));
    }

    for (const match of pdf.matchAll(/\[((?:.|\n|\r)*?)\]\s*TJ/g)) {
      const arrayContent = match[1] ?? '';

      for (const item of arrayContent.matchAll(/<([0-9A-Fa-f\s]+)>/g)) {
        chunks.push(this.decodePdfHex(item[1] ?? ''));
      }
    }

    const text = this.normalizeText(chunks.join(' '));

    return {
      text: text || null,
      status: text ? 'SUCCESS' : 'FAILED',
      quality: text ? 0.6 : 0,
    };
  }

  private getPdfTextSources(buffer: Buffer) {
    const raw = buffer.toString('latin1');
    const sources = [raw];
    const streamPattern = /<<(?:.|\n|\r)*?>>\s*stream\r?\n?((?:.|\n|\r)*?)\r?\n?endstream/g;

    for (const match of raw.matchAll(streamPattern)) {
      const fullMatch = match[0] ?? '';
      const streamData = match[1] ?? '';
      const dictionary = fullMatch.slice(0, fullMatch.indexOf('stream'));

      if (!dictionary.includes('/FlateDecode')) {
        sources.push(streamData);
        continue;
      }

      const inflated = this.inflatePdfStream(Buffer.from(streamData, 'latin1'));

      if (inflated) {
        sources.push(inflated.toString('latin1'));
      }
    }

    return sources;
  }

  private inflatePdfStream(buffer: Buffer) {
    const candidates = [
      buffer,
      buffer.subarray(1),
      buffer.subarray(0, Math.max(0, buffer.length - 1)),
    ];

    for (const candidate of candidates) {
      try {
        return inflateSync(candidate);
      } catch {
        try {
          return inflateRawSync(candidate);
        } catch {
          // Try the next stream framing.
        }
      }
    }

    return null;
  }

  private extractXlsxText(buffer: Buffer): TextExtractionResult {
    const entries = this.readZipEntries(buffer);
    const sharedStrings = this.getSharedStrings(entries);
    const sheetNames = [...entries.keys()]
      .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
      .sort((a, b) => a.localeCompare(b));
    const rows: string[] = [];

    for (const sheetName of sheetNames) {
      const xml = entries.get(sheetName)?.toString('utf8');

      if (!xml) {
        continue;
      }

      for (const rowMatch of xml.matchAll(/<row\b[^>]*>((?:.|\n|\r)*?)<\/row>/g)) {
        const cells: string[] = [];
        const rowXml = rowMatch[1] ?? '';

        for (const cellMatch of rowXml.matchAll(/<c\b([^>]*)>((?:.|\n|\r)*?)<\/c>/g)) {
          const attributes = cellMatch[1] ?? '';
          const cellXml = cellMatch[2] ?? '';
          const value = this.getXlsxCellValue(attributes, cellXml, sharedStrings);

          if (value) {
            cells.push(value);
          }
        }

        if (cells.length > 0) {
          rows.push(cells.join(' | '));
        }
      }
    }

    const text = this.normalizeText(rows.join('\n'));

    return {
      text: text || null,
      status: text ? 'SUCCESS' : 'FAILED',
      quality: text ? 0.9 : 0,
    };
  }

  private readZipEntries(buffer: Buffer) {
    const entries = new Map<string, Buffer>();
    const eocdOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

    if (eocdOffset < 0) {
      return entries;
    }

    const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    let offset = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
      if (buffer.readUInt32LE(offset) !== 0x02014b50) {
        break;
      }

      const compressionMethod = buffer.readUInt16LE(offset + 10);
      const compressedSize = buffer.readUInt32LE(offset + 20);
      const fileNameLength = buffer.readUInt16LE(offset + 28);
      const extraLength = buffer.readUInt16LE(offset + 30);
      const commentLength = buffer.readUInt16LE(offset + 32);
      const localHeaderOffset = buffer.readUInt32LE(offset + 42);
      const fileName = buffer
        .subarray(offset + 46, offset + 46 + fileNameLength)
        .toString('utf8');
      const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      const content = compressionMethod === 8
        ? inflateRawSync(compressed)
        : compressionMethod === 0
          ? compressed
          : null;

      if (content) {
        entries.set(fileName, content);
      }

      offset += 46 + fileNameLength + extraLength + commentLength;
    }

    return entries;
  }

  private getSharedStrings(entries: Map<string, Buffer>) {
    const xml = entries.get('xl/sharedStrings.xml')?.toString('utf8');

    if (!xml) {
      return [];
    }

    return [...xml.matchAll(/<si\b[^>]*>((?:.|\n|\r)*?)<\/si>/g)].map((match) =>
      this.decodeXmlText(match[1] ?? ''),
    );
  }

  private getXlsxCellValue(
    attributes: string,
    cellXml: string,
    sharedStrings: string[],
  ) {
    const type = attributes.match(/\bt="([^"]+)"/)?.[1];

    if (type === 'inlineStr') {
      return this.decodeXmlText(cellXml);
    }

    const rawValue = cellXml.match(/<v>(.*?)<\/v>/s)?.[1];

    if (!rawValue) {
      return '';
    }

    if (type === 's') {
      return sharedStrings[Number(rawValue)] ?? '';
    }

    return this.decodeXmlEntities(rawValue);
  }

  private decodeXmlText(xml: string) {
    return this.decodeXmlEntities(xml.replace(/<[^>]+>/g, ' '));
  }

  private decodeXmlEntities(value: string) {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private decodePdfHex(value: string) {
    const normalized = value.replace(/\s+/g, '');

    if (!normalized) {
      return '';
    }

    const bytes = Buffer.from(
      normalized.length % 2 === 0 ? normalized : `${normalized}0`,
      'hex',
    );

    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return bytes.subarray(2).toString('utf16le');
    }

    return bytes.toString('latin1');
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

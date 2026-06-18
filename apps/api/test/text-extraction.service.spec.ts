import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TextExtractionService } from '../src/modules/ingestion/text-extraction.service';

describe('TextExtractionService', () => {
  const service = new TextExtractionService();

  it('extracts plain text content', () => {
    const result = service.extract(
      Buffer.from('Licenca\nAmbiental  123', 'utf8'),
      'text/plain',
    );

    assert.equal(result.status, 'SUCCESS');
    assert.equal(result.text, 'Licenca Ambiental 123');
    assert.equal(result.quality, 1);
  });

  it('extracts literal text from simple textual PDFs', () => {
    const pdf = `%PDF-1.4
1 0 obj
<<>>
stream
BT /F1 12 Tf 72 712 Td (Licenca Ambiental) Tj [( Processo ) 20 (CPRH)] TJ ET
endstream
endobj
%%EOF`;
    const result = service.extract(Buffer.from(pdf, 'latin1'), 'application/pdf');

    assert.equal(result.status, 'SUCCESS');
    assert.match(result.text ?? '', /Licenca Ambiental/);
    assert.match(result.text ?? '', /Processo CPRH/);
  });

  it('skips unsupported binary formats', () => {
    const result = service.extract(
      Buffer.from([0, 1, 2, 3]),
      'application/octet-stream',
    );

    assert.equal(result.status, 'SKIPPED');
    assert.equal(result.text, null);
  });
});

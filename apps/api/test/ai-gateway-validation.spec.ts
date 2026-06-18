import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseLicenseTriageInput,
  parseRagQueryInput,
} from '../src/modules/ai-gateway/ai-gateway.validation';

const uuid = '4f2df8c8-1d1a-4b10-9902-64da71b184de';

describe('ai gateway validation', () => {
  it('parses RAG query payloads', () => {
    const dto = parseRagQueryInput({
      query: 'licenca de operacao',
      take: '5',
      sourceDocumentId: uuid,
    });

    assert.equal(dto.query, 'licenca de operacao');
    assert.equal(dto.take, 5);
    assert.equal(dto.sourceDocumentId, uuid);
  });

  it('requires a query for RAG', () => {
    assert.throws(() => parseRagQueryInput({ take: 3 }), {
      name: 'BadRequestException',
    });
  });

  it('accepts license triage by license id', () => {
    const dto = parseLicenseTriageInput({ licenseId: uuid });

    assert.equal(dto.licenseId, uuid);
  });

  it('requires license id or query for triage', () => {
    assert.throws(() => parseLicenseTriageInput({}), {
      name: 'BadRequestException',
    });
  });
});

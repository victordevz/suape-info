import { BadRequestException } from '@nestjs/common';
import {
  asRecord,
  optionalNumber,
  optionalString,
  optionalUuid,
  requiredString,
} from '../ingestion/ingestion.validation';
import type { LicenseTriageInput, RagQueryInput } from './ai-gateway.types';

export function parseRagQueryInput(body: unknown): RagQueryInput {
  const input = asRecord(body);
  const query = requiredString(input.query, 'query');

  return {
    query,
    take: parseTake(input.take),
    sourceDocumentId: optionalUuid(input.sourceDocumentId, 'sourceDocumentId'),
  };
}

export function parseLicenseTriageInput(body: unknown): LicenseTriageInput {
  const input = asRecord(body);
  const licenseId = optionalUuid(input.licenseId, 'licenseId');
  const query = optionalString(input.query, 'query');

  if (!licenseId && !query) {
    throw new BadRequestException('Informe licenseId ou query para triagem.');
  }

  return {
    licenseId,
    query,
    take: parseTake(input.take),
  };
}

function parseTake(value: unknown) {
  const parsed = optionalNumber(value, 'take') ?? 8;

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new BadRequestException('take deve ser inteiro entre 1 e 20.');
  }

  return parsed;
}

import { BadRequestException } from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ConnectGoogleDriveDto = {
  code?: string;
  state?: string;
  displayName?: string;
  connectedByUserId?: string;
  redirectUri?: string;
};

export type ListGoogleDriveFoldersQuery = {
  connectedSourceId?: string;
  q?: string;
  pageToken?: string;
};

export type CreateMonitoredFolderDto = {
  connectedSourceId: string;
  driveFolderId: string;
  folderName?: string;
  folderPath?: string;
  parentFolderId?: string;
};

export type UpdateMonitoredFolderDto = {
  folderName?: string;
  folderPath?: string | null;
  isActive?: boolean;
};

export type RunGoogleDriveSyncDto = {
  connectedSourceId?: string;
  monitoredFolderId?: string;
};

export function parseConnectGoogleDriveDto(body: unknown) {
  const input = asRecord(body);

  return {
    code: optionalString(input.code, 'code'),
    state: optionalString(input.state, 'state'),
    displayName: optionalString(input.displayName, 'displayName'),
    connectedByUserId: optionalUuid(input.connectedByUserId, 'connectedByUserId'),
    redirectUri: optionalUrl(input.redirectUri, 'redirectUri'),
  } satisfies ConnectGoogleDriveDto;
}

export function parseListGoogleDriveFoldersQuery(query: unknown) {
  const input = asRecord(query);

  return {
    connectedSourceId: optionalUuid(
      input.connectedSourceId,
      'connectedSourceId',
    ),
    q: optionalString(input.q, 'q'),
    pageToken: optionalString(input.pageToken, 'pageToken'),
  } satisfies ListGoogleDriveFoldersQuery;
}

export function parseCreateMonitoredFolderDto(body: unknown) {
  const input = asRecord(body);

  return {
    connectedSourceId: requiredUuid(
      input.connectedSourceId,
      'connectedSourceId',
    ),
    driveFolderId: requiredString(input.driveFolderId, 'driveFolderId'),
    folderName: optionalString(input.folderName, 'folderName'),
    folderPath: optionalString(input.folderPath, 'folderPath'),
    parentFolderId: optionalString(input.parentFolderId, 'parentFolderId'),
  } satisfies CreateMonitoredFolderDto;
}

export function parseUpdateMonitoredFolderDto(body: unknown) {
  const input = asRecord(body);

  return {
    folderName: optionalString(input.folderName, 'folderName'),
    folderPath: optionalNullableString(input.folderPath, 'folderPath'),
    isActive: optionalBoolean(input.isActive, 'isActive'),
  } satisfies UpdateMonitoredFolderDto;
}

export function parseRunGoogleDriveSyncDto(body: unknown) {
  const input = asRecord(body);

  return {
    connectedSourceId: optionalUuid(
      input.connectedSourceId,
      'connectedSourceId',
    ),
    monitoredFolderId: optionalUuid(input.monitoredFolderId, 'monitoredFolderId'),
  } satisfies RunGoogleDriveSyncDto;
}

export function requiredUuid(value: unknown, field: string) {
  const parsed = requiredString(value, field);

  if (!UUID_PATTERN.test(parsed)) {
    throw new BadRequestException(`${field} deve ser um UUID valido.`);
  }

  return parsed;
}

export function optionalUuid(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return requiredUuid(value, field);
}

export function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} e obrigatorio.`);
  }

  return value.trim();
}

export function optionalString(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return requiredString(value, field);
}

export function optionalNullableString(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return requiredString(value, field);
}

export function optionalBoolean(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new BadRequestException(`${field} deve ser booleano.`);
}

export function optionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} deve ser uma data ISO-8601.`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} deve ser uma data ISO-8601.`);
  }

  return parsed;
}

export function optionalNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`${field} deve ser numerico.`);
  }

  return parsed;
}

export function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[],
) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (
    typeof value !== 'string' ||
    !allowedValues.includes(value.toUpperCase() as T)
  ) {
    throw new BadRequestException(
      `${field} deve ser um de: ${allowedValues.join(', ')}.`,
    );
  }

  return value.toUpperCase() as T;
}

export function optionalUrl(value: unknown, field: string) {
  const parsed = optionalString(value, field);

  if (!parsed) {
    return undefined;
  }

  try {
    return new URL(parsed).toString();
  } catch {
    throw new BadRequestException(`${field} deve ser uma URL valida.`);
  }
}

export function asRecord(value: unknown) {
  if (value === undefined || value === null) {
    return {} as Record<string, unknown>;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Payload deve ser um objeto JSON.');
  }

  return value as Record<string, unknown>;
}

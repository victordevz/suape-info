import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseCreateMonitoredFolderDto,
  parseRunGoogleDriveSyncDto,
  parseUpdateMonitoredFolderDto,
} from '../src/modules/ingestion/ingestion.validation';

const uuid = '4f2df8c8-1d1a-4b10-9902-64da71b184de';

describe('ingestion validation', () => {
  it('parses a monitored folder payload', () => {
    const dto = parseCreateMonitoredFolderDto({
      connectedSourceId: uuid,
      driveFolderId: 'drive-folder-id',
      folderName: 'Licencas ambientais',
    });

    assert.equal(dto.connectedSourceId, uuid);
    assert.equal(dto.driveFolderId, 'drive-folder-id');
    assert.equal(dto.folderName, 'Licencas ambientais');
  });

  it('rejects missing required fields', () => {
    assert.throws(
      () =>
        parseCreateMonitoredFolderDto({
          connectedSourceId: uuid,
        }),
      { name: 'BadRequestException' },
    );
  });

  it('rejects invalid UUIDs', () => {
    assert.throws(
      () =>
        parseRunGoogleDriveSyncDto({
          monitoredFolderId: 'not-a-uuid',
        }),
      { name: 'BadRequestException' },
    );
  });

  it('accepts boolean query-style values for patch payloads', () => {
    const dto = parseUpdateMonitoredFolderDto({ isActive: 'false' });

    assert.equal(dto.isActive, false);
  });
});

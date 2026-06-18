import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { describe, it } from 'node:test';
import { CredentialsEncryptionService } from '../src/modules/ingestion/credentials-encryption.service';
import { GoogleDriveConfigService } from '../src/modules/ingestion/google-drive-config.service';

describe('CredentialsEncryptionService', () => {
  it('encrypts and decrypts credentials without leaking plaintext', () => {
    const key = randomBytes(32).toString('base64');
    const service = new CredentialsEncryptionService({
      encryptionKey: key,
    } as GoogleDriveConfigService);

    const encrypted = service.encrypt({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const decrypted = service.decrypt<{
      accessToken: string;
      refreshToken: string;
    }>(encrypted);

    assert.match(encrypted, /^v1:/);
    assert.doesNotMatch(encrypted, /access-token/);
    assert.equal(decrypted.accessToken, 'access-token');
    assert.equal(decrypted.refreshToken, 'refresh-token');
  });

  it('rejects keys that are not 32 bytes', () => {
    const service = new CredentialsEncryptionService({
      encryptionKey: 'short-key',
    } as GoogleDriveConfigService);

    assert.throws(() => service.encrypt({ accessToken: 'token' }), {
      name: 'ServiceUnavailableException',
    });
  });
});

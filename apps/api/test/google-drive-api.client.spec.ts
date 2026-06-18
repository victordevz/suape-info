import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GoogleDriveApiClient } from '../src/modules/ingestion/google-drive-api.client';
import { GoogleDriveConfigService } from '../src/modules/ingestion/google-drive-config.service';

describe('GoogleDriveApiClient', () => {
  it('builds an offline OAuth authorization URL for Drive scopes', () => {
    const client = new GoogleDriveApiClient({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/api/integrations/google-drive/oauth/callback',
      encryptionKey: '12345678901234567890123456789012',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ],
      assertOAuthConfigured() {
        return undefined;
      },
    } as unknown as GoogleDriveConfigService);

    const url = new URL(client.getAuthorizationUrl({ state: 'abc' }));

    assert.equal(url.origin, 'https://accounts.google.com');
    assert.equal(url.searchParams.get('client_id'), 'client-id');
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    assert.equal(url.searchParams.get('include_granted_scopes'), 'true');
    assert.equal(url.searchParams.get('state'), 'abc');
    assert.match(
      url.searchParams.get('scope') ?? '',
      /https:\/\/www\.googleapis\.com\/auth\/drive\.readonly/,
    );
  });
});

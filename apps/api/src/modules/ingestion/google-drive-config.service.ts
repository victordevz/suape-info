import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GOOGLE_DRIVE_SCOPES } from './google-drive.constants';

@Injectable()
export class GoogleDriveConfigService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  get clientId() {
    return this.getRequired('GOOGLE_OAUTH_CLIENT_ID');
  }

  get clientSecret() {
    return this.getRequired('GOOGLE_OAUTH_CLIENT_SECRET');
  }

  get redirectUri() {
    return (
      this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI') ??
      'http://localhost:3000/api/integrations/google-drive/oauth/callback'
    );
  }

  get encryptionKey() {
    return this.getRequired('GOOGLE_CREDENTIAL_ENCRYPTION_KEY');
  }

  get maxExtractBytes() {
    const raw = this.config.get<string>('GOOGLE_DRIVE_MAX_EXTRACT_BYTES');
    const parsed = raw ? Number(raw) : 5 * 1024 * 1024;

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new ServiceUnavailableException(
        'GOOGLE_DRIVE_MAX_EXTRACT_BYTES deve ser um numero positivo.',
      );
    }

    return parsed;
  }

  get scopes() {
    const raw = this.config.get<string>('GOOGLE_DRIVE_SCOPES');

    if (!raw) {
      return [...GOOGLE_DRIVE_SCOPES];
    }

    return raw
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  assertOAuthConfigured() {
    void this.clientId;
    void this.clientSecret;
    void this.encryptionKey;
  }

  private getRequired(key: string) {
    const value = this.config.get<string>(key);

    if (!value?.trim()) {
      throw new ServiceUnavailableException(`${key} nao configurado.`);
    }

    return value.trim();
  }
}

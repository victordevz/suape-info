import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { GoogleDriveConfigService } from './google-drive-config.service';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

@Injectable()
export class CredentialsEncryptionService {
  constructor(
    @Inject(GoogleDriveConfigService)
    private readonly config: GoogleDriveConfigService,
  ) {}

  encrypt(value: unknown) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
    const payload = Buffer.from(JSON.stringify(value), 'utf8');
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt<T>(encryptedValue: string): T {
    const [version, encodedIv, encodedTag, encodedPayload] =
      encryptedValue.split(':');

    if (
      version !== VERSION ||
      !encodedIv ||
      !encodedTag ||
      !encodedPayload
    ) {
      throw new InternalServerErrorException(
        'Formato de credencial criptografada invalido.',
      );
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      this.getKey(),
      Buffer.from(encodedIv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encodedPayload, 'base64')),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as T;
  }

  private getKey() {
    const raw = this.config.encryptionKey;
    const base64 = Buffer.from(raw, 'base64');

    if (base64.length === 32) {
      return base64;
    }

    if (/^[a-f0-9]{64}$/i.test(raw)) {
      return Buffer.from(raw, 'hex');
    }

    const utf8 = Buffer.from(raw, 'utf8');

    if (utf8.length === 32) {
      return utf8;
    }

    throw new ServiceUnavailableException(
      'GOOGLE_CREDENTIAL_ENCRYPTION_KEY deve ter 32 bytes em base64, hex ou texto UTF-8.',
    );
  }
}

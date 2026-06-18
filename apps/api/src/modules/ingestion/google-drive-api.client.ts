import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import {
  GOOGLE_DRIVE_FOLDER_MIME_TYPE,
  GOOGLE_WORKSPACE_EXPORT_MIME_TYPES,
} from './google-drive.constants';
import { GoogleDriveConfigService } from './google-drive-config.service';

const GOOGLE_OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

const FILE_FIELDS = [
  'id',
  'name',
  'mimeType',
  'webViewLink',
  'size',
  'md5Checksum',
  'modifiedTime',
  'createdTime',
  'version',
  'fileExtension',
  'parents',
  'trashed',
].join(',');

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  md5Checksum?: string;
  modifiedTime?: string;
  createdTime?: string;
  version?: string;
  fileExtension?: string;
  parents?: string[];
  trashed?: boolean;
};

export type GoogleOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type StoredGoogleOAuthCredentials = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  tokenType?: string;
};

export type DownloadedDriveContent = {
  buffer: Buffer;
  mimeType: string;
  storageObjectKey: string;
};

@Injectable()
export class GoogleDriveApiClient {
  constructor(
    @Inject(GoogleDriveConfigService)
    private readonly config: GoogleDriveConfigService,
  ) {}

  getAuthorizationUrl(input: { state?: string; redirectUri?: string }) {
    this.config.assertOAuthConfigured();

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: input.redirectUri ?? this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
    });

    if (input.state) {
      params.set('state', input.state);
    }

    return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri?: string) {
    const params = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: redirectUri ?? this.config.redirectUri,
      grant_type: 'authorization_code',
    });

    return this.fetchToken(params);
  }

  async refreshCredentials(credentials: StoredGoogleOAuthCredentials) {
    if (!credentials.refreshToken) {
      throw new BadGatewayException(
        'A conexao Google Drive nao possui refresh token para renovar o acesso.',
      );
    }

    const params = new URLSearchParams({
      refresh_token: credentials.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
    });
    const refreshed = await this.fetchToken(params);

    return {
      ...credentials,
      accessToken: refreshed.access_token,
      expiresAt: this.getExpiresAt(refreshed.expires_in),
      scope: refreshed.scope ?? credentials.scope,
      tokenType: refreshed.token_type ?? credentials.tokenType,
    } satisfies StoredGoogleOAuthCredentials;
  }

  async listFolders(
    accessToken: string,
    input: { q?: string; pageToken?: string },
  ) {
    const query = [
      `mimeType = '${GOOGLE_DRIVE_FOLDER_MIME_TYPE}'`,
      'trashed = false',
    ];

    if (input.q) {
      query.push(`name contains '${this.escapeDriveQueryValue(input.q)}'`);
    }

    return this.listFiles(accessToken, {
      q: query.join(' and '),
      pageToken: input.pageToken,
    });
  }

  async listFilesInFolder(
    accessToken: string,
    input: { folderId: string; pageToken?: string },
  ) {
    return this.listFiles(accessToken, {
      q: [
        `'${this.escapeDriveQueryValue(input.folderId)}' in parents`,
        'trashed = false',
        `mimeType != '${GOOGLE_DRIVE_FOLDER_MIME_TYPE}'`,
      ].join(' and '),
      pageToken: input.pageToken,
    });
  }

  async listChildrenInFolder(
    accessToken: string,
    input: { folderId: string; pageToken?: string },
  ) {
    return this.listFiles(accessToken, {
      q: [
        `'${this.escapeDriveQueryValue(input.folderId)}' in parents`,
        'trashed = false',
      ].join(' and '),
      pageToken: input.pageToken,
    });
  }

  async getFile(accessToken: string, fileId: string) {
    const url = new URL(`${GOOGLE_DRIVE_API_URL}/files/${fileId}`);
    url.searchParams.set('fields', FILE_FIELDS);
    url.searchParams.set('supportsAllDrives', 'true');

    return this.fetchJson<GoogleDriveFile>(url, accessToken);
  }

  async downloadForTextExtraction(
    accessToken: string,
    file: GoogleDriveFile,
    maxBytes: number,
  ): Promise<DownloadedDriveContent | null> {
    const exportMimeType = GOOGLE_WORKSPACE_EXPORT_MIME_TYPES[file.mimeType];

    if (exportMimeType) {
      const url = new URL(`${GOOGLE_DRIVE_API_URL}/files/${file.id}/export`);
      url.searchParams.set('mimeType', exportMimeType);

      return {
        buffer: await this.fetchBuffer(url, accessToken),
        mimeType: exportMimeType,
        storageObjectKey: `google-drive://files/${file.id}/export/${encodeURIComponent(
          exportMimeType,
        )}`,
      };
    }

    if (!this.isDirectExtractionSupported(file.mimeType)) {
      return null;
    }

    if (file.size && Number(file.size) > maxBytes) {
      return null;
    }

    const url = new URL(`${GOOGLE_DRIVE_API_URL}/files/${file.id}`);
    url.searchParams.set('alt', 'media');
    url.searchParams.set('supportsAllDrives', 'true');

    return {
      buffer: await this.fetchBuffer(url, accessToken),
      mimeType: file.mimeType,
      storageObjectKey: `google-drive://files/${file.id}`,
    };
  }

  private async listFiles(
    accessToken: string,
    input: { q: string; pageToken?: string },
  ) {
    const url = new URL(`${GOOGLE_DRIVE_API_URL}/files`);
    url.searchParams.set('q', input.q);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('fields', `nextPageToken, files(${FILE_FIELDS})`);
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('includeItemsFromAllDrives', 'true');
    url.searchParams.set('corpora', 'allDrives');

    if (input.pageToken) {
      url.searchParams.set('pageToken', input.pageToken);
    }

    return this.fetchJson<{
      nextPageToken?: string;
      files?: GoogleDriveFile[];
    }>(url, accessToken);
  }

  private async fetchToken(params: URLSearchParams) {
    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const json = await this.readJsonResponse<GoogleOAuthTokenResponse>(response);

    return json;
  }

  private async fetchJson<T>(url: URL, accessToken: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return this.readJsonResponse<T>(response);
  }

  private async fetchBuffer(url: URL, accessToken: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadGatewayException(await this.getGoogleError(response));
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async readJsonResponse<T>(response: Response) {
    if (!response.ok) {
      throw new BadGatewayException(await this.getGoogleError(response));
    }

    return (await response.json()) as T;
  }

  private async getGoogleError(response: Response) {
    const text = await response.text();

    return `Google API respondeu ${response.status}: ${text.slice(0, 500)}`;
  }

  private getExpiresAt(expiresInSeconds?: number) {
    if (!expiresInSeconds) {
      return undefined;
    }

    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  private escapeDriveQueryValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private isDirectExtractionSupported(mimeType: string) {
    return (
      mimeType === 'application/pdf' ||
      mimeType === 'text/csv' ||
      mimeType === 'application/csv' ||
      mimeType === 'application/json' ||
      mimeType.startsWith('text/')
    );
  }
}

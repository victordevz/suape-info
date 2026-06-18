import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  ConnectionStatus,
  DocumentMetadataStatus,
  ExtractionStatus,
  ImportJobStatus,
  ImportJobType,
  IngestedDocumentType,
  Prisma,
  SourceDocumentImportStatus,
  SourceKind,
  SyncStatus,
} from '@prisma/client';
import type {
  ConnectedSource,
  DocumentMetadata,
  DocumentVersion,
  ImportJob,
  MonitoredFolder,
  SourceDocument,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialsEncryptionService } from './credentials-encryption.service';
import {
  GoogleDriveApiClient,
  GoogleDriveFile,
  StoredGoogleOAuthCredentials,
} from './google-drive-api.client';
import { GOOGLE_DRIVE_FOLDER_MIME_TYPE } from './google-drive.constants';
import { GoogleDriveConfigService } from './google-drive-config.service';
import {
  ConnectGoogleDriveDto,
  CreateMonitoredFolderDto,
  ListGoogleDriveFoldersQuery,
  RunGoogleDriveSyncDto,
  UpdateMonitoredFolderDto,
  asRecord,
  optionalDate,
  optionalEnum,
  optionalNumber,
  optionalString,
  optionalUuid,
  parseConnectGoogleDriveDto,
  parseCreateMonitoredFolderDto,
  parseListGoogleDriveFoldersQuery,
  parseRunGoogleDriveSyncDto,
  parseUpdateMonitoredFolderDto,
  requiredUuid,
} from './ingestion.validation';
import { TextExtractionService } from './text-extraction.service';

type ConnectedSourceRecord = ConnectedSource;
type MonitoredFolderWithSource = MonitoredFolder & {
  connectedSource: ConnectedSource;
};
type SourceDocumentRecord = SourceDocument;
type DocumentResponseRecord = SourceDocument & {
  connectedSource?: ConnectedSource | null;
  monitoredFolder?: MonitoredFolder | null;
  documentMetadata?: DocumentMetadata | null;
  documentVersions?: DocumentVersion[];
};
type GoogleDriveSyncFolderScan = {
  monitoredFolderId: string;
  driveFolderId: string;
  folderName: string;
  folderPath: string | null;
  itemsReturned: number;
};
type GoogleDriveSyncItemRead = {
  driveFileId: string;
  name: string;
  mimeType: string;
  itemType: 'folder' | 'file';
  parentFolderId: string;
  parentFolderPath: string | null;
  webViewLink?: string;
  modifiedTime?: string;
};
type GoogleDriveSyncDiagnostics = {
  scannedFolders: GoogleDriveSyncFolderScan[];
  driveItemsRead: GoogleDriveSyncItemRead[];
};

@Injectable()
export class GoogleDriveIngestionService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(GoogleDriveApiClient)
    private readonly api: GoogleDriveApiClient,
    @Inject(GoogleDriveConfigService)
    private readonly config: GoogleDriveConfigService,
    @Inject(CredentialsEncryptionService)
    private readonly encryption: CredentialsEncryptionService,
    @Inject(TextExtractionService)
    private readonly textExtraction: TextExtractionService,
  ) {}

  async connect(rawBody: unknown) {
    const input = parseConnectGoogleDriveDto(rawBody);

    if (!input.code) {
      return this.getAuthorizationPayload(input);
    }

    const tokenResponse = await this.api.exchangeCodeForTokens(
      input.code,
      input.redirectUri,
    );
    const credentials: StoredGoogleOAuthCredentials = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: this.getExpiresAt(tokenResponse.expires_in),
      scope: tokenResponse.scope,
      tokenType: tokenResponse.token_type,
    };
    const displayName = input.displayName ?? 'Google Drive';
    const source = await this.prisma.connectedSource.create({
      data: {
        provider: SourceKind.GOOGLE_DRIVE,
        displayName,
        connectionStatus: ConnectionStatus.CONNECTED,
        connectedByUserId: input.connectedByUserId,
        encryptedCredentials: this.encryption.encrypt(credentials),
        credentialExpiresAt: credentials.expiresAt
          ? new Date(credentials.expiresAt)
          : undefined,
        scopes: this.getScopes(credentials.scope),
      },
    });

    await this.recordAudit({
      action: AuditAction.CREATE,
      resource: 'connected_source',
      resourceId: source.id,
      newData: this.toConnectedSourceResponse(source),
    });

    return this.toConnectedSourceResponse(source);
  }

  async completeOAuthCallback(query: unknown) {
    const input = asRecord(query);
    const error = optionalString(input.error, 'error');

    if (error) {
      throw new BadRequestException(`Google OAuth retornou erro: ${error}.`);
    }

    const code = optionalString(input.code, 'code');

    if (!code) {
      throw new BadRequestException('code e obrigatorio no callback OAuth.');
    }

    return this.connect({
      code,
      state: optionalString(input.state, 'state'),
    } satisfies ConnectGoogleDriveDto);
  }

  async getStatus() {
    const sources = await this.prisma.connectedSource.findMany({
      where: { provider: SourceKind.GOOGLE_DRIVE, deletedAt: null },
      orderBy: { connectedAt: 'desc' },
    });

    return {
      configured: this.isOAuthConfigured(),
      sources: sources.map((source) => this.toConnectedSourceResponse(source)),
    };
  }

  async disconnect(rawQuery: unknown) {
    const query = asRecord(rawQuery);
    const connectedSourceId = optionalUuid(
      query.connectedSourceId,
      'connectedSourceId',
    );
    const source = await this.resolveConnectedSource(connectedSourceId, false);
    const updated = await this.prisma.connectedSource.update({
      where: { id: source.id },
      data: {
        connectionStatus: ConnectionStatus.DISCONNECTED,
        encryptedCredentials: null,
        errorMessage: null,
      },
    });

    await this.recordAudit({
      action: AuditAction.UPDATE,
      resource: 'connected_source',
      resourceId: source.id,
      previousData: this.toConnectedSourceResponse(source),
      newData: this.toConnectedSourceResponse(updated),
    });

    return this.toConnectedSourceResponse(updated);
  }

  async listDriveFolders(rawQuery: unknown) {
    const query = parseListGoogleDriveFoldersQuery(rawQuery);
    const source = await this.resolveConnectedSource(query.connectedSourceId);
    const accessToken = await this.getAccessToken(source);
    const result = await this.api.listFolders(accessToken, query);

    return {
      nextPageToken: result.nextPageToken,
      folders: (result.files ?? []).map((file) => this.toDriveFileResponse(file)),
    };
  }

  async createMonitoredFolder(rawBody: unknown) {
    const input = parseCreateMonitoredFolderDto(rawBody);
    const source = await this.resolveConnectedSource(input.connectedSourceId);
    const accessToken = await this.getAccessToken(source);
    const folder = await this.getFolderMetadata(accessToken, input);
    const monitoredFolder = await this.prisma.monitoredFolder.upsert({
      where: {
        connectedSourceId_driveFolderId: {
          connectedSourceId: source.id,
          driveFolderId: input.driveFolderId,
        },
      },
      create: {
        connectedSourceId: source.id,
        driveFolderId: input.driveFolderId,
        folderName: folder.folderName,
        folderPath: folder.folderPath,
        parentFolderId: folder.parentFolderId,
      },
      update: {
        folderName: folder.folderName,
        folderPath: folder.folderPath,
        parentFolderId: folder.parentFolderId,
        isActive: true,
      },
    });

    await this.recordAudit({
      action: AuditAction.CREATE,
      resource: 'monitored_folder',
      resourceId: monitoredFolder.id,
      newData: this.toMonitoredFolderResponse(monitoredFolder),
    });

    return this.toMonitoredFolderResponse(monitoredFolder);
  }

  async listMonitoredFolders(rawQuery: unknown) {
    const query = asRecord(rawQuery);
    const connectedSourceId = optionalUuid(
      query.connectedSourceId,
      'connectedSourceId',
    );
    const activeOnly = query.activeOnly === undefined
      ? true
      : query.activeOnly === 'false'
        ? false
        : true;
    const folders = await this.prisma.monitoredFolder.findMany({
      where: {
        connectedSourceId,
        isActive: activeOnly ? true : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    return folders.map((folder) => this.toMonitoredFolderResponse(folder));
  }

  async updateMonitoredFolder(id: string, rawBody: unknown) {
    const folderId = requiredUuid(id, 'id');
    const input = parseUpdateMonitoredFolderDto(rawBody);
    const existing = await this.prisma.monitoredFolder.findUnique({
      where: { id: folderId },
    });

    if (!existing) {
      throw new NotFoundException('Pasta monitorada nao encontrada.');
    }

    const updated = await this.prisma.monitoredFolder.update({
      where: { id: folderId },
      data: {
        folderName: input.folderName,
        folderPath: input.folderPath,
        isActive: input.isActive,
      },
    });

    await this.recordAudit({
      action: AuditAction.UPDATE,
      resource: 'monitored_folder',
      resourceId: folderId,
      previousData: this.toMonitoredFolderResponse(existing),
      newData: this.toMonitoredFolderResponse(updated),
    });

    return this.toMonitoredFolderResponse(updated);
  }

  async deleteMonitoredFolder(id: string) {
    const folderId = requiredUuid(id, 'id');
    const existing = await this.prisma.monitoredFolder.findUnique({
      where: { id: folderId },
    });

    if (!existing) {
      throw new NotFoundException('Pasta monitorada nao encontrada.');
    }

    const updated = await this.prisma.monitoredFolder.update({
      where: { id: folderId },
      data: { isActive: false },
    });

    await this.recordAudit({
      action: AuditAction.SOFT_DELETE,
      resource: 'monitored_folder',
      resourceId: folderId,
      previousData: this.toMonitoredFolderResponse(existing),
      newData: this.toMonitoredFolderResponse(updated),
    });

    return this.toMonitoredFolderResponse(updated);
  }

  async runSync(rawBody: unknown) {
    const input = parseRunGoogleDriveSyncDto(rawBody);
    const folders = await this.getFoldersForSync(input);
    const result = {
      foldersScanned: 0,
      foldersDetected: 0,
      documentsDetected: 0,
      jobsCreated: 0,
      errors: [] as Array<{ folderId: string; message: string }>,
      scannedFolders: [] as GoogleDriveSyncFolderScan[],
      driveItemsRead: [] as GoogleDriveSyncItemRead[],
    };
    const visitedFolderIds = new Set<string>();

    for (const folder of folders) {
      try {
        const folderResult = await this.scanFolder({
          correlationId: randomUUID(),
          folder,
          visitedFolderIds,
          diagnostics: result,
        });
        result.foldersScanned += folderResult.foldersScanned;
        result.foldersDetected += folderResult.foldersDetected;
        result.documentsDetected += folderResult.documentsDetected;
        result.jobsCreated += folderResult.jobsCreated;
      } catch (error) {
        result.errors.push({
          folderId: folder.id,
          message: this.getErrorMessage(error),
        });
      }
    }

    return result;
  }

  async listJobs(rawQuery: unknown) {
    const query = asRecord(rawQuery);
    const status = optionalEnum(
      query.status,
      'status',
      Object.values(ImportJobStatus),
    );
    const jobType = optionalEnum(
      query.jobType,
      'jobType',
      Object.values(ImportJobType),
    );
    const sourceDocumentId = optionalUuid(
      query.sourceDocumentId,
      'sourceDocumentId',
    );
    const jobs = await this.prisma.importJob.findMany({
      where: { status, jobType, sourceDocumentId },
      orderBy: { createdAt: 'desc' },
      take: this.getTake(query.take),
    });

    return jobs.map((job) => this.toImportJobResponse(job));
  }

  async getJob(id: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id: requiredUuid(id, 'id') },
    });

    if (!job) {
      throw new NotFoundException('Job de importacao nao encontrado.');
    }

    return this.toImportJobResponse(job);
  }

  async retryJob(id: string) {
    const jobId = requiredUuid(id, 'id');
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        connectedSource: true,
        monitoredFolder: { include: { connectedSource: true } },
        sourceDocument: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job de importacao nao encontrado.');
    }

    const updatedJob = await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.RETRYING,
        attempts: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      },
    });

    if (job.sourceDocument) {
      const source = await this.resolveConnectedSource(
        job.sourceDocument.connectedSourceId,
      );
      const accessToken = await this.getAccessToken(source);
      const driveFile = await this.api.getFile(
        accessToken,
        job.sourceDocument.driveFileId,
      );

      return this.processDocumentVersion({
        accessToken,
        file: driveFile,
        sourceDocument: job.sourceDocument,
        importJobId: updatedJob.id,
      });
    }

    if (job.monitoredFolder) {
      await this.scanFolder({
        correlationId: job.correlationId ?? randomUUID(),
        folder: job.monitoredFolder,
        visitedFolderIds: new Set<string>(),
        diagnostics: { scannedFolders: [], driveItemsRead: [] },
      });

      return this.getJob(jobId);
    }

    throw new BadRequestException(
      'Job nao possui documento ou pasta para reprocessar.',
    );
  }

  async listDocuments(rawQuery: unknown) {
    const query = asRecord(rawQuery);
    const connectedSourceId = optionalUuid(
      query.connectedSourceId,
      'connectedSourceId',
    );
    const monitoredFolderId = optionalUuid(
      query.monitoredFolderId,
      'monitoredFolderId',
    );
    const importStatus = optionalEnum(
      query.importStatus ?? query.status,
      'importStatus',
      Object.values(SourceDocumentImportStatus),
    );
    const q = optionalString(query.q, 'q');
    const documents = await this.prisma.sourceDocument.findMany({
      where: {
        connectedSourceId,
        monitoredFolderId,
        monitoredFolder: monitoredFolderId ? undefined : { isActive: true },
        importStatus,
        fileName: q ? { contains: q, mode: 'insensitive' } : undefined,
      },
      include: {
        documentMetadata: true,
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        monitoredFolder: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: this.getTake(query.take),
      skip: this.getSkip(query.skip),
    });

    return documents.map((document) => this.toDocumentResponse(document));
  }

  async getDocumentStats(rawQuery: unknown) {
    const query = asRecord(rawQuery);
    const connectedSourceId = optionalUuid(
      query.connectedSourceId,
      'connectedSourceId',
    );
    const where = {
      connectedSourceId,
      monitoredFolder: { isActive: true },
    } satisfies Prisma.SourceDocumentWhereInput;

    const [total, imported, extracted, pending, failed, linked] = await Promise.all([
      this.prisma.sourceDocument.count({ where }),
      this.prisma.sourceDocument.count({
        where: {
          ...where,
          importStatus: {
            in: [
              SourceDocumentImportStatus.IMPORTED,
              SourceDocumentImportStatus.EXTRACTED,
              SourceDocumentImportStatus.LINKED,
              SourceDocumentImportStatus.VALIDATION_PENDING,
            ],
          },
        },
      }),
      this.prisma.sourceDocument.count({
        where: {
          ...where,
          documentVersions: {
            some: { extractionStatus: ExtractionStatus.SUCCESS },
          },
        },
      }),
      this.prisma.sourceDocument.count({
        where: {
          ...where,
          importStatus: SourceDocumentImportStatus.VALIDATION_PENDING,
        },
      }),
      this.prisma.sourceDocument.count({
        where: {
          ...where,
          importStatus: SourceDocumentImportStatus.FAILED,
        },
      }),
      this.prisma.sourceDocument.count({
        where: {
          ...where,
          importStatus: SourceDocumentImportStatus.LINKED,
        },
      }),
    ]);

    return {
      total,
      imported,
      extracted,
      pending,
      failed,
      linked,
    };
  }

  async getDocument(id: string) {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { id: requiredUuid(id, 'id') },
      include: {
        connectedSource: true,
        monitoredFolder: true,
        documentMetadata: true,
        documentVersions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento nao encontrado.');
    }

    return this.toDocumentResponse(document);
  }

  async getDocumentVersions(id: string) {
    const sourceDocumentId = requiredUuid(id, 'id');
    await this.assertSourceDocumentExists(sourceDocumentId);
    const versions = await this.prisma.documentVersion.findMany({
      where: { sourceDocumentId },
      orderBy: { createdAt: 'desc' },
    });

    return versions.map((version) => this.toDocumentVersionResponse(version));
  }

  async getDocumentPreview(id: string) {
    const sourceDocumentId = requiredUuid(id, 'id');
    await this.assertSourceDocumentExists(sourceDocumentId);
    const version = await this.prisma.documentVersion.findFirst({
      where: { sourceDocumentId },
      orderBy: { createdAt: 'desc' },
    });

    if (!version) {
      throw new NotFoundException('Documento ainda nao possui versao importada.');
    }

    return {
      sourceDocumentId,
      versionId: version.id,
      revisionId: version.revisionId,
      extractionStatus: version.extractionStatus,
      extractionQuality: version.extractionQuality,
      text: version.extractedText,
    };
  }

  async updateDocumentMetadata(id: string, rawBody: unknown) {
    const sourceDocumentId = requiredUuid(id, 'id');
    await this.assertSourceDocumentExists(sourceDocumentId);

    const input = asRecord(rawBody);
    const documentType = optionalEnum(
      input.documentType,
      'documentType',
      Object.values(IngestedDocumentType),
    );
    const metadataStatus = optionalEnum(
      input.metadataStatus,
      'metadataStatus',
      Object.values(DocumentMetadataStatus),
    );
    const confidenceScore = optionalNumber(
      input.confidenceScore,
      'confidenceScore',
    );

    if (
      confidenceScore !== undefined &&
      (confidenceScore < 0 || confidenceScore > 1)
    ) {
      throw new BadRequestException(
        'confidenceScore deve estar entre 0 e 1.',
      );
    }

    const data = {
      documentType,
      issuingAuthority: optionalString(
        input.issuingAuthority,
        'issuingAuthority',
      ),
      licenseNumber: optionalString(input.licenseNumber, 'licenseNumber'),
      validUntil: optionalDate(input.validUntil, 'validUntil'),
      issueDate: optionalDate(input.issueDate, 'issueDate'),
      processNumber: optionalString(input.processNumber, 'processNumber'),
      seiNumber: optionalString(input.seiNumber, 'seiNumber'),
      authenticationCode: optionalString(
        input.authenticationCode,
        'authenticationCode',
      ),
      confidenceScore,
      metadataStatus,
    } satisfies Prisma.DocumentMetadataUncheckedUpdateInput;

    const metadata = await this.prisma.documentMetadata.upsert({
      where: { sourceDocumentId },
      create: {
        sourceDocumentId,
        ...data,
      },
      update: data,
    });

    await this.recordAudit({
      action: AuditAction.UPDATE,
      resource: 'document_metadata',
      resourceId: metadata.id,
      newData: this.toDocumentMetadataResponse(metadata),
    });

    return this.toDocumentMetadataResponse(metadata);
  }

  async markValidationPending(id: string) {
    const sourceDocumentId = requiredUuid(id, 'id');
    const updated = await this.prisma.sourceDocument.update({
      where: { id: sourceDocumentId },
      data: { importStatus: SourceDocumentImportStatus.VALIDATION_PENDING },
    });

    await this.recordAudit({
      action: AuditAction.IMPORT_STATUS_CHANGE,
      resource: 'source_document',
      resourceId: sourceDocumentId,
      newData: this.toDocumentResponse(updated),
    });

    return this.toDocumentResponse(updated);
  }

  private getAuthorizationPayload(input: ConnectGoogleDriveDto) {
    const authorizationUrl = this.api.getAuthorizationUrl({
      state: input.state,
      redirectUri: input.redirectUri,
    });

    return {
      authorizationUrl,
      redirectUri: input.redirectUri ?? this.config.redirectUri,
      scopes: this.config.scopes,
    };
  }

  private async getFolderMetadata(
    accessToken: string,
    input: CreateMonitoredFolderDto,
  ) {
    if (input.folderName) {
      return {
        folderName: input.folderName,
        folderPath: input.folderPath,
        parentFolderId: input.parentFolderId,
      };
    }

    const driveFolder = await this.api.getFile(accessToken, input.driveFolderId);

    return {
      folderName: driveFolder.name,
      folderPath: input.folderPath ?? driveFolder.name,
      parentFolderId: input.parentFolderId ?? driveFolder.parents?.[0],
    };
  }

  private async getFoldersForSync(input: RunGoogleDriveSyncDto) {
    if (input.monitoredFolderId) {
      const folder = await this.prisma.monitoredFolder.findUnique({
        where: { id: input.monitoredFolderId },
        include: { connectedSource: true },
      });

      if (!folder) {
        throw new NotFoundException('Pasta monitorada nao encontrada.');
      }

      return [folder];
    }

    return this.prisma.monitoredFolder.findMany({
      where: {
        connectedSourceId: input.connectedSourceId,
        isActive: true,
        connectedSource: {
          provider: SourceKind.GOOGLE_DRIVE,
          connectionStatus: ConnectionStatus.CONNECTED,
        },
      },
      include: { connectedSource: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async scanFolder(
    input: {
      correlationId: string;
      folder: MonitoredFolderWithSource;
      visitedFolderIds: Set<string>;
      diagnostics: GoogleDriveSyncDiagnostics;
    },
  ) {
    const { correlationId, folder, visitedFolderIds, diagnostics } = input;

    if (visitedFolderIds.has(folder.driveFolderId)) {
      return {
        foldersScanned: 0,
        foldersDetected: 0,
        documentsDetected: 0,
        jobsCreated: 0,
      };
    }

    visitedFolderIds.add(folder.driveFolderId);
    const folderScan: GoogleDriveSyncFolderScan = {
      monitoredFolderId: folder.id,
      driveFolderId: folder.driveFolderId,
      folderName: folder.folderName,
      folderPath: folder.folderPath,
      itemsReturned: 0,
    };
    diagnostics.scannedFolders.push(folderScan);

    const scanJob = await this.prisma.importJob.create({
      data: {
        connectedSourceId: folder.connectedSourceId,
        monitoredFolderId: folder.id,
        jobType: ImportJobType.SCAN,
        status: ImportJobStatus.RUNNING,
        attempts: 1,
        startedAt: new Date(),
        correlationId,
      },
    });
    const result = {
      foldersScanned: 1,
      foldersDetected: 0,
      documentsDetected: 0,
      jobsCreated: 0,
    };

    try {
      await this.prisma.connectedSource.update({
        where: { id: folder.connectedSourceId },
        data: { syncStatus: SyncStatus.SYNCING, errorMessage: null },
      });

      const accessToken = await this.getAccessToken(folder.connectedSource);
      let pageToken: string | undefined;

      do {
        const page = await this.api.listChildrenInFolder(accessToken, {
          folderId: folder.driveFolderId,
          pageToken,
        });
        const pageFiles = page.files ?? [];
        folderScan.itemsReturned += pageFiles.length;

        for (const file of pageFiles) {
          this.recordDriveItemRead(diagnostics, folder, file);

          if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
            const detectedFolder = await this.upsertDetectedFolder({
              file,
              parentFolder: folder,
            });
            const childResult = await this.scanFolder({
              correlationId,
              folder: detectedFolder,
              visitedFolderIds,
              diagnostics,
            });

            result.foldersScanned += childResult.foldersScanned;
            result.foldersDetected += 1 + childResult.foldersDetected;
            result.documentsDetected += childResult.documentsDetected;
            result.jobsCreated += childResult.jobsCreated;

            continue;
          }

          const detected = await this.upsertDetectedFile({
            accessToken,
            correlationId,
            file,
            folder,
          });
          result.documentsDetected += 1;

          if (detected.importJobCreated) {
            result.jobsCreated += 1;
          }
        }

        pageToken = page.nextPageToken;
      } while (pageToken);

      await this.prisma.monitoredFolder.update({
        where: { id: folder.id },
        data: { lastScanAt: new Date() },
      });
      await this.prisma.connectedSource.update({
        where: { id: folder.connectedSourceId },
        data: {
          syncStatus: SyncStatus.IDLE,
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      });
      await this.prisma.importJob.update({
        where: { id: scanJob.id },
        data: {
          status: ImportJobStatus.SUCCESS,
          finishedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      const message = this.getErrorMessage(error);
      await this.prisma.connectedSource.update({
        where: { id: folder.connectedSourceId },
        data: { syncStatus: SyncStatus.FAILED, errorMessage: message },
      });
      await this.prisma.importJob.update({
        where: { id: scanJob.id },
        data: {
          status: ImportJobStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: message,
        },
      });

      throw error;
    }
  }

  private async upsertDetectedFolder(input: {
    file: GoogleDriveFile;
    parentFolder: MonitoredFolderWithSource;
  }): Promise<MonitoredFolderWithSource> {
    const folderPath = this.joinDrivePath(
      input.parentFolder.folderPath,
      input.file.name,
    );

    const folder = await this.prisma.monitoredFolder.upsert({
      where: {
        connectedSourceId_driveFolderId: {
          connectedSourceId: input.parentFolder.connectedSourceId,
          driveFolderId: input.file.id,
        },
      },
      create: {
        connectedSourceId: input.parentFolder.connectedSourceId,
        driveFolderId: input.file.id,
        folderName: input.file.name,
        folderPath,
        parentFolderId: input.parentFolder.driveFolderId,
        isActive: true,
      },
      update: {
        folderName: input.file.name,
        folderPath,
        parentFolderId: input.parentFolder.driveFolderId,
        isActive: true,
      },
      include: { connectedSource: true },
    });

    return folder;
  }

  private recordDriveItemRead(
    diagnostics: GoogleDriveSyncDiagnostics,
    folder: MonitoredFolderWithSource,
    file: GoogleDriveFile,
  ) {
    diagnostics.driveItemsRead.push({
      driveFileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      itemType:
        file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE ? 'folder' : 'file',
      parentFolderId: folder.driveFolderId,
      parentFolderPath: folder.folderPath,
      webViewLink: file.webViewLink,
      modifiedTime: file.modifiedTime,
    });
  }

  private shouldRetryExtraction(
    file: GoogleDriveFile,
    extractionStatus?: ExtractionStatus | null,
  ) {
    if (
      extractionStatus !== ExtractionStatus.FAILED &&
      extractionStatus !== ExtractionStatus.SKIPPED
    ) {
      return false;
    }

    return (
      file.mimeType === 'application/pdf' ||
      file.mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimeType === 'text/csv' ||
      file.mimeType === 'application/csv' ||
      file.mimeType === 'application/json' ||
      file.mimeType.startsWith('text/')
    );
  }

  private async upsertDetectedFile(input: {
    accessToken: string;
    correlationId: string;
    file: GoogleDriveFile;
    folder: MonitoredFolderWithSource;
  }) {
    const revisionId = this.getRevisionId(input.file);
    const existing = await this.prisma.sourceDocument.findUnique({
      where: {
        connectedSourceId_driveFileId: {
          connectedSourceId: input.folder.connectedSourceId,
          driveFileId: input.file.id,
        },
      },
    });
    const existingVersion = existing
      ? await this.prisma.documentVersion.findUnique({
          where: {
            sourceDocumentId_revisionId: {
              sourceDocumentId: existing.id,
              revisionId,
            },
          },
        })
      : null;
    const changed =
      !existing ||
      existing.driveRevisionId !== revisionId ||
      existing.checksum !== (input.file.md5Checksum ?? null) ||
      this.shouldRetryExtraction(input.file, existingVersion?.extractionStatus);
    const data = {
      monitoredFolderId: input.folder.id,
      provider: SourceKind.GOOGLE_DRIVE,
      driveRevisionId: revisionId,
      driveWebUrl: input.file.webViewLink,
      fileName: input.file.name,
      mimeType: input.file.mimeType,
      fileExtension: input.file.fileExtension ?? this.getFileExtension(input.file),
      fileSize: this.toBigInt(input.file.size),
      checksum: input.file.md5Checksum,
      folderPath: input.folder.folderPath,
      modifiedAtSource: this.toDate(input.file.modifiedTime),
      createdAtSource: this.toDate(input.file.createdTime),
      importStatus: changed
        ? SourceDocumentImportStatus.QUEUED
        : existing.importStatus,
      errorMessage: null,
    } satisfies Prisma.SourceDocumentUncheckedUpdateInput;
    const sourceDocument = existing
      ? await this.prisma.sourceDocument.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.sourceDocument.create({
          data: {
            connectedSourceId: input.folder.connectedSourceId,
            driveFileId: input.file.id,
            ...data,
          },
        });

    if (!changed) {
      return { sourceDocument, importJobCreated: false };
    }

    await this.recordAudit({
      action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
      resource: 'source_document',
      resourceId: sourceDocument.id,
      previousData: existing ? this.toDocumentResponse(existing) : undefined,
      newData: this.toDocumentResponse(sourceDocument),
      correlationId: input.correlationId,
    });

    const importJob = await this.prisma.importJob.create({
      data: {
        connectedSourceId: input.folder.connectedSourceId,
        monitoredFolderId: input.folder.id,
        sourceDocumentId: sourceDocument.id,
        jobType: ImportJobType.IMPORT,
        status: ImportJobStatus.RUNNING,
        attempts: 1,
        startedAt: new Date(),
        correlationId: input.correlationId,
      },
    });

    await this.processDocumentVersion({
      accessToken: input.accessToken,
      file: input.file,
      sourceDocument,
      importJobId: importJob.id,
    });

    return { sourceDocument, importJobCreated: true };
  }

  private async processDocumentVersion(input: {
    accessToken: string;
    file: GoogleDriveFile;
    sourceDocument: SourceDocumentRecord;
    importJobId: string;
  }) {
    const revisionId = this.getRevisionId(input.file);

    try {
      await this.prisma.importJob.update({
        where: { id: input.importJobId },
        data: {
          status: ImportJobStatus.RUNNING,
          startedAt: new Date(),
          errorMessage: null,
        },
      });

      const downloaded = await this.api.downloadForTextExtraction(
        input.accessToken,
        input.file,
        this.config.maxExtractBytes,
      );
      const extraction = downloaded
        ? this.textExtraction.extract(downloaded.buffer, downloaded.mimeType)
        : {
            text: null,
            status: ExtractionStatus.SKIPPED,
            quality: null,
          };
      const version = await this.prisma.documentVersion.upsert({
        where: {
          sourceDocumentId_revisionId: {
            sourceDocumentId: input.sourceDocument.id,
            revisionId,
          },
        },
        create: {
          sourceDocumentId: input.sourceDocument.id,
          revisionId,
          checksum: input.file.md5Checksum,
          storageObjectKey:
            downloaded?.storageObjectKey ??
            `google-drive://files/${input.file.id}`,
          extractedTextObjectKey: extraction.text
            ? `google-drive://files/${input.file.id}/revisions/${revisionId}/extracted-text`
            : undefined,
          extractedText: extraction.text,
          extractionStatus: extraction.status,
          extractionQuality: extraction.quality,
        },
        update: {
          checksum: input.file.md5Checksum,
          storageObjectKey:
            downloaded?.storageObjectKey ??
            `google-drive://files/${input.file.id}`,
          extractedTextObjectKey: extraction.text
            ? `google-drive://files/${input.file.id}/revisions/${revisionId}/extracted-text`
            : null,
          extractedText: extraction.text,
          extractionStatus: extraction.status,
          extractionQuality: extraction.quality,
        },
      });
      const importStatus =
        extraction.status === ExtractionStatus.SUCCESS
          ? SourceDocumentImportStatus.EXTRACTED
          : SourceDocumentImportStatus.IMPORTED;
      const sourceDocument = await this.prisma.sourceDocument.update({
        where: { id: input.sourceDocument.id },
        data: {
          importStatus,
          lastImportedAt: new Date(),
          errorMessage: null,
        },
      });
      const importJob = await this.prisma.importJob.update({
        where: { id: input.importJobId },
        data: {
          status: ImportJobStatus.SUCCESS,
          finishedAt: new Date(),
          errorMessage: null,
        },
      });

      await this.recordAudit({
        action: AuditAction.IMPORT_STATUS_CHANGE,
        resource: 'source_document',
        resourceId: input.sourceDocument.id,
        newData: this.toDocumentResponse(sourceDocument),
        correlationId: importJob.correlationId ?? undefined,
      });

      return {
        sourceDocument: this.toDocumentResponse(sourceDocument),
        version: this.toDocumentVersionResponse(version),
        importJob: this.toImportJobResponse(importJob),
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      await this.prisma.sourceDocument.update({
        where: { id: input.sourceDocument.id },
        data: {
          importStatus: SourceDocumentImportStatus.FAILED,
          errorMessage: message,
        },
      });
      await this.prisma.importJob.update({
        where: { id: input.importJobId },
        data: {
          status: ImportJobStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: message,
        },
      });

      throw error;
    }
  }

  private async resolveConnectedSource(
    connectedSourceId?: string,
    requireConnected = true,
  ) {
    const source = connectedSourceId
      ? await this.prisma.connectedSource.findUnique({
          where: { id: connectedSourceId },
        })
      : await this.prisma.connectedSource.findFirst({
          where: {
            provider: SourceKind.GOOGLE_DRIVE,
            deletedAt: null,
            connectionStatus: requireConnected
              ? ConnectionStatus.CONNECTED
              : undefined,
          },
          orderBy: { connectedAt: 'desc' },
        });

    if (!source) {
      throw new NotFoundException('Fonte Google Drive nao encontrada.');
    }

    if (
      requireConnected &&
      source.connectionStatus !== ConnectionStatus.CONNECTED
    ) {
      throw new BadRequestException('Fonte Google Drive nao esta conectada.');
    }

    if (requireConnected && !source.encryptedCredentials) {
      throw new BadRequestException('Fonte Google Drive sem credenciais.');
    }

    return source;
  }

  private async getAccessToken(source: ConnectedSourceRecord) {
    if (!source.encryptedCredentials) {
      throw new BadRequestException('Fonte Google Drive sem credenciais.');
    }

    const credentials =
      this.encryption.decrypt<StoredGoogleOAuthCredentials>(
        source.encryptedCredentials,
      );

    if (!this.shouldRefresh(credentials)) {
      return credentials.accessToken;
    }

    try {
      const refreshed = await this.api.refreshCredentials(credentials);
      await this.prisma.connectedSource.update({
        where: { id: source.id },
        data: {
          encryptedCredentials: this.encryption.encrypt(refreshed),
          credentialExpiresAt: refreshed.expiresAt
            ? new Date(refreshed.expiresAt)
            : undefined,
          connectionStatus: ConnectionStatus.CONNECTED,
          errorMessage: null,
        },
      });

      return refreshed.accessToken;
    } catch (error) {
      await this.prisma.connectedSource.update({
        where: { id: source.id },
        data: {
          connectionStatus: ConnectionStatus.EXPIRED,
          errorMessage: this.getErrorMessage(error),
        },
      });

      throw error;
    }
  }

  private shouldRefresh(credentials: StoredGoogleOAuthCredentials) {
    if (!credentials.expiresAt) {
      return false;
    }

    return new Date(credentials.expiresAt).getTime() - Date.now() < 60_000;
  }

  private async assertSourceDocumentExists(sourceDocumentId: string) {
    const exists = await this.prisma.sourceDocument.findUnique({
      where: { id: sourceDocumentId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Documento nao encontrado.');
    }
  }

  private async recordAudit(input: {
    action: AuditAction;
    resource: string;
    resourceId?: string;
    previousData?: unknown;
    newData?: unknown;
    correlationId?: string;
  }) {
    await this.prisma.auditEvent.create({
      data: {
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        previousData: this.toJson(input.previousData),
        newData: this.toJson(input.newData),
        correlationId: input.correlationId,
      },
    });
  }

  private getTake(value: unknown) {
    const parsed = optionalNumber(value, 'take') ?? 50;

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException('take deve ser inteiro entre 1 e 100.');
    }

    return parsed;
  }

  private getSkip(value: unknown) {
    const parsed = optionalNumber(value, 'skip') ?? 0;

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException('skip deve ser inteiro maior ou igual a 0.');
    }

    return parsed;
  }

  private getScopes(scope?: string) {
    if (!scope) {
      return this.config.scopes;
    }

    return scope.split(' ').map((item) => item.trim()).filter(Boolean);
  }

  private getExpiresAt(expiresInSeconds?: number) {
    if (!expiresInSeconds) {
      return undefined;
    }

    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  private getRevisionId(file: GoogleDriveFile) {
    return file.version ?? file.modifiedTime ?? file.md5Checksum ?? 'unknown';
  }

  private getFileExtension(file: GoogleDriveFile) {
    const [, extension] = /(?:\.([^.]+))?$/.exec(file.name) ?? [];

    return extension?.toLowerCase();
  }

  private joinDrivePath(parentPath: string | null, folderName: string) {
    const normalizedParent = parentPath?.trim();

    if (!normalizedParent || normalizedParent === '/') {
      return `/${folderName}`;
    }

    return `${normalizedParent.replace(/\/$/, '')}/${folderName}`;
  }

  private toBigInt(value?: string) {
    return value ? BigInt(value) : undefined;
  }

  private toDate(value?: string) {
    return value ? new Date(value) : undefined;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private isOAuthConfigured() {
    try {
      this.config.assertOAuthConfigured();
      return true;
    } catch {
      return false;
    }
  }

  private toConnectedSourceResponse(source: ConnectedSourceRecord) {
    return {
      id: source.id,
      provider: source.provider,
      displayName: source.displayName,
      connectionStatus: source.connectionStatus,
      connectedByUserId: source.connectedByUserId,
      connectedAt: source.connectedAt,
      lastSyncAt: source.lastSyncAt,
      syncStatus: source.syncStatus,
      errorMessage: source.errorMessage,
      credentialExpiresAt: source.credentialExpiresAt,
      scopes: source.scopes,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  private toMonitoredFolderResponse(
    folder: MonitoredFolder,
  ) {
    return {
      id: folder.id,
      connectedSourceId: folder.connectedSourceId,
      driveFolderId: folder.driveFolderId,
      folderName: folder.folderName,
      folderPath: folder.folderPath,
      parentFolderId: folder.parentFolderId,
      isActive: folder.isActive,
      lastScanAt: folder.lastScanAt,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  private toDocumentResponse(document: DocumentResponseRecord) {
    return {
      id: document.id,
      connectedSourceId: document.connectedSourceId,
      monitoredFolderId: document.monitoredFolderId,
      provider: document.provider,
      driveFileId: document.driveFileId,
      driveRevisionId: document.driveRevisionId,
      driveWebUrl: document.driveWebUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileExtension: document.fileExtension,
      fileSize: document.fileSize?.toString() ?? null,
      checksum: document.checksum,
      folderPath: document.folderPath,
      modifiedAtSource: document.modifiedAtSource,
      createdAtSource: document.createdAtSource,
      importStatus: document.importStatus,
      lastImportedAt: document.lastImportedAt,
      errorMessage: document.errorMessage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      documentMetadata: 'documentMetadata' in document && document.documentMetadata
        ? this.toDocumentMetadataResponse(document.documentMetadata)
        : undefined,
      latestVersion:
        'documentVersions' in document &&
        Array.isArray(document.documentVersions) &&
        document.documentVersions[0]
          ? this.toDocumentVersionResponse(document.documentVersions[0])
          : undefined,
      monitoredFolder: 'monitoredFolder' in document && document.monitoredFolder
        ? this.toMonitoredFolderResponse(document.monitoredFolder)
        : undefined,
    };
  }

  private toDocumentVersionResponse(
    version: DocumentVersion,
  ) {
    return {
      id: version.id,
      sourceDocumentId: version.sourceDocumentId,
      revisionId: version.revisionId,
      checksum: version.checksum,
      storageObjectKey: version.storageObjectKey,
      extractedTextObjectKey: version.extractedTextObjectKey,
      extractionStatus: version.extractionStatus,
      extractionQuality: version.extractionQuality,
      hasExtractedText: Boolean(version.extractedText),
      createdAt: version.createdAt,
    };
  }

  private toDocumentMetadataResponse(
    metadata: DocumentMetadata,
  ) {
    return {
      id: metadata.id,
      sourceDocumentId: metadata.sourceDocumentId,
      documentType: metadata.documentType,
      issuingAuthority: metadata.issuingAuthority,
      licenseNumber: metadata.licenseNumber,
      validUntil: metadata.validUntil,
      issueDate: metadata.issueDate,
      processNumber: metadata.processNumber,
      seiNumber: metadata.seiNumber,
      authenticationCode: metadata.authenticationCode,
      confidenceScore: metadata.confidenceScore,
      metadataStatus: metadata.metadataStatus,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };
  }

  private toImportJobResponse(job: ImportJob) {
    return {
      id: job.id,
      connectedSourceId: job.connectedSourceId,
      monitoredFolderId: job.monitoredFolderId,
      sourceDocumentId: job.sourceDocumentId,
      jobType: job.jobType,
      status: job.status,
      attempts: job.attempts,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      errorMessage: job.errorMessage,
      correlationId: job.correlationId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private toDriveFileResponse(file: GoogleDriveFile) {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      size: file.size,
      modifiedTime: file.modifiedTime,
      createdTime: file.createdTime,
      parents: file.parents,
    };
  }

  private toJson(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(
      JSON.stringify(value, (_, item) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
    ) as Prisma.InputJsonValue;
  }
}

import { Module } from '@nestjs/common';
import { CredentialsEncryptionService } from './credentials-encryption.service';
import { DocumentsController } from './documents.controller';
import { GoogleDriveApiClient } from './google-drive-api.client';
import { GoogleDriveConfigService } from './google-drive-config.service';
import { GoogleDriveIngestionService } from './google-drive-ingestion.service';
import { GoogleDriveIntegrationController } from './google-drive-integration.controller';
import { MonitoredFoldersController } from './monitored-folders.controller';
import { SyncController } from './sync.controller';
import { TextExtractionService } from './text-extraction.service';

@Module({
  controllers: [
    GoogleDriveIntegrationController,
    MonitoredFoldersController,
    SyncController,
    DocumentsController,
  ],
  providers: [
    GoogleDriveConfigService,
    GoogleDriveApiClient,
    CredentialsEncryptionService,
    TextExtractionService,
    GoogleDriveIngestionService,
  ],
})
export class IngestionModule {}

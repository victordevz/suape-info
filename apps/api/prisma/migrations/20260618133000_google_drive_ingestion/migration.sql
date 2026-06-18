-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'ERROR', 'EXPIRED', 'PENDING_PERMISSION', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'SYNCING', 'FAILED');

-- CreateEnum
CREATE TYPE "SourceDocumentImportStatus" AS ENUM ('DETECTED', 'QUEUED', 'IMPORTED', 'EXTRACTED', 'CLASSIFICATION_PENDING', 'VALIDATION_PENDING', 'LINKED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ImportJobType" AS ENUM ('SCAN', 'IMPORT', 'EXTRACT_TEXT', 'EXTRACT_METADATA', 'REINDEX');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "IngestedDocumentType" AS ENUM ('LICENCA', 'AUTORIZACAO', 'PLANILHA_CONTROLE', 'OFICIO', 'RELATORIO', 'PROTOCOLO', 'AUTO_INFRACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "DocumentMetadataStatus" AS ENUM ('SUGGESTED', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "connected_sources" (
    "id" UUID NOT NULL,
    "provider" "SourceKind" NOT NULL,
    "displayName" TEXT NOT NULL,
    "connectionStatus" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "connectedByUserId" UUID,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "errorMessage" TEXT,
    "encryptedCredentials" TEXT,
    "credentialExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "connected_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitored_folders" (
    "id" UUID NOT NULL,
    "connectedSourceId" UUID NOT NULL,
    "driveFolderId" TEXT NOT NULL,
    "folderName" TEXT NOT NULL,
    "folderPath" TEXT,
    "parentFolderId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastScanAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitored_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" UUID NOT NULL,
    "connectedSourceId" UUID NOT NULL,
    "monitoredFolderId" UUID NOT NULL,
    "provider" "SourceKind" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "driveFileId" TEXT NOT NULL,
    "driveRevisionId" TEXT,
    "driveWebUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileExtension" TEXT,
    "fileSize" BIGINT,
    "checksum" TEXT,
    "folderPath" TEXT,
    "modifiedAtSource" TIMESTAMP(3),
    "createdAtSource" TIMESTAMP(3),
    "importStatus" "SourceDocumentImportStatus" NOT NULL DEFAULT 'DETECTED',
    "lastImportedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "sourceDocumentId" UUID NOT NULL,
    "revisionId" TEXT NOT NULL,
    "checksum" TEXT,
    "storageObjectKey" TEXT,
    "extractedTextObjectKey" TEXT,
    "extractedText" TEXT,
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "extractionQuality" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_metadata" (
    "id" UUID NOT NULL,
    "sourceDocumentId" UUID NOT NULL,
    "documentType" "IngestedDocumentType" NOT NULL DEFAULT 'OUTRO',
    "issuingAuthority" TEXT,
    "licenseNumber" TEXT,
    "validUntil" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "processNumber" TEXT,
    "seiNumber" TEXT,
    "authenticationCode" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "metadataStatus" "DocumentMetadataStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "connectedSourceId" UUID,
    "monitoredFolderId" UUID,
    "sourceDocumentId" UUID,
    "jobType" "ImportJobType" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connected_sources_provider_idx" ON "connected_sources"("provider");

-- CreateIndex
CREATE INDEX "connected_sources_connectionStatus_idx" ON "connected_sources"("connectionStatus");

-- CreateIndex
CREATE INDEX "connected_sources_syncStatus_idx" ON "connected_sources"("syncStatus");

-- CreateIndex
CREATE INDEX "connected_sources_connectedByUserId_idx" ON "connected_sources"("connectedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "monitored_folders_connectedSourceId_driveFolderId_key" ON "monitored_folders"("connectedSourceId", "driveFolderId");

-- CreateIndex
CREATE INDEX "monitored_folders_connectedSourceId_idx" ON "monitored_folders"("connectedSourceId");

-- CreateIndex
CREATE INDEX "monitored_folders_isActive_idx" ON "monitored_folders"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "source_documents_connectedSourceId_driveFileId_key" ON "source_documents"("connectedSourceId", "driveFileId");

-- CreateIndex
CREATE INDEX "source_documents_connectedSourceId_idx" ON "source_documents"("connectedSourceId");

-- CreateIndex
CREATE INDEX "source_documents_monitoredFolderId_idx" ON "source_documents"("monitoredFolderId");

-- CreateIndex
CREATE INDEX "source_documents_driveFileId_idx" ON "source_documents"("driveFileId");

-- CreateIndex
CREATE INDEX "source_documents_importStatus_idx" ON "source_documents"("importStatus");

-- CreateIndex
CREATE INDEX "source_documents_modifiedAtSource_idx" ON "source_documents"("modifiedAtSource");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_sourceDocumentId_revisionId_key" ON "document_versions"("sourceDocumentId", "revisionId");

-- CreateIndex
CREATE INDEX "document_versions_sourceDocumentId_idx" ON "document_versions"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "document_versions_extractionStatus_idx" ON "document_versions"("extractionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "document_metadata_sourceDocumentId_key" ON "document_metadata"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "document_metadata_documentType_idx" ON "document_metadata"("documentType");

-- CreateIndex
CREATE INDEX "document_metadata_metadataStatus_idx" ON "document_metadata"("metadataStatus");

-- CreateIndex
CREATE INDEX "document_metadata_validUntil_idx" ON "document_metadata"("validUntil");

-- CreateIndex
CREATE INDEX "import_jobs_connectedSourceId_idx" ON "import_jobs"("connectedSourceId");

-- CreateIndex
CREATE INDEX "import_jobs_monitoredFolderId_idx" ON "import_jobs"("monitoredFolderId");

-- CreateIndex
CREATE INDEX "import_jobs_sourceDocumentId_idx" ON "import_jobs"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "import_jobs_jobType_idx" ON "import_jobs"("jobType");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "import_jobs_correlationId_idx" ON "import_jobs"("correlationId");

-- AddForeignKey
ALTER TABLE "connected_sources" ADD CONSTRAINT "connected_sources_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitored_folders" ADD CONSTRAINT "monitored_folders_connectedSourceId_fkey" FOREIGN KEY ("connectedSourceId") REFERENCES "connected_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_connectedSourceId_fkey" FOREIGN KEY ("connectedSourceId") REFERENCES "connected_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_monitoredFolderId_fkey" FOREIGN KEY ("monitoredFolderId") REFERENCES "monitored_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_metadata" ADD CONSTRAINT "document_metadata_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_connectedSourceId_fkey" FOREIGN KEY ("connectedSourceId") REFERENCES "connected_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_monitoredFolderId_fkey" FOREIGN KEY ("monitoredFolderId") REFERENCES "monitored_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

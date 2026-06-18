-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'OVERDUE', 'REVOKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConfidentialityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('GOOGLE_DRIVE', 'GOOGLE_SHEETS', 'MANUAL_UPLOAD', 'MANUAL_ENTRY', 'EXTERNAL_SYSTEM');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('LICENSE', 'CONDITION_EVIDENCE', 'PROTOCOL_PROOF', 'TECHNICAL_REPORT', 'IMAGE', 'MAP', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SOFT_DELETE', 'APPROVE', 'REJECT', 'DOWNLOAD', 'EXPORT', 'IMPORT_STATUS_CHANGE', 'AI_QUERY');

-- CreateEnum
CREATE TYPE "ResponsiblePartyType" AS ENUM ('INTERNAL_USER', 'AREA', 'CONTRACTOR', 'EXTERNAL_AGENCY');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('SCHEDULED', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RiskKind" AS ENUM ('DEADLINE_NEAR', 'MISSING_EVIDENCE', 'PROTOCOL_WITHOUT_PROOF', 'UNASSIGNED_RESPONSIBLE', 'RECURRENT_DELAY');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "areas" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "areaId" UUID,
    "roleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_activities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "areaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "work_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "workActivityId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuingAgency" TEXT NOT NULL,
    "processNumber" TEXT,
    "scope" TEXT,
    "issuedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "renewalDueAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" UUID NOT NULL,
    "licenseId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "periodicity" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligations" (
    "id" UUID NOT NULL,
    "licenseId" UUID NOT NULL,
    "conditionId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_assets" (
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'OTHER',
    "mimeType" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "extractedText" TEXT,
    "indexedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "document_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_records" (
    "id" UUID NOT NULL,
    "sourceKind" "SourceKind" NOT NULL,
    "externalId" TEXT,
    "fileId" TEXT,
    "spreadsheetId" TEXT,
    "sheetName" TEXT,
    "rowNumber" INTEGER,
    "version" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originUser" TEXT,
    "rawMetadata" JSONB,
    "importStatus" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "documentAssetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "source_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentAssetId" UUID NOT NULL,
    "sourceRecordId" UUID,
    "licenseId" UUID,
    "conditionId" UUID,
    "obligationId" UUID,
    "protocolId" UUID,
    "responsiblePartyId" UUID,
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "validatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocols" (
    "id" UUID NOT NULL,
    "licenseId" UUID NOT NULL,
    "obligationId" UUID,
    "number" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "system" TEXT,
    "submittedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "proofAssetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsible_parties" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResponsiblePartyType" NOT NULL,
    "email" TEXT,
    "isApprover" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "areaId" UUID,
    "userId" UUID,
    "workActivityId" UUID,
    "licenseId" UUID,
    "obligationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "responsible_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deadlines" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'SCHEDULED',
    "licenseId" UUID,
    "conditionId" UUID,
    "obligationId" UUID,
    "responsiblePartyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_signals" (
    "id" UUID NOT NULL,
    "kind" "RiskKind" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "licenseId" UUID,
    "conditionId" UUID,
    "obligationId" UUID,
    "deadlineId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "risk_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "reason" TEXT,
    "sourceIp" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_slug_key" ON "areas"("slug");

-- CreateIndex
CREATE INDEX "areas_status_idx" ON "areas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_resource_key" ON "permissions"("action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_areaId_idx" ON "users"("areaId");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "work_activities_code_key" ON "work_activities"("code");

-- CreateIndex
CREATE INDEX "work_activities_areaId_idx" ON "work_activities"("areaId");

-- CreateIndex
CREATE INDEX "work_activities_status_idx" ON "work_activities"("status");

-- CreateIndex
CREATE INDEX "licenses_issuingAgency_idx" ON "licenses"("issuingAgency");

-- CreateIndex
CREATE INDEX "licenses_status_idx" ON "licenses"("status");

-- CreateIndex
CREATE INDEX "licenses_expiresAt_idx" ON "licenses"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_workActivityId_number_key" ON "licenses"("workActivityId", "number");

-- CreateIndex
CREATE INDEX "conditions_status_idx" ON "conditions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "conditions_licenseId_code_key" ON "conditions"("licenseId", "code");

-- CreateIndex
CREATE INDEX "obligations_licenseId_idx" ON "obligations"("licenseId");

-- CreateIndex
CREATE INDEX "obligations_conditionId_idx" ON "obligations"("conditionId");

-- CreateIndex
CREATE INDEX "obligations_status_idx" ON "obligations"("status");

-- CreateIndex
CREATE INDEX "obligations_dueDate_idx" ON "obligations"("dueDate");

-- CreateIndex
CREATE INDEX "document_assets_checksum_idx" ON "document_assets"("checksum");

-- CreateIndex
CREATE INDEX "document_assets_status_idx" ON "document_assets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_assets_storageBucket_storageKey_version_key" ON "document_assets"("storageBucket", "storageKey", "version");

-- CreateIndex
CREATE INDEX "source_records_sourceKind_idx" ON "source_records"("sourceKind");

-- CreateIndex
CREATE INDEX "source_records_fileId_idx" ON "source_records"("fileId");

-- CreateIndex
CREATE INDEX "source_records_spreadsheetId_sheetName_rowNumber_idx" ON "source_records"("spreadsheetId", "sheetName", "rowNumber");

-- CreateIndex
CREATE INDEX "source_records_importStatus_idx" ON "source_records"("importStatus");

-- CreateIndex
CREATE INDEX "evidences_documentAssetId_idx" ON "evidences"("documentAssetId");

-- CreateIndex
CREATE INDEX "evidences_sourceRecordId_idx" ON "evidences"("sourceRecordId");

-- CreateIndex
CREATE INDEX "evidences_licenseId_idx" ON "evidences"("licenseId");

-- CreateIndex
CREATE INDEX "evidences_conditionId_idx" ON "evidences"("conditionId");

-- CreateIndex
CREATE INDEX "evidences_obligationId_idx" ON "evidences"("obligationId");

-- CreateIndex
CREATE INDEX "evidences_status_idx" ON "evidences"("status");

-- CreateIndex
CREATE INDEX "protocols_licenseId_idx" ON "protocols"("licenseId");

-- CreateIndex
CREATE INDEX "protocols_obligationId_idx" ON "protocols"("obligationId");

-- CreateIndex
CREATE INDEX "protocols_number_idx" ON "protocols"("number");

-- CreateIndex
CREATE INDEX "protocols_status_idx" ON "protocols"("status");

-- CreateIndex
CREATE INDEX "responsible_parties_areaId_idx" ON "responsible_parties"("areaId");

-- CreateIndex
CREATE INDEX "responsible_parties_userId_idx" ON "responsible_parties"("userId");

-- CreateIndex
CREATE INDEX "responsible_parties_workActivityId_idx" ON "responsible_parties"("workActivityId");

-- CreateIndex
CREATE INDEX "responsible_parties_licenseId_idx" ON "responsible_parties"("licenseId");

-- CreateIndex
CREATE INDEX "responsible_parties_obligationId_idx" ON "responsible_parties"("obligationId");

-- CreateIndex
CREATE INDEX "responsible_parties_status_idx" ON "responsible_parties"("status");

-- CreateIndex
CREATE INDEX "deadlines_dueDate_idx" ON "deadlines"("dueDate");

-- CreateIndex
CREATE INDEX "deadlines_status_idx" ON "deadlines"("status");

-- CreateIndex
CREATE INDEX "deadlines_licenseId_idx" ON "deadlines"("licenseId");

-- CreateIndex
CREATE INDEX "deadlines_conditionId_idx" ON "deadlines"("conditionId");

-- CreateIndex
CREATE INDEX "deadlines_obligationId_idx" ON "deadlines"("obligationId");

-- CreateIndex
CREATE INDEX "risk_signals_kind_idx" ON "risk_signals"("kind");

-- CreateIndex
CREATE INDEX "risk_signals_severity_idx" ON "risk_signals"("severity");

-- CreateIndex
CREATE INDEX "risk_signals_status_idx" ON "risk_signals"("status");

-- CreateIndex
CREATE INDEX "audit_events_actorUserId_idx" ON "audit_events"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

-- CreateIndex
CREATE INDEX "audit_events_resource_resourceId_idx" ON "audit_events"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_activities" ADD CONSTRAINT "work_activities_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_workActivityId_fkey" FOREIGN KEY ("workActivityId") REFERENCES "work_activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_documentAssetId_fkey" FOREIGN KEY ("documentAssetId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_documentAssetId_fkey" FOREIGN KEY ("documentAssetId") REFERENCES "document_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "source_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "responsible_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_proofAssetId_fkey" FOREIGN KEY ("proofAssetId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_parties" ADD CONSTRAINT "responsible_parties_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_parties" ADD CONSTRAINT "responsible_parties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_parties" ADD CONSTRAINT "responsible_parties_workActivityId_fkey" FOREIGN KEY ("workActivityId") REFERENCES "work_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_parties" ADD CONSTRAINT "responsible_parties_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_parties" ADD CONSTRAINT "responsible_parties_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "responsible_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "deadlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

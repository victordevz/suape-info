-- CreateEnum
CREATE TYPE "LicenseKind" AS ENUM ('LP', 'LI', 'LO', 'RLO', 'AUT', 'PLI', 'CP', 'LS', 'OUTRO');

-- CreateEnum
CREATE TYPE "RegulatoryClauseType" AS ENUM ('EXIGENCIA', 'CONDICIONANTE', 'REQUISITO', 'OBSERVACAO', 'RESTRICAO', 'PROIBICAO', 'OBJETIVO');

-- CreateEnum
CREATE TYPE "ObligationType" AS ENUM ('ENTREGA_DOCUMENTAL', 'RENOVACAO', 'COMUNICACAO', 'RELATORIO', 'RESTRICAO', 'EVENTO', 'MANUTENCAO_CADASTRAL');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('FIXED_DATE', 'RELATIVE_TO_ISSUE_DATE', 'RELATIVE_TO_EXPIRY_DATE', 'RECURRENT', 'EVENT_BASED', 'WHEN_UPDATED', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "ExternalProcessType" AS ENUM ('CPRH', 'SISAM', 'SILIA', 'SEI', 'ANM', 'IBAMA', 'OUTRO');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('RELATORIO', 'COMUNICACAO', 'PROTOCOLO', 'EVIDENCIA', 'RENOVACAO', 'PRORROGACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('ATENDE', 'ATENDE_PARCIALMENTE', 'NAO_ATENDE', 'NAO_APLICAVEL', 'PENDENTE', 'EM_VALIDACAO');

-- CreateEnum
CREATE TYPE "AuthorizedResourceType" AS ENUM ('MATERIAL', 'EQUIPMENT', 'TECHNICAL_TEAM', 'CONTRACTOR', 'AREA', 'OTHER');

-- AlterEnum
ALTER TYPE "DocumentKind" ADD VALUE 'AUTHORIZATION';
ALTER TYPE "DocumentKind" ADD VALUE 'REGULATORY_DOCUMENT';
ALTER TYPE "DocumentKind" ADD VALUE 'OFFICIAL_LETTER';

-- DropForeignKey
ALTER TABLE "conditions" DROP CONSTRAINT "conditions_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "obligations" DROP CONSTRAINT "obligations_conditionId_fkey";

-- DropForeignKey
ALTER TABLE "evidences" DROP CONSTRAINT "evidences_conditionId_fkey";

-- DropForeignKey
ALTER TABLE "deadlines" DROP CONSTRAINT "deadlines_conditionId_fkey";

-- DropForeignKey
ALTER TABLE "risk_signals" DROP CONSTRAINT "risk_signals_conditionId_fkey";

-- DropIndex
DROP INDEX "conditions_status_idx";

-- DropIndex
DROP INDEX "conditions_licenseId_code_key";

-- DropIndex
DROP INDEX "obligations_conditionId_idx";

-- DropIndex
DROP INDEX "evidences_conditionId_idx";

-- DropIndex
DROP INDEX "deadlines_conditionId_idx";

-- RenameTable
ALTER TABLE "conditions" RENAME TO "regulatory_clauses";

-- RenameConstraint
ALTER TABLE "regulatory_clauses" RENAME CONSTRAINT "conditions_pkey" TO "regulatory_clauses_pkey";

-- RenameColumn
ALTER TABLE "regulatory_clauses" RENAME COLUMN "code" TO "itemCode";
ALTER TABLE "regulatory_clauses" RENAME COLUMN "description" TO "text";
ALTER TABLE "obligations" RENAME COLUMN "conditionId" TO "regulatoryClauseId";
ALTER TABLE "evidences" RENAME COLUMN "conditionId" TO "regulatoryClauseId";
ALTER TABLE "deadlines" RENAME COLUMN "conditionId" TO "regulatoryClauseId";
ALTER TABLE "risk_signals" RENAME COLUMN "conditionId" TO "regulatoryClauseId";

-- AlterTable
ALTER TABLE "licenses" ADD COLUMN     "activitySummary" TEXT,
ADD COLUMN     "authenticationCode" TEXT,
ADD COLUMN     "cprhProcessNumber" TEXT,
ADD COLUMN     "issuingAuthority" TEXT,
ADD COLUMN     "legalTypology" TEXT,
ADD COLUMN     "licenseKind" "LicenseKind" NOT NULL DEFAULT 'OUTRO',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "oficioSuapeNumber" TEXT,
ADD COLUMN     "oldValidUntil" TIMESTAMP(3),
ADD COLUMN     "previousLicenseNumber" TEXT,
ADD COLUMN     "protocolAt" TIMESTAMP(3),
ADD COLUMN     "renewalDeadlineAuthority" TIMESTAMP(3),
ADD COLUMN     "renewalDeadlineInternal" TIMESTAMP(3),
ADD COLUMN     "renewalRule" TEXT,
ADD COLUMN     "requestedAt" TIMESTAMP(3),
ADD COLUMN     "requestingArea" TEXT,
ADD COLUMN     "seiProcessNumber" TEXT,
ADD COLUMN     "siliaRequestNumber" TEXT,
ADD COLUMN     "sisamProcessNumber" TEXT,
ADD COLUMN     "sourceProtocolNumber" TEXT;

-- AlterTable
ALTER TABLE "regulatory_clauses" ADD COLUMN     "sourceDocumentId" UUID,
ADD COLUMN     "sourceRecordId" UUID,
ADD COLUMN     "sectionName" TEXT,
ADD COLUMN     "clauseType" "RegulatoryClauseType" NOT NULL DEFAULT 'CONDICIONANTE',
ADD COLUMN     "parentItemCode" TEXT,
ADD COLUMN     "sequence" INTEGER,
ADD COLUMN     "isTrackable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "generatesObligation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourcePage" INTEGER,
ADD COLUMN     "extractionConfidence" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "obligations" ADD COLUMN     "criticality" "RiskSeverity",
ADD COLUMN     "deadlineAuthority" TIMESTAMP(3),
ADD COLUMN     "deadlineBasis" TEXT,
ADD COLUMN     "deadlineInternal" TIMESTAMP(3),
ADD COLUMN     "obligationType" "ObligationType" NOT NULL DEFAULT 'ENTREGA_DOCUMENTAL',
ADD COLUMN     "responsiblePartyId" UUID,
ADD COLUMN     "triggerType" "TriggerType",
ADD COLUMN     "weight" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "source_records" ADD COLUMN     "cellRange" TEXT,
ADD COLUMN     "itemCode" TEXT,
ADD COLUMN     "pageNumber" INTEGER,
ADD COLUMN     "sectionName" TEXT;

-- AlterTable
ALTER TABLE "evidences" ADD COLUMN     "deliveryId" UUID;

-- AlterTable
ALTER TABLE "protocols" ADD COLUMN     "externalProcessId" UUID,
ADD COLUMN     "obligationOccurrenceId" UUID;

-- AlterTable
ALTER TABLE "responsible_parties" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "isPointOfContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "professionalRecord" TEXT,
ADD COLUMN     "roleDescription" TEXT;

-- AlterTable
ALTER TABLE "deadlines" ADD COLUMN     "obligationOccurrenceId" UUID;

-- CreateTable
CREATE TABLE "obligation_occurrences" (
    "id" UUID NOT NULL,
    "obligationId" UUID NOT NULL,
    "periodReference" TEXT,
    "dueDateAuthority" TIMESTAMP(3),
    "dueDateInternal" TIMESTAMP(3),
    "status" "DeadlineStatus" NOT NULL DEFAULT 'SCHEDULED',
    "deliveryExpected" BOOLEAN NOT NULL DEFAULT true,
    "seiProcessId" UUID,
    "calendarYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "obligation_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_processes" (
    "id" UUID NOT NULL,
    "processType" "ExternalProcessType" NOT NULL,
    "processNumber" TEXT NOT NULL,
    "licenseId" UUID,
    "obligationId" UUID,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "openedAt" TIMESTAMP(3),
    "protocolAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "external_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_letters" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "recipient" TEXT,
    "issuedAt" TIMESTAMP(3),
    "description" TEXT,
    "licenseId" UUID,
    "externalProcessId" UUID,
    "documentAssetId" UUID,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "official_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "licenseId" UUID,
    "obligationId" UUID,
    "obligationOccurrenceId" UUID,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'OUTRO',
    "submittedAt" TIMESTAMP(3),
    "recipientAuthority" TEXT,
    "protocolNumber" TEXT,
    "proofDocumentId" UUID,
    "evidenceDocumentId" UUID,
    "protocolId" UUID,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_assessments" (
    "id" UUID NOT NULL,
    "regulatoryClauseId" UUID,
    "obligationId" UUID,
    "occurrenceId" UUID,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDENTE',
    "weight" DECIMAL(8,2),
    "score" DECIMAL(8,2),
    "assessedById" UUID,
    "assessedAt" TIMESTAMP(3),
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infraction_cases" (
    "id" UUID NOT NULL,
    "object" TEXT NOT NULL,
    "infractionNumber" TEXT NOT NULL,
    "seiProcessNumber" TEXT,
    "cprhProcessNumber" TEXT,
    "infractionType" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "linkedLicenseId" UUID,
    "linkedRegulatoryClauseId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "infraction_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorized_resources" (
    "id" UUID NOT NULL,
    "licenseId" UUID NOT NULL,
    "regulatoryClauseId" UUID,
    "responsiblePartyId" UUID,
    "type" "AuthorizedResourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT,
    "professionalRecord" TEXT,
    "roleDescription" TEXT,
    "quantity" DECIMAL(10,2),
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "authorized_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regulatory_clauses_licenseId_idx" ON "regulatory_clauses"("licenseId");

-- CreateIndex
CREATE INDEX "regulatory_clauses_sourceDocumentId_idx" ON "regulatory_clauses"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "regulatory_clauses_sourceRecordId_idx" ON "regulatory_clauses"("sourceRecordId");

-- CreateIndex
CREATE INDEX "regulatory_clauses_clauseType_idx" ON "regulatory_clauses"("clauseType");

-- CreateIndex
CREATE INDEX "regulatory_clauses_parentItemCode_idx" ON "regulatory_clauses"("parentItemCode");

-- CreateIndex
CREATE INDEX "regulatory_clauses_status_idx" ON "regulatory_clauses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_clauses_licenseId_clauseType_itemCode_key" ON "regulatory_clauses"("licenseId", "clauseType", "itemCode");

-- CreateIndex
CREATE INDEX "obligation_occurrences_obligationId_idx" ON "obligation_occurrences"("obligationId");

-- CreateIndex
CREATE INDEX "obligation_occurrences_seiProcessId_idx" ON "obligation_occurrences"("seiProcessId");

-- CreateIndex
CREATE INDEX "obligation_occurrences_status_idx" ON "obligation_occurrences"("status");

-- CreateIndex
CREATE INDEX "obligation_occurrences_calendarYear_idx" ON "obligation_occurrences"("calendarYear");

-- CreateIndex
CREATE INDEX "obligation_occurrences_dueDateAuthority_idx" ON "obligation_occurrences"("dueDateAuthority");

-- CreateIndex
CREATE INDEX "obligation_occurrences_dueDateInternal_idx" ON "obligation_occurrences"("dueDateInternal");

-- CreateIndex
CREATE INDEX "external_processes_licenseId_idx" ON "external_processes"("licenseId");

-- CreateIndex
CREATE INDEX "external_processes_obligationId_idx" ON "external_processes"("obligationId");

-- CreateIndex
CREATE INDEX "external_processes_status_idx" ON "external_processes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "external_processes_processType_processNumber_key" ON "external_processes"("processType", "processNumber");

-- CreateIndex
CREATE INDEX "official_letters_number_idx" ON "official_letters"("number");

-- CreateIndex
CREATE INDEX "official_letters_licenseId_idx" ON "official_letters"("licenseId");

-- CreateIndex
CREATE INDEX "official_letters_externalProcessId_idx" ON "official_letters"("externalProcessId");

-- CreateIndex
CREATE INDEX "official_letters_status_idx" ON "official_letters"("status");

-- CreateIndex
CREATE INDEX "deliveries_licenseId_idx" ON "deliveries"("licenseId");

-- CreateIndex
CREATE INDEX "deliveries_obligationId_idx" ON "deliveries"("obligationId");

-- CreateIndex
CREATE INDEX "deliveries_obligationOccurrenceId_idx" ON "deliveries"("obligationOccurrenceId");

-- CreateIndex
CREATE INDEX "deliveries_protocolId_idx" ON "deliveries"("protocolId");

-- CreateIndex
CREATE INDEX "deliveries_protocolNumber_idx" ON "deliveries"("protocolNumber");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "compliance_assessments_regulatoryClauseId_idx" ON "compliance_assessments"("regulatoryClauseId");

-- CreateIndex
CREATE INDEX "compliance_assessments_obligationId_idx" ON "compliance_assessments"("obligationId");

-- CreateIndex
CREATE INDEX "compliance_assessments_occurrenceId_idx" ON "compliance_assessments"("occurrenceId");

-- CreateIndex
CREATE INDEX "compliance_assessments_status_idx" ON "compliance_assessments"("status");

-- CreateIndex
CREATE INDEX "infraction_cases_linkedLicenseId_idx" ON "infraction_cases"("linkedLicenseId");

-- CreateIndex
CREATE INDEX "infraction_cases_linkedRegulatoryClauseId_idx" ON "infraction_cases"("linkedRegulatoryClauseId");

-- CreateIndex
CREATE INDEX "infraction_cases_status_idx" ON "infraction_cases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "infraction_cases_infractionNumber_key" ON "infraction_cases"("infractionNumber");

-- CreateIndex
CREATE INDEX "authorized_resources_licenseId_idx" ON "authorized_resources"("licenseId");

-- CreateIndex
CREATE INDEX "authorized_resources_regulatoryClauseId_idx" ON "authorized_resources"("regulatoryClauseId");

-- CreateIndex
CREATE INDEX "authorized_resources_responsiblePartyId_idx" ON "authorized_resources"("responsiblePartyId");

-- CreateIndex
CREATE INDEX "authorized_resources_type_idx" ON "authorized_resources"("type");

-- CreateIndex
CREATE INDEX "authorized_resources_status_idx" ON "authorized_resources"("status");

-- CreateIndex
CREATE INDEX "licenses_licenseKind_idx" ON "licenses"("licenseKind");

-- CreateIndex
CREATE INDEX "licenses_renewalDeadlineAuthority_idx" ON "licenses"("renewalDeadlineAuthority");

-- CreateIndex
CREATE INDEX "licenses_cprhProcessNumber_idx" ON "licenses"("cprhProcessNumber");

-- CreateIndex
CREATE INDEX "licenses_seiProcessNumber_idx" ON "licenses"("seiProcessNumber");

-- CreateIndex
CREATE INDEX "obligations_regulatoryClauseId_idx" ON "obligations"("regulatoryClauseId");

-- CreateIndex
CREATE INDEX "obligations_responsiblePartyId_idx" ON "obligations"("responsiblePartyId");

-- CreateIndex
CREATE INDEX "obligations_deadlineAuthority_idx" ON "obligations"("deadlineAuthority");

-- CreateIndex
CREATE INDEX "obligations_deadlineInternal_idx" ON "obligations"("deadlineInternal");

-- CreateIndex
CREATE INDEX "source_records_sheetName_cellRange_idx" ON "source_records"("sheetName", "cellRange");

-- CreateIndex
CREATE INDEX "source_records_documentAssetId_pageNumber_idx" ON "source_records"("documentAssetId", "pageNumber");

-- CreateIndex
CREATE INDEX "evidences_regulatoryClauseId_idx" ON "evidences"("regulatoryClauseId");

-- CreateIndex
CREATE INDEX "evidences_protocolId_idx" ON "evidences"("protocolId");

-- CreateIndex
CREATE INDEX "evidences_deliveryId_idx" ON "evidences"("deliveryId");

-- CreateIndex
CREATE INDEX "protocols_obligationOccurrenceId_idx" ON "protocols"("obligationOccurrenceId");

-- CreateIndex
CREATE INDEX "protocols_externalProcessId_idx" ON "protocols"("externalProcessId");

-- CreateIndex
CREATE INDEX "deadlines_regulatoryClauseId_idx" ON "deadlines"("regulatoryClauseId");

-- CreateIndex
CREATE INDEX "deadlines_obligationOccurrenceId_idx" ON "deadlines"("obligationOccurrenceId");

-- CreateIndex
CREATE INDEX "risk_signals_regulatoryClauseId_idx" ON "risk_signals"("regulatoryClauseId");

-- AddForeignKey
ALTER TABLE "regulatory_clauses" ADD CONSTRAINT "regulatory_clauses_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_clauses" ADD CONSTRAINT "regulatory_clauses_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_clauses" ADD CONSTRAINT "regulatory_clauses_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "source_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_regulatoryClauseId_fkey" FOREIGN KEY ("regulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "responsible_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_occurrences" ADD CONSTRAINT "obligation_occurrences_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligation_occurrences" ADD CONSTRAINT "obligation_occurrences_seiProcessId_fkey" FOREIGN KEY ("seiProcessId") REFERENCES "external_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_regulatoryClauseId_fkey" FOREIGN KEY ("regulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_obligationOccurrenceId_fkey" FOREIGN KEY ("obligationOccurrenceId") REFERENCES "obligation_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_externalProcessId_fkey" FOREIGN KEY ("externalProcessId") REFERENCES "external_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_regulatoryClauseId_fkey" FOREIGN KEY ("regulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_obligationOccurrenceId_fkey" FOREIGN KEY ("obligationOccurrenceId") REFERENCES "obligation_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_processes" ADD CONSTRAINT "external_processes_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_processes" ADD CONSTRAINT "external_processes_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_letters" ADD CONSTRAINT "official_letters_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_letters" ADD CONSTRAINT "official_letters_externalProcessId_fkey" FOREIGN KEY ("externalProcessId") REFERENCES "external_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_letters" ADD CONSTRAINT "official_letters_documentAssetId_fkey" FOREIGN KEY ("documentAssetId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_obligationOccurrenceId_fkey" FOREIGN KEY ("obligationOccurrenceId") REFERENCES "obligation_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_proofDocumentId_fkey" FOREIGN KEY ("proofDocumentId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_regulatoryClauseId_fkey" FOREIGN KEY ("regulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "obligation_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_assessments" ADD CONSTRAINT "compliance_assessments_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraction_cases" ADD CONSTRAINT "infraction_cases_linkedLicenseId_fkey" FOREIGN KEY ("linkedLicenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infraction_cases" ADD CONSTRAINT "infraction_cases_linkedRegulatoryClauseId_fkey" FOREIGN KEY ("linkedRegulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorized_resources" ADD CONSTRAINT "authorized_resources_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorized_resources" ADD CONSTRAINT "authorized_resources_regulatoryClauseId_fkey" FOREIGN KEY ("regulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorized_resources" ADD CONSTRAINT "authorized_resources_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "responsible_parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_regulatoryClauseId_fkey" FOREIGN KEY ("regulatoryClauseId") REFERENCES "regulatory_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

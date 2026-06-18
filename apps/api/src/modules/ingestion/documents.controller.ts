import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { GoogleDriveIngestionService } from './google-drive-ingestion.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    @Inject(GoogleDriveIngestionService)
    private readonly ingestion: GoogleDriveIngestionService,
  ) {}

  @Get()
  list(@Query() query: unknown) {
    return this.ingestion.listDocuments(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.ingestion.getDocument(id);
  }

  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.ingestion.getDocumentVersions(id);
  }

  @Get(':id/preview')
  getPreview(@Param('id') id: string) {
    return this.ingestion.getDocumentPreview(id);
  }

  @Patch(':id/metadata')
  updateMetadata(@Param('id') id: string, @Body() body: unknown) {
    return this.ingestion.updateDocumentMetadata(id, body);
  }

  @Post(':id/mark-validation-pending')
  markValidationPending(@Param('id') id: string) {
    return this.ingestion.markValidationPending(id);
  }
}

import { Body, Controller, Delete, Get, Inject, Post, Query } from '@nestjs/common';
import { GoogleDriveIngestionService } from './google-drive-ingestion.service';

@Controller('integrations/google-drive')
export class GoogleDriveIntegrationController {
  constructor(
    @Inject(GoogleDriveIngestionService)
    private readonly ingestion: GoogleDriveIngestionService,
  ) {}

  @Post('connect')
  connect(@Body() body: unknown) {
    return this.ingestion.connect(body);
  }

  @Get('oauth/callback')
  completeOAuthCallback(@Query() query: unknown) {
    return this.ingestion.completeOAuthCallback(query);
  }

  @Get('status')
  getStatus() {
    return this.ingestion.getStatus();
  }

  @Delete('disconnect')
  disconnect(@Query() query: unknown) {
    return this.ingestion.disconnect(query);
  }

  @Get('folders')
  listDriveFolders(@Query() query: unknown) {
    return this.ingestion.listDriveFolders(query);
  }
}

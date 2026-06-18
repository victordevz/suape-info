import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { GoogleDriveIngestionService } from './google-drive-ingestion.service';

@Controller('sync')
export class SyncController {
  constructor(
    @Inject(GoogleDriveIngestionService)
    private readonly ingestion: GoogleDriveIngestionService,
  ) {}

  @Post('google-drive/run')
  runGoogleDriveSync(@Body() body: unknown) {
    return this.ingestion.runSync(body);
  }

  @Get('jobs')
  listJobs(@Query() query: unknown) {
    return this.ingestion.listJobs(query);
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.ingestion.getJob(id);
  }

  @Post('jobs/:id/retry')
  retryJob(@Param('id') id: string) {
    return this.ingestion.retryJob(id);
  }
}

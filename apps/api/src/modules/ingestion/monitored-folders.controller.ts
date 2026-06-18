import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { GoogleDriveIngestionService } from './google-drive-ingestion.service';

@Controller('monitored-folders')
export class MonitoredFoldersController {
  constructor(
    @Inject(GoogleDriveIngestionService)
    private readonly ingestion: GoogleDriveIngestionService,
  ) {}

  @Post()
  create(@Body() body: unknown) {
    return this.ingestion.createMonitoredFolder(body);
  }

  @Get()
  list(@Query() query: unknown) {
    return this.ingestion.listMonitoredFolders(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.ingestion.updateMonitoredFolder(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ingestion.deleteMonitoredFolder(id);
  }
}

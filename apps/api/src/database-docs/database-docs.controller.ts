import { Controller, Get, Header, Inject } from '@nestjs/common';
import { DatabaseDocsService } from './database-docs.service';

@Controller('database')
export class DatabaseDocsController {
  constructor(
    @Inject(DatabaseDocsService)
    private readonly databaseDocsService: DatabaseDocsService,
  ) {}

  @Get('schema')
  getSchema() {
    return this.databaseDocsService.getSchema();
  }

  @Get('dictionary')
  getDictionary() {
    return this.databaseDocsService.getDictionary();
  }

  @Get('docs')
  @Header('content-type', 'text/html; charset=utf-8')
  getDocs() {
    return this.databaseDocsService.getHtml();
  }
}

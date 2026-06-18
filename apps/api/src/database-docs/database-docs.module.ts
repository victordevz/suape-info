import { Module } from '@nestjs/common';
import { DatabaseDocsController } from './database-docs.controller';
import { DatabaseDocsService } from './database-docs.service';

@Module({
  controllers: [DatabaseDocsController],
  providers: [DatabaseDocsService],
})
export class DatabaseDocsModule {}

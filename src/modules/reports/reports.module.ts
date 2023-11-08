import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BullModule } from '@nestjs/bull';
import { LogsService } from '../log/logs.service';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportErrorService } from './report-error.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reports',
    }),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'LogsService',
      useClass: LogsService,
    },
    {
      provide: 'EventService',
      useClass: EventEmitter2,
    },
    {
      provide: 'ReportErrorService',
      useClass: ReportErrorService,
    },
    {
      provide: CACHE_MANAGER,
      useClass: Cache,
    },
  ],
})
export class ReportsModule { }

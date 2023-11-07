import { Process, Processor } from '@nestjs/bull';
import { ErrorReportEntity } from '../model/error-report.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { $Enums } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { reportPDFProvider } from '../../../shared/infra/providers/report-pdf.provider';

interface IReProduceReport {
  reportId: number;
  attempts: number;
}

@Processor('reporterror')
export class ReportErrorConsumer {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('EventService') private eventEmitterService: EventEmitter2,
    @Inject('PrismaService') private prismaService: PrismaService,
  ) { }

  @Process('onerror')
  async reProduce(props: IReProduceReport) {
    const toReProduce = await this.prismaService.report.findUnique({
      where: {
        id: props.reportId,
      },
    });

    if (!toReProduce) {
      return;
    }

    try {
      await reportPDFProvider({
        content: `${toReProduce.filename}-${toReProduce.id}`,
        filename: toReProduce.filename,
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}

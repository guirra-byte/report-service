import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { ErrorReportEntity } from './entities/error-report.entity';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class ReportErrorService {
  constructor(
    @InjectQueue('reporterror') private queueManager: Queue,
    @Inject('PrismaService') private prismaService: PrismaService,
  ) { }

  async reProduce(props: ErrorReportEntity<any>) {
    if (props._queueKey) {
      if (props._failAttempts <= 3) {
        await this.queueManager.add(
          `${process.env.REPORT_CACHE_KEY}${props._parent}`,
          {
            id: props._parent,
            status: props._deps.status,
            scheduled: false,
            failAttempts: props._failAttempts,
          },
        );
      }
    }
  }

  async leakAttempts(props: ErrorReportEntity<any>) {
    await this.prismaService.report.update({
      where: {
        id: props._parent,
      },
      data: {
        status: $Enums.Status.ERROR,
      },
    });
  }
}

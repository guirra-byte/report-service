import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ErrorReportEntity } from './entities/error-report.entity';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportDTO } from './dtos/report.dto';

export interface ILeakAttempts {
  id: number;
  errMsg: string;
}

@Injectable()
export class ReportErrorService {
  constructor(
    @InjectQueue('reporterror') private reportsErrQueue: Queue,
    @InjectQueue('report') private reportsQueue: Queue,
    @Inject('PrismaService') private prismaService: PrismaService,
  ) { }

  async reProduce(props: ErrorReportEntity<any>) {
    if (props._queueKey) {
      await this.reportsErrQueue.add(
        props._queueKey,
        {
          id: props._parent,
          status: props._deps.status,
          delay: props._deps.delay,
        },
        { removeOnComplete: true, removeOnFail: true },
      );
    }
  }

  @OnEvent('reproduce@leak')
  async leakAttempts({ id, errMsg }: ILeakAttempts) {
    const target = await this.prismaService.report.findUnique({
      where: {
        id,
      },
    });

    const reportsJobs = (await this.reportsQueue.getJobs([
      'active',
    ])) as Job<ReportDTO>[];

    const job = reportsJobs.find(
      (rprtJob) => rprtJob.data.filename === target.filename,
    );

    if (!job) {
    }

    job.moveToFailed({ message: errMsg });

    await this.prismaService.report.update({
      where: {
        id,
      },
      data: {
        status: $Enums.Status.ERROR,
      },
    });

    //Remover da fila de processamento - Após a finalização independente do resultado;
  }
}

import { Inject } from '@nestjs/common';
import { Report } from '../entities/report.entity';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service';
import { ReportDTO } from '../dtos/report.dto';
import { $Enums } from '@prisma/client';
import { ReportErrorService } from '../report-error.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Processor, Process } from '@nestjs/bull';
import { ReportsService } from '../reports.service';
import { Worker } from 'worker_threads';
import { MessageDTO } from '../worker_threads/ballance.worker';
import { ErrorReportEntity } from '../entities/error-report.entity';

@Processor('reports')
export class ReportsConsumer {
  constructor(
    @Inject('PrismaService') private prismaService: PrismaService,
    @Inject('ReportsService') private reportsService: ReportsService,
    @Inject('ReportErrorService')
    private reportErrorService: ReportErrorService,
    @InjectQueue('report') private reportsQueue: Queue,
  ) {}

  @Process('produce')
  async produce(job: Job<ReportDTO>) {
    const report = new Report(job.data);
    await this.prismaService.report.create({
      data: {
        filename: report._filename,
        scheduled: report._scheduled,
        delivery_at: report.deliveryAt,
        status: $Enums.Status.PENDING,
      },
    });

    const reqReportsRefs: Job<MessageDTO>[] = await this.reportsQueue.getJobs([
      'waiting',
    ]);

    const data = reqReportsRefs.map((req) => req.data);

    const ballanceWorker = new Worker('../worker/ballance.worker.ts');
    this.reportsQueue.on('completed', async (arg: Job<MessageDTO>) => {
      await this.prismaService.report.update({
        where: { id: arg.data.id },
        data: {
          status: $Enums.Status.DONE,
        },
      });
    });

    this.reportsQueue.on('failed', async (arg: Job<MessageDTO>) => {
      await this.prismaService.report.update({
        where: {
          id: arg.data.id,
        },
        data: {
          status: $Enums.Status.RE_PROCESSING,
        },
      });

      const err = new ErrorReportEntity<MessageDTO>(
        { ...arg.data },
        arg.data.id,
        'reports',
      );

      await this.reportErrorService.reProduce(err);
    });

    ballanceWorker.on('message', (args: { [key: string]: number[] }) => {
      for (const [key, values] of Object.entries(args)) {
        values.map((id) => {
          const job = reqReportsRefs.find((req) => req.data.id === id);

          new Promise((resolve, reject) => {
            if (job) {
              if (key === 'ok') {
                return resolve(job.moveToCompleted());
              } else if (key === 'error') {
                return resolve(job.moveToFailed({ message: 'try-again' }));
              }
            }

            return reject('[Report] Job not found!');
          });
        });
      }
    });

    ballanceWorker.postMessage(data);
  }
}

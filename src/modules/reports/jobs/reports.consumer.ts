import { Inject } from '@nestjs/common';
import { Report } from '../entities/report.entity';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ReportDTO } from '../dtos/report.dto';
import os from 'node:os';
import { $Enums } from '@prisma/client';
import { distributtingWorkers } from '../worker/reports.worker-thread';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FollowReportDTO } from '../dtos/follow-report.dto';
import { LogsService } from '../../log/logs.service';
import { ReportErrorService } from '../report-error.service';
import { ErrorReportEntity } from '../entities/error-report.entity';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Processor, Process } from '@nestjs/bull';
import { OnEvent } from '@nestjs/event-emitter';
import { namedJobs } from '../../config/namedJobs.config';
import { ReportsService } from '../reports.service';

export interface IWorkerData {
  arr: Int32Array;
}

@Processor('reports')
export class ReportsConsumer {
  // private reports: Report[] = [];
  // private doneReports: Report[] = [];
  // private errorReports: Report[] = [];

  constructor(
    @Inject('PrismaService') private prismaService: PrismaService,
    @Inject('ReportsService') private reportsService: ReportsService,
    @Inject('LogsService') private logsService: LogsService,
    @Inject('ReportErrorService')
    private reportErrorService: ReportErrorService,
    @InjectQueue('report') private reportsQueue: Queue,
  ) { }

  @Process('produce')
  async produce(job: Job<ReportDTO>) {
    const newReport = new Report(job.data);

    await this.prismaService.report.create({
      data: {
        filename: newReport._filename,
        scheduled: newReport._scheduled,
        delivery_at: newReport.deliveryAt,
        status: $Enums.Status.PENDING,
      },
    });

    const reqReportsRefs = await this.reportsQueue.getJobs(['waiting']);
    const dbReports = await this.prismaService.report.findMany({
      where: {
        status: $Enums.Status.PENDING,
      },
    });

    const reports = dbReports.map<number>((rprt) => {
      if (
        reqReportsRefs.find(
          (report: Job<ReportDTO>) => report.data.filename === rprt.filename,
        )
      ) {
        return rprt.id;
      }
    });

    const claimReportsProps =
      await this.reportsService.claimReportsByIds(reports);

    const bufferSize = claimReportsProps.length * Int32Array.BYTES_PER_ELEMENT;
    const sharedArrayBuffer = new SharedArrayBuffer(bufferSize);
    const workerData = new Int32Array(sharedArrayBuffer);

    const machineCPUs = os.cpus().length;

    for (let index = 0; index < machineCPUs; index++) {
      for (let position = 0; position < reqReportsRefs.length; position++) {
        workerData[position] = claimReportsProps[position].id;
        Atomics.add(workerData, position, claimReportsProps[position].id);
      }

      await distributtingWorkers(
        { arr: workerData },
        { queue: 'report', instance: this.reportsQueue },
      );
    }
  }

  @OnEvent('report@done')
  async markDoneReports(ids: number[]) {
    const claimReports = await this.reportsService.claimReportsByIds(
      ids,
      'DONE',
    );

    for (const target of claimReports) {
      await this.prismaService.report.update({
        where: {
          id: target.id,
        },
        data: {
          status: $Enums.Status.DONE,
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

      job.moveToCompleted();
    }
  }

  @OnEvent('report@error')
  async markErrorReports(ids: number[]) {
    const claimReports = await this.reportsService.claimReportsByIds(ids, '');

    for (let position = 0; position < claimReports.length; position++) {
      for (const target of ids) {
        const claimReport = claimReports.find((rprt) => rprt.id === target);

        if (!claimReport) {
          throw new Error('Report register not found!');
        }

        const reportErrorNamedJobs = namedJobs['reporterror'];
        const reportErrorJob = reportErrorNamedJobs.find(
          (job) => job.jobName === 'onerror',
        );

        const errReport = new ErrorReportEntity(
          {
            filename: claimReport.filename,
            status: $Enums.Status.ERROR,
            //Adicionar mais props
          },
          target,
          reportErrorJob.jobName,
        );

        await this.reportErrorService.reProduce(errReport);
        await this.prismaService.report.update({
          where: {
            id: target,
          },
          data: {
            status: errReport._deps.status,
          },
        });
      }
    }
  }
}

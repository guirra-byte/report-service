import { Inject, Injectable } from '@nestjs/common';
import { Report } from './entities/report.entity';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ReportDTO } from './dtos/report.dto';
import os from 'node:os';
import { $Enums } from '@prisma/client';
import { distributtingWorkers } from './worker/reports.worker-thread';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FollowReportDTO } from './dtos/follow-report.dto';
import { LogsService } from '../logs/logs.service';
import { ReportLog } from './entities/report-log.entity';
import { ReportErrorService } from './report-error.service';
import { ErrorReportEntity } from './entities/error-report.entity';

export interface IWorkerData {
  arr: Int32Array;
}

interface IRangeCacheReports {
  id: number;
  status: $Enums.Status;
  scheduled: boolean;
  failAttempts: number;
}

@Injectable()
export class ReportsService {
  private reports: Report[] = [];
  private doneReports: Report[] = [];
  private errorReports: Report[] = [];

  constructor(
    @Inject('PrismaService') private prismaService: PrismaService,
    @Inject('LogsService') private logsService: LogsService,
    @Inject('ReportErrorService')
    private reportErrorService: ReportErrorService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async followReports(): Promise<FollowReportDTO[]> {
    return this.prismaService.report.findMany();
  }

  async followDoneReports() {
    return this.prismaService.report.findMany({
      where: {
        status: $Enums.Status.DONE,
      },
    });
  }

  async followErrReports() {
    return this.prismaService.report.findMany({
      where: {
        status: $Enums.Status.ERROR,
      },
    });
  }

  async followPendingReports() {
    const reportScopeKeys = (await this.cacheManager.store.keys()).filter(
      (key) =>
        key.includes(process.env.REPORT_CACHE_KEY) ||
        key.includes(process.env.ERROR_REPORT_CACHE_KEY) ||
        key.includes(process.env.RE_PROCESSING_REPORT_CACHE_KEY),
    );

    const reports = (await this.cacheManager.store.mget(
      ...reportScopeKeys,
    )) as IRangeCacheReports[];

    if (reports.length === 0) {
      return;
    }

    const pendingReportsRefs = reports.map((rp) => {
      if (rp.status === $Enums.Status.PENDING) {
        return rp.id;
      }
    });

    const enqueuePendingReportsRefs = await this.enqueue(pendingReportsRefs);
    return enqueuePendingReportsRefs;
  }

  async claimReportsByIds(ids: number[]): Promise<FollowReportDTO[]> {
    const reports = await this.prismaService.report.findMany({
      where: {
        id: {
          in: ids,
        },
        status: $Enums.Status.PENDING,
      },
    });

    return reports;
  }

  async cacheReportReq(key: string, value: IRangeCacheReports) {
    await this.cacheManager.set(key, value);
  }

  async produce(report: ReportDTO) {
    const newReport = new Report(report);

    await this.cacheReportReq(
      `${process.env.REPORT_CACHE_KEY}
    ${newReport.id}`,
      {
        id: newReport.id,
        status: newReport.status,
        scheduled: newReport.scheduled,
        failAttempts: 0,
      },
    );

    this.reports.push(newReport);

    const reqReportsRefs = await this.followPendingReports();
    const claimReportsProps = await this.claimReportsByIds(reqReportsRefs);

    const bufferSize = claimReportsProps.length * Int32Array.BYTES_PER_ELEMENT;
    const sharedArrayBuffer = new SharedArrayBuffer(bufferSize);
    const workerData = new Int32Array(sharedArrayBuffer);

    const machineCPUs = os.cpus().length;
    const distributtingReqs = claimReportsProps.length / machineCPUs;
    let lastWorkerData = 0;

    for (let index = 0; index < machineCPUs; index++) {
      for (
        let req = lastWorkerData;
        req <= claimReportsProps.length;
        req += distributtingReqs
      ) {
        lastWorkerData = req + distributtingReqs;

        for (let position = 0; position < lastWorkerData; position++) {
          workerData[position] = claimReportsProps[position].id;
          Atomics.add(workerData, position, claimReportsProps[position].id);
        }
      }

      await distributtingWorkers({ arr: workerData }, this);
    }
  }

  //Princípio FIFO (First In First Out) -> Filas usando princípio FIFO;
  //Agendamento de Tarefas -> De acordo com a Queue de processamento;
  async enqueue(_reports: number[]): Promise<number[]> {
    for (let index = 0; index < _reports.length; index++) {
      for (let nxtIndex = index + 1; nxtIndex < _reports.length; nxtIndex++) {
        const report = _reports[index];
        const nxtReport = _reports[nxtIndex];

        if (report > nxtReport) {
          const tmpIndexRefs = _reports[index];
          _reports[index] = nxtReport;
          _reports[nxtIndex] = tmpIndexRefs;
        }
      }
    }

    return _reports;
  }

  async markDoneReports(ids: number[]) {
    for (let position = 0; position < this.reports.length; position++) {
      for (const target of ids) {
        if (target === this.reports[position].id) {
          this.doneReports.push(this.reports[position]);
          this.reports.splice(position, 1);

          await this.cacheManager.del(
            `${process.env.REPORT_CACHE_KEY}${target}`,
          );

          await this.prismaService.report.update({
            where: {
              id: target,
            },
            data: {
              status: $Enums.Status.DONE,
            },
          });
        }
      }
    }
  }

  async markErrorReports(ids: number[]) {
    for (let position = 0; position < this.reports.length; position++) {
      for (const target of ids) {
        if (target === this.reports[position].id) {
          this.errorReports.push(this.reports[position]);
          this.reports.splice(position, 1);

          const cachedTarget = await this.cacheManager.get<IRangeCacheReports>(
            `${process.env.REPORT_CACHE_KEY}${target}`,
          );

          const [claimReport] = await this.claimReportsByIds([target]);
          const errAuditLog = new ReportLog({
            filename: claimReport.filename,
            status: 'ERROR',
          });

          await this.logsService.gen(errAuditLog);

          const errReport = new ErrorReportEntity(
            {
              filename: claimReport.filename,
              status:
                cachedTarget.failAttempts >= 3
                  ? $Enums.Status.ERROR
                  : $Enums.Status.RE_PROCESSING,
              //Adicionar mais props
            },
            target,
            `${process.env.ERROR_REPORT_CACHE_KEY}${target}`,
            (cachedTarget.failAttempts += 1),
          );

          if (cachedTarget && cachedTarget.failAttempts < 3) {
            await this.cacheManager.del(
              `${process.env.REPORT_CACHE_KEY}
              ${target}`,
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
          } else if (cachedTarget.failAttempts >= 3) {
            await this.reportErrorService.leakAttempts(errReport);
            await this.prismaService.report.update({
              where: {
                id: target,
              },
              data: {
                status: errReport._deps.status,
              },
            });

            //Emitir evento de falha na geração de relatório;
            //Informar ao client que a requisição de geração de relatório foi mal sucedida;
          }
        }
      }
    }
  }

  async dequeue(ids: number[], flag: string) {
    if (flag === 'DONE') {
      await this.markDoneReports(ids);
    } else if (flag === 'ERROR') {
      await this.markErrorReports(ids);
    }
  }
}

// Disparar evento (SSE) quando um relatório não for gerado com sucesso;
// Disparar evento (SSE) quando relatório for gerado com sucesso;
// Disparar evento (SSE) quando um relatório que foi agendado, começar a ser gerado;

import { Inject, Injectable } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from '../../shared/infra/prisma/prisma.service';
import { FollowReportDTO } from './dtos/follow-report.dto';
import { ReportDTO } from './dtos/report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  private processor: string;

  constructor(
    @Inject('PrismaService') private prismaService: PrismaService,
    @InjectQueue('reports') private reportsQueue: Queue,
  ) {
    this.processor = 'reports';
  }

  async followReports(): Promise<FollowReportDTO[]> {
    return this.prismaService.report.findMany();
  }

  async followPendingReports() {
    const reports = await this.followReports();

    if (reports.length === 0) {
      return;
    }

    const pendingReportsRefs = reports.map((rp) => {
      if (rp.status === $Enums.Status.PENDING) {
        return rp.id;
      }
    });

    return pendingReportsRefs;
  }

  async claimReportsByIds(
    ids: number[],
    flag?: string,
  ): Promise<FollowReportDTO[]> {
    let rprtStatus = $Enums.Status.PENDING;
    for (const [key, value] of Object.entries($Enums.Status)) {
      if (flag && flag === value) {
        rprtStatus = $Enums.Status[key];
      }
    }

    const reports = await this.prismaService.report.findMany({
      where: {
        id: {
          in: ids,
        },
        status: rprtStatus,
      },
    });

    return reports;
  }

  async produce(report: ReportDTO) {
    const newReport = new Report(report);

    await this.reportsQueue.add('produce', newReport, {
      removeOnComplete: true,
    });
  }
}

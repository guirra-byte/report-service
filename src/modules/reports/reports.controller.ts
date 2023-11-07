import { Controller, Get, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Sse } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable, defer, map, repeat, tap } from 'rxjs';
import { $Enums } from '@prisma/client';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Sse('/:owner-id/follow/done')
  async doneReports(
    @Res() response: Response,
  ): Promise<Observable<MessageEvent>> {
    return defer(async () => await this.reportsService.followReports()).pipe(
      repeat({
        delay: 5000,
      }),
      tap((reports) => {
        const finishedReport = reports.every(
          (report) =>
            report.status === $Enums.Status.DONE ||
            report.status === $Enums.Status.ERROR,
        );

        if (finishedReport) {
          setTimeout(() => {
            response.end();
          }, 5000);
        }
      }),
      map((reports) => ({
        type: 'message',
        data: reports.filter((report) => report.status === $Enums.Status.DONE),
      })),
    );
  }

  @Sse('/:owner_id/follow/error')
  async errReports(
    @Res() response: Response,
  ): Promise<Observable<MessageEvent>> {
    return defer(async () => await this.reportsService.followReports()).pipe(
      repeat({
        delay: 5000,
      }),
      tap((reports) => {
        const finishedReport = reports.every(
          (report) =>
            report.status === $Enums.Status.DONE ||
            report.status === $Enums.Status.ERROR,
        );

        if (finishedReport) {
          setTimeout(() => {
            response.end();
          }, 5000);
        }
      }),
      map((reports) => ({
        type: 'message',
        data: reports.filter((report) => report.status === $Enums.Status.ERROR),
      })),
    );
  }

  @Get('/:owner_id/follow')
  async reports() {
    return this.reportsService.followReports();
  }
}

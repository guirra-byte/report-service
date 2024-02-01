import { Body, Controller, Get, Post, Res, Param } from '@nestjs/common';
import { Sse } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable, defer, map, repeat, tap } from 'rxjs';
import { $Enums } from '@prisma/client';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportDTO } from './dtos/report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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

  @Get('/:owner_id/follow')
  async reports() {
    return this.reportsService.followReports();
  }

  @Post('/:owner_id/')
  async produce(
    @Param('owner_id') owner_id: string,
    @Body() data: ReportDTO,
    @Res() response: Response,
  ) {
    await this.reportsService.produce(data);
    response.location(`/:${owner_id}/follow/done`);
    return response.status(202).send(`Your request are accepted!`);
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
}

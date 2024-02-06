import { Body, Controller, Get, Post, Res, Param } from '@nestjs/common';
import { Sse } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable, defer, map, repeat, tap } from 'rxjs';
//RxJS para lidar com Reatividade em meu software;
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportDTO } from './dtos/report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Sse('/:owner_id/reports/done')
  async doneReports(
    @Param('owner_id') param: string,
    @Res() response: Response,
  ): Promise<Observable<MessageEvent>> {
    return defer(async () => await this.reportsService.reports()).pipe(
      repeat({
        delay: 10000,
      }),
      tap((reports) => {
        const finishedReport = reports.every(
          (report) =>
            report.status === 'DONE' ||
            report.status === 'ERROR' ||
            report.status === 'ABORTED',
        );

        if (finishedReport) {
          setTimeout(() => {
            response.end();
          }, 5000);
        }
      }),
      map((reports) => ({
        type: 'message',
        data: { owner: param, reports },
      })),
    );

    //Defer -> Agendar a execução do callback passado como parâmetro;
    //Não é realizada alterações em Regras de Negócios -> Somente na forma de apresentação dos dados;
    //Map -> Construção da resposta SSE;
    //Tap -> Operações secundárias e fechamento do canal de comunicação;
  }

  @Get('/:owner_id/reports')
  async reports(@Param('owner_id') param: string, @Res() response: Response) {
    const rprts = await this.reportsService.reports();
    return response.status(200).json({ owner: param, data: rprts });
  }

  @Post('/:owner_id/produce')
  async produce(
    @Param('owner_id') param: string,
    @Body() data: ReportDTO,
    @Res() response: Response,
  ) {
    await this.reportsService.produce(data);
    response.location(`/:${param}/follow/done`);
    return response.status(202).send(`Your request are accepted!`);
  }
}

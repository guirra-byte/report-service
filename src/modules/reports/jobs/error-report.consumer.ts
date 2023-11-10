import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { reportPDFProvider } from '../../../shared/infra/providers/report-pdf.provider';

interface IReProduceReport {
  reportId: number;
  delay: number;
}

@Processor('reporterror')
export class ReportErrorConsumer {
  constructor(
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

    let reProduceAttempts = props.delay;
    let delay = 1;
    while (reProduceAttempts > 0) {
      try {
        await reportPDFProvider({
          content: `${toReProduce.filename}-${toReProduce.id}`,
          filename: toReProduce.filename,
        });
      } catch (error) {
        if (reProduceAttempts === 0 && delay === props.delay) {
          this.eventEmitterService.emit('reproduce@leak', {
            id: props.reportId,
            errMsg: `${error}`,
          });
        } else {
          setTimeout(() => {
            reProduceAttempts--;
          }, 1000 * delay);

          delay++;
        }
      }
    }

    return {};
  }
}

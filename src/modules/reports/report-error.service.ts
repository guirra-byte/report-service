import { Inject, Injectable } from '@nestjs/common';
import { ErrorReportEntity } from './entities/error-report.entity';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../../shared/infra/prisma/prisma.service';

@Injectable()
export class ReportErrorService {
  constructor(@Inject('PrismaService') private prismaService: PrismaService) {}

  async reProduce(props: ErrorReportEntity<any>) {
    if (props._queueKey) {
      await this.prismaService.report.update({
        where: { id: props._deps.id },
        data: {
          status: $Enums.Status.ERROR,
        },
      });
    }
  }
}

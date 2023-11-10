import { $Enums } from '@prisma/client';
import { LogEntity } from '../../log/model/log.model';

export interface IReportLog {
  reqId: number;
  status: $Enums.Status;
  filename: string;
}

export class ReportLog extends LogEntity<IReportLog> {
  constructor(props: IReportLog) {
    super(props);

    if (props.status === $Enums.Status.DONE) {
      return;
    }
  }

  get status(): $Enums.Status {
    return this.status;
  }

  get filename(): string {
    return this.filename;
  }
}

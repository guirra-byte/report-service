import { IReportLog } from '../../reports/entities/report-log.entity';
import { LogEntity } from '../model/log.model';

export class Log {
  entities: LogEntity<IReportLog>[];
}

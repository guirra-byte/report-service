import { Process, Processor } from '@nestjs/bull';
import { LogEntity } from '../model/log.entity';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { logsOutDir } from '../../config/report-pdf-path.config';
import { randomUUID } from 'crypto';

@Processor('logs')
export class LogsJobConsumer {
  @Process('gen')
  async gen(props: LogEntity<any>): Promise<unknown> {
    const outDirExists = existsSync(logsOutDir);

    if (!outDirExists) {
      mkdirSync(logsOutDir);
    }

    let deps = '';
    for (const [key, value] of Object.entries(props._deps)) {
      deps += `[${key}]: ${value}\n`;
    }

    const data = `--> [${props._id}] - 
    ${props._at.split('T')[0]}, ${props._at.split('T')[1]}\n
    [${deps}]\n\n\n`;

    writeFileSync(`${logsOutDir}/${randomUUID()}.txt`, data);
    return {};
  }
}

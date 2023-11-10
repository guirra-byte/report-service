import { Process, Processor } from '@nestjs/bull';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { logsOutDir } from '../../config/report-pdf-path.config';
import { randomUUID } from 'crypto';
import { LogEntity } from '../model/log.model';
import { Job } from 'bull';

@Processor('logs')
export class LogsJobConsumer {
  @Process('gen')
  async gen(job: Job<LogEntity<any>>): Promise<unknown> {
    const inputJobData = job.data;

    const outDirExists = existsSync(logsOutDir);

    if (!outDirExists) {
      mkdirSync(logsOutDir);
    }

    let deps = '';
    for (const [key, value] of Object.entries(inputJobData._deps)) {
      deps += `[${key}]: ${value}\n`;
    }

    const data = `--> [${inputJobData._id}] - 
    ${inputJobData._at.split('T')[0]}, ${inputJobData._at.split('T')[1]}\n
    [${deps}]\n\n\n`;

    writeFileSync(`${logsOutDir}/${randomUUID()}.txt`, data);
    return {};
  }
}

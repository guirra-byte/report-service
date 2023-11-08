import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { INamedJobOptions, namedJobs } from '../config/namedJobs.config';
import { LogEntity } from './model/log.entity';

@Injectable()
export class LogsService {
  private processor: string;
  constructor(@InjectQueue('logs') private logsQueue: Queue) {
    this.processor = 'logs';
  }

  async gen(props: LogEntity<any>) {
    const ctxNamedJob = 'gen';
    const processorNamedJobs = namedJobs[this.processor] as INamedJobOptions[];

    const targetNamedJob = processorNamedJobs.find(
      (nmdJob) => nmdJob.jobName === ctxNamedJob,
    );

    if (!targetNamedJob) {
      throw new Error('Named job is not defined!');
    }

    await this.logsQueue.add(ctxNamedJob, props, {
      attempts: targetNamedJob.attempts,
      lifo: targetNamedJob.lifo,
      delay: targetNamedJob.delay,
      priority: targetNamedJob.priority,
    });
  }
}

import { isMainThread, Worker, workerData, parentPort } from 'worker_threads';
import { reportPDFProvider } from '../../../shared/infra/providers/report-pdf.provider';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IWorkerData, ReportsService } from '../reports.service';
import { Queue } from 'bull';

export interface QueueDataTransfer {
  instance: Queue;
  queue: string;
}

export const distributtingWorkers = async (
  incommingWorkerData: IWorkerData,
  queueDataTransfer: QueueDataTransfer,
) => {
  const worker = new Worker(__filename, {
    workerData: incommingWorkerData,
  });

  worker.on('online', () => {
    console.log(`New worker are online: ${worker.threadId}`);
  });

  worker.on('message', (target: number[]) => {
    const { instance, queue } = queueDataTransfer;
    instance.emit(`${queue}@done`, {
      target,
      status: 'DONE',
    });
  });

  worker.on('messageerror', (target: number[]) => {
    const { instance, queue } = queueDataTransfer;
    instance.emit(`${queue}@error`, {
      target,
      status: 'ERROR',
    });
  });
};

if (!isMainThread) {
  (async () => {
    const { arr } = workerData as IWorkerData;

    const salt = 40;
    for (let position = 0; position < arr.length; position += salt) {
      const targets: number[] = [];
      for (let index = position; position < salt; index++) {
        targets.push(arr[index]);
      }

      const targetsData = await new PrismaService().report.findMany({
        where: {
          id: {
            in: targets,
          },
        },
      });

      const errorReport = [];
      for (const { filename, id } of targetsData) {
        try {
          await reportPDFProvider({
            content: `${filename}-${id}`,
            filename: filename,
          });
        } catch (error) {
          errorReport.push(id);
        }
      }

      const targetsIds = targetsData.map((target) => target.id);
      parentPort.postMessage(targetsIds);

      if (errorReport.length !== 0) {
        parentPort.emit('messageerror', errorReport);
      }
    }
  })();
}

// Posso substituir o acesso ao banco de dados por arquivo .JSON;
// Disparar evento quando relatório for gerado -> Para sinalizar Main Thread;

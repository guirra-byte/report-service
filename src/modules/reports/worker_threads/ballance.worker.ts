import { $Enums } from '@prisma/client';
import { parentPort } from 'worker_threads';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { reportOutDir } from 'src/config/report-path.config';
import { Worker } from 'worker_threads';

export interface MessageDTO {
  id: number;
  filename: string;
  xlsxAssets: string[];
  created_at: Date;
  updated_at: Date;
  status: $Enums.Status;
  scheduled: boolean;
  delivery_at: Date;
}

parentPort.on('message', (incomming_data: MessageDTO[]) => {
  let range = 10;
  const xlsxWorker = new Worker('./xlsx-reader.worker.ts');
  const targetElements: MessageDTO[] = [];

  const onDemandExec = () => {
    while (range < 10) {
      const duplicatedFiles: MessageDTO[] = [];

      for (let j = 0; j <= range; j++) {
        const element = incomming_data[j];
        const filePath = path.resolve(reportOutDir, element.filename);
        const copy = fs.existsSync(filePath);

        if (copy) {
          duplicatedFiles.push(element);
          parentPort.postMessage({ msg: 'ballance:file-copy', id: element.id });
        } else {
          targetElements.push(element);
        }
      }

      xlsxWorker.postMessage(targetElements);
      incomming_data.splice(0, targetElements.length + duplicatedFiles.length);
      range = 0;
      break;
    }
  };

  xlsxWorker.on('message', (args: { [key: string]: number[] }) => {
    parentPort.postMessage(args);

    if (incomming_data.length > 0) {
      onDemandExec();
    }

    parentPort.close();
  });
});

//Worker para cada 10 elementos

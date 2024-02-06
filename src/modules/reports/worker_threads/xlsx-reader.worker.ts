import { parentPort, Worker } from 'node:worker_threads';
import { xlsxDir } from 'src/config/report-path.config';
import { Row, readXlsxFile } from 'read-excel-file/node';
import * as fs from 'node:fs';
import { MessageDTO } from './ballance.worker';

parentPort.on('message', (incomming_data: MessageDTO[]) => {
  const args = incomming_data.map((data) => {
    return { xlsxAssets: data.xlsxAssets, rprtFilename: data.filename };
  });

  const produceWorker = new Worker('./produce.worker.ts');
  produceWorker.on('message', () => {});

  for (const arg of args) {
    for (const xlsxFile of arg.xlsxAssets) {
      const path = xlsxDir.concat(`/${xlsxFile}`);

      const chunks = fs.createReadStream(path);
      chunks.on('data', (chunk: string | Buffer) => {
        readXlsxFile(chunk)
          .then((rows: Row[]) => {
            const claimMsgProps = incomming_data.find(
              (msg) => msg.filename === arg.rprtFilename,
            );

            produceWorker.postMessage({ msg: claimMsgProps, row: rows });
          })
          .catch((reason: any) => {
            console.error(reason);
          });
      });
    }
  }
});

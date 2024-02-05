import { parentPort } from 'worker_threads';
import { MessageDTO } from './ballance.worker';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { reportOutDir } from 'src/config/report-path.config';

const baseTxt = `\n Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \n`;

parentPort.on('message', (args: MessageDTO[]) => {
  for (const arg of args) {
    const filePath = path.resolve(reportOutDir, `${arg.filename}.txt`);
    fs.writeFile(
      filePath,
      `${arg.id} - ${new Date().toISOString()}\n`,
      (err) => {
        if (err) {
          throw err;
        }
      },
    );

    const chunks = fs.createReadStream(filePath);
    const overwriteChunks = fs.createWriteStream(filePath);

    const workerKey = 'produce';
    const results: Record<string, number[]> = {};

    const lineResults = (key: string, status: string, owner: number) => {
      if (results[`${key}:${status}`]) {
        results[`${key}:${status}`].push(owner);
      } else {
        results[`${key}:${status}`] = [owner];
      }
    };

    chunks.on('error', () => {
      lineResults(workerKey, 'error', arg.id);
    });

    chunks.on('data', () => {
      for (let pointer = 0; pointer < 1e6; pointer++) {
        overwriteChunks.write(baseTxt);
      }

      lineResults(workerKey, 'ok', arg.id);
    });

    overwriteChunks.on('finish', () => {
      for (const [key, value] of Object.entries(results)) {
        parentPort.postMessage({ [`${key}`]: value });
      }
    });
  }
});

//Quando evento for 'finish' for disparado novos elementos são inseridos na esteira;

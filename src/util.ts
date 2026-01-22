import {
  spawn,
  type ExecException,
} from 'child_process';
import { readFile } from 'fs/promises';
import type { PathLike } from 'node:fs';
import type { FileHandle } from 'node:fs/promises';
import type { FastifyReply } from 'fastify';

const units = Object.freeze(['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']);
const unitsSizesMap = Object.freeze({
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
});

export type Unit = keyof typeof unitsSizesMap;

export const toBytes = (amount: number, unit: Unit): number => {
  if (!unitsSizesMap[unit]) {
    throw new Error(`Unsupported unit: ${unit}`);
  }

  return amount * unitsSizesMap[unit];
};

export const fromBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) {
    return '0 B';
  }

  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${Number(value.toFixed(decimals))} ${units[unitIndex]}`;
};

export const readJSON = async (path: PathLike | FileHandle): Promise<string> => {
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    console.error(`[readJSON] error: ${e}`);

    return '{}';
  }
};

export const handleExecError = (
  error: ExecException | null,
  stderr: string,
  reply: FastifyReply,
): void => {
  console.error(`error: ${error?.message}`);
  console.error(`stderr: ${stderr}`);

  reply
    .status(500)
    .send({
      message: `error: ${error?.message} stderr: ${stderr}`,
    });
};

let isGeneratingReport = false;

export const generateGoAccessReport = (): void => {
  if (isGeneratingReport) {
    return;
  }

  isGeneratingReport = true;
  const cmd = spawn('docker', [
    'exec',
    '-t',
    'goaccess-public',
    '/goaccess/goaccess',
    '/opt/log/access.log',
    '--log-format=CADDY',
    '-o',
    '/report/report.json',
  ]);

  // cmd.stdout?.on('data', (data) => {
  //   console.log(`[generateGoAccessReport] stdout: ${data}`);
  // });

  cmd.stderr?.on('data', (data) => {
    console.error(`[generateGoAccessReport] stderr: ${data}`);
  });

  cmd.on('error', (err) => {
    console.error(`[generateGoAccessReport] error: ${err}`);
  });

  cmd.on('exit', (code: number) => {
    console.log(`[generateGoAccessReport] process exited with code ${code}`);
  });

  cmd.on('close', (code) => {
    isGeneratingReport = false;
    console.log(`[generateGoAccessReport] process closed with code ${code}`);
  });
};

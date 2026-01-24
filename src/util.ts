import { $, spawn, file } from 'bun';
import type { FastifyReply } from 'fastify';

let isGeneratingReport = false;
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

export const readJSON = async (path: string | URL): Promise<string> => {
  try {
    return await file(path).text();
  } catch (e) {
    console.error(`[readJSON] error: ${e}`);

    return '{}';
  }
};

export const handleExecError = (
  stderr: string,
  reply: FastifyReply,
): void => {
  console.error(`stderr: ${stderr}`);

  reply
    .status(500)
    .send({
      message: `stderr: ${stderr}`,
    });
};

export const runShellCommand = async (cmd: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> => {
  const { stdout, stderr, exitCode } = await $`sh -c ${cmd}`.nothrow();

  console.log(`[runShellCommand] ${cmd} exitCode: ${exitCode}`);

  return {
    stdout: stdout.toString(),
    stderr: stderr.toString(),
    exitCode,
  }
}

export const generateGoAccessReport = async (): Promise<void> => {
  if (isGeneratingReport) {
    return;
  }

  isGeneratingReport = true;

  try {
    const proc = spawn([
      'docker',
      'exec',
      '-t',
      'goaccess-public',
      '/goaccess/goaccess',
      '/opt/log/access.log',
      '--log-format=CADDY',
      '-o',
      '/report/report.json',
    ]);
    const exitCode = await proc.exited;

    console.log('[generateGoAccessReport] exited with code:', exitCode);
    isGeneratingReport = false;
  } catch (e) {
    console.error('[generateGoAccessReport] error:', e);
    isGeneratingReport = false;
  }
};

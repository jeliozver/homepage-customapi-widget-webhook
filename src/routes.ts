import server from './app';
import {
  runShellCommand,
  generateGoAccessReport,
  handleExecError,
  readJSON,
  toBytes,
  type Unit,
} from './util';
import {
  getCookie,
  setCookie,
} from './cookie';
import type {
  IReplyFail2Ban,
  IReplyWireGuard,
  IReplyWatchYourLan,
  IReplyGoAccess,
  IReplyCrossSeed,
  IBodyCrossSeed,
  IReplyRestic,
  IReplyDockhand,
  IBodyDockhand,
} from './types';

server.get<{
  Reply: IReplyFail2Ban,
}>('/fail2ban',  async (_, reply): Promise<void> => {
  const {
    stdout,
    stderr,
    exitCode,
  } = await runShellCommand('docker exec -t fail2ban fail2ban-client status --all');

  if (exitCode !== 0 || stderr) {
    handleExecError(stderr, reply);
    return;
  }

  try {
    const regex:RegExp = /Number of jail:\s+([0-9]+)|Total failed:\s+([0-9]+)|Total banned:\s+([0-9]+)/g;

    let array: RegExpExecArray | null;
    let total = 0;
    let failed = 0;
    let banned = 0;

    while ((array = regex.exec(stdout)) !== null) {
      total += Number(array[1] || 0);
      failed += Number(array[2] || 0);
      banned += Number(array[3] || 0);
    }

    reply
      .status(200)
      .send({
        total,
        failed,
        banned,
      });
  }  catch (e) {
    console.error(`/fail2ban => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});

server.get<{
  Reply: IReplyWireGuard,
}>('/wireGuard', async (_, reply): Promise<void> => {
  const { stdout, stderr, exitCode } = await runShellCommand('pivpn clients');

  if (exitCode !== 0 || stderr) {
    handleExecError(stderr, reply);
    return;
  }

  try {
    const threshold = 2;
    const maxDateStrLen = 22;

    const clients = stdout.split('\n').filter((e) => e !== '').slice(2);
    const disabledLabelIndex = clients.indexOf('::: Disabled clients :::', 0);
    const enabledClients = clients.slice(0, disabledLabelIndex);
    const disabledClients = clients.slice(disabledLabelIndex + 1);

    const connected: string[] = [];
    const enabled = enabledClients.length;
    const disabled = disabledClients.length;
    const total = enabled + disabled;

    const now = new Date().getTime();

    enabledClients.forEach((client) => {
      if (client.indexOf('(not yet)') === -1) {
        const dateStr = client.substring(
          client.length - maxDateStrLen,
          client.length,
        );
        const lastSeen = new Date(dateStr.replace(' - ', ' ')).getTime();

        if ((now - lastSeen) < threshold * 60 * 1000) {
          connected.push(client);
        }
      }
    });

    reply
      .status(200)
      .send({
        connected: connected.length,
        enabled,
        disabled,
        total,
      });
  } catch (e) {
    console.error(`/wireGuard => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});

server.get<{
  Reply: IReplyWatchYourLan,
}>('/wyl', async (_, reply): Promise<void> => {
  try {
    const raw = await fetch('http://192.168.100.13:8840/api/status/');
    const data = await raw.json() as IReplyWatchYourLan[200];

    reply.status(200).send(data);
  } catch (e) {
    console.error(`/wyl => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});

server.post<{
  Reply: IReplyCrossSeed,
  Body: IBodyCrossSeed,
}>('/cs', async (request, reply): Promise<void> => {
  try {
    const { url, username, password } = request.body;
    let cookie = await getCookie(url);
    let raw = await fetch(
      `${url}/api/trpc/stats.getOverview?batch=1&input=%7B%7D`,
      { 
        headers: {
          Cookie: cookie,
        },
      },
    );

    if (raw.status === 401 && username && password) {
      const login = await fetch(`${url}/api/trpc/auth.logIn?batch=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'0': { username, password }}),
      });

      if (login.status !== 200) {
        const r = await login.json();
        const message = `/cs => error logging in: ${login.status}`;
        console.error(r);
        return reply.status(500).send({
          message,
        });
      }

      cookie = await setCookie(url, login.headers);

      raw = await fetch(
        `${url}/api/trpc/stats.getOverview?batch=1&input=%7B%7D`,
        {
          headers: {
            Cookie: cookie,
          },
        },
      );
    }

    if (raw.status === 200) {
      const json = await raw.json() as any[];
      const data = json[0].result.data as IReplyCrossSeed[200];

      return reply.status(200).send(data);
    }

    const err = await raw.json();

    const message = `/cs => status: ${raw.status} error: ${JSON.stringify(err)}`;
    console.error(message);
    return reply.status(500).send({
      message,
    });
  } catch (e) {
    console.error(`/cs => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});

server.get<{
  Reply: IReplyGoAccess,
}>('/goaccess', async (_, reply): Promise<void> => {
  try {
    generateGoAccessReport();
    const JSONString = await readJSON('../stacks/homelab/apps/goaccess/report.json');
    const report = JSON.parse(JSONString);
    const stats = report.general || {
      total_requests: 0,
      valid_requests: 0,
      failed_requests: 0,
      unique_visitors: 0,
      unique_referrers: 0,
      bandwidth: 0,
    } as IReplyGoAccess[200];

    reply.status(200).send(stats);
  } catch (e) {
    console.error(`/goaccess => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});

server.get<{
  Reply: IReplyRestic,
}>('/restic', async (_, reply): Promise<void> => {
  const {
    stdout,
    stderr,
    exitCode,
  } = await runShellCommand('sudo restic --repo=../restic-repo --password-file=../restic.txt snapshots');

  if (exitCode !== 0 || stderr) {
    handleExecError(stderr, reply);
    return;
  }

  try {
    const sizeRegex: RegExp = /([0-9]+\.?[0-9]+) (\w+)$/g;
    const lines = stdout.split('\n').filter((item) => item !== '');
    const snapshots = lines.slice(2, lines.length - 2);
    let fullSizeInBytes = 0;

    snapshots.forEach((snapshot) => {
      const [_, size, unit] = sizeRegex.exec(snapshot) || [];
      sizeRegex.lastIndex = 0;

      fullSizeInBytes += toBytes(Number(size), unit as Unit);
    });

    reply.status(200).send({
      total_snapshots: snapshots.length,
      total_size: fullSizeInBytes,
    });

  } catch (e) {
    console.error(`/restic => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});

server.post<{
  Reply: IReplyDockhand,
  Body: IBodyDockhand,
}>('/dockhand', async (request, reply): Promise<void> => {
  try {
    const { url, env, username, password } = request.body;
    let cookie = await getCookie(url);

    let raw = await fetch(`${url}/api/dashboard/stats?env=${env}`, {
      headers: {
        'Cookie': cookie,
      },
    });

    if (raw.status === 401 && username && password) {
      const login = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (login.status !== 200) {
        const message = `/dockhand => error logging in: ${login.status}`;
        console.error(message);
        return reply.status(500).send({
          message,
        });
      }

      cookie = await setCookie(url, login.headers);

      raw = await fetch(`${url}/api/dashboard/stats?env=${env}`, {
        headers: {
          'Cookie': cookie,
        },
      });
    }

    if (raw.status === 200) {
      const data = await raw.json() as IReplyDockhand[200];

      return reply.status(200).send(data);
    }

    const err = await raw.json();

    const message = `/dockhand => status: ${raw.status} error: ${JSON.stringify(err)}`;
    console.error(message);
    return reply.status(500).send({
      message,
    });
  } catch (e) {
    console.error(`/dockhand => error: ${e}`);
    reply.status(500).send({
      message: 'Something went wrong :(',
    });
  }
});
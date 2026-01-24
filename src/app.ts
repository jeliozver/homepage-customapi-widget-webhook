import Fastify, {
  type FastifyInstance,
} from 'fastify';
import { generateGoAccessReport } from './util';

const server: FastifyInstance = Fastify({});

process.on('SIGTERM', () => {
  console.log('server closing!');
  server.close(() => process.exit(0));
});

(async () => {
  try {
    await import('./routes');
    await server.listen({ port: 3030, host: '0.0.0.0' });

    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;

    console.info(`Server is listening on port: ${port}`);

    generateGoAccessReport();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

export default server;

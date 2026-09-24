import { Cluster, Redis, type RedisOptions } from 'ioredis';

const AZURE_MANAGED_REDIS_HOST = 'azure.net';
const DEFAULT_REDIS_PORT = 10_000;

export type RedisClient = Redis | Cluster;

export function createRedisClient(connectionString: string): RedisClient {
  if (!connectionString.includes(AZURE_MANAGED_REDIS_HOST)) {
    return createStandaloneRedisClient(connectionString);
  }

  return createClusterRedisClient(connectionString);
}

function createStandaloneRedisClient(connectionString: string): Redis {
  return new Redis(connectionString);
}

function createClusterRedisClient(connectionString: string) {
  const url = new URL(connectionString);

  const redisOptions: RedisOptions = {
    ...(url.username && { username: url.username }),
    ...(url.password && { password: decodeURIComponent(url.password) }),
    ...(url.protocol === 'rediss:' && {
      tls: { servername: url.hostname },
    }),
  };

  return new Cluster(
    [{
      host: url.hostname,
      port: Number(url.port) || DEFAULT_REDIS_PORT,
    }],
    { redisOptions },
  );
}
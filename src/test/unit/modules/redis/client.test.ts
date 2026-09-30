import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const redisConstructorMock = jest.fn().mockImplementation((connectionString: unknown) => ({
  kind: 'standalone',
  connectionString,
}));
const clusterConstructorMock = jest.fn().mockImplementation((nodes: unknown, options: unknown) => ({
  kind: 'cluster',
  nodes,
  options,
}));

jest.mock('ioredis', () => ({
  Redis: redisConstructorMock,
  Cluster: clusterConstructorMock,
}));

import { createRedisClient } from '../../../../main/modules/redis/client';

describe('createRedisClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates standalone client for Redis host outside Azure managed redis', () => {
    const connectionString = 'redis://localhost:6379';

    const client = createRedisClient(connectionString) as unknown as { kind: string; connectionString: string };

    expect(redisConstructorMock).toHaveBeenCalledWith(connectionString);
    expect(clusterConstructorMock).not.toHaveBeenCalled();
    expect(client.kind).toBe('standalone');
  });

  it('creates cluster client for Azure managed redis host', () => {
    const connectionString = 'rediss://default:password@finrem-citizen-ui.redis.azure.net:10000';

    const client = createRedisClient(connectionString) as unknown as {
      kind: string;
      nodes: { host: string; port: number }[];
      options: { redisOptions: { username: string; password: string; tls: { servername: string } } };
    };

    expect(clusterConstructorMock).toHaveBeenCalledWith(
      [{ host: 'finrem-citizen-ui.redis.azure.net', port: 10000 }],
      {
        redisOptions: {
          username: 'default',
          password: 'password',
          tls: { servername: 'finrem-citizen-ui.redis.azure.net' },
        },
      }
    );
    expect(redisConstructorMock).not.toHaveBeenCalled();
    expect(client.kind).toBe('cluster');
  });

  it('defaults managed redis cluster port to 10000 when omitted', () => {
    const connectionString = 'rediss://default:password@finrem-citizen-ui.redis.azure.net';

    createRedisClient(connectionString);

    expect(clusterConstructorMock).toHaveBeenCalledWith(
      [{ host: 'finrem-citizen-ui.redis.azure.net', port: 10000 }],
      expect.any(Object)
    );
  });
});

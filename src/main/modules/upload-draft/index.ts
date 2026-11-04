import config from 'config';
import type { Request } from 'express';
import type { SessionData } from 'express-session';

import type { RedisClient } from '../redis/client';

interface UploadDraft {
  version: 1;
  DocumentSelection?: SessionData['DocumentSelection'];
  documents?: SessionData['documents'];
  updatedAt: string;
}

function getDraftContext(req: Request): {
  redis: RedisClient;
  key: string;
} {
  const userId = req.session.user?.id;
  const caseNumber = req.session.caseNumber;
  const caseRole = req.session.user?.caseRole;
  const redis = req.app.locals.redisClient as RedisClient | undefined;

  if (!userId || !caseNumber || !caseRole) {
    throw new Error('Cannot access upload draft without authorised case context');
  }

  if (!redis) {
    throw new Error('Redis is required for upload draft persistence');
  }

  const prefix = config.get<string>('session.prefix');
  const owner = encodeURIComponent(userId);
  const caseId = encodeURIComponent(caseNumber);

  return {
    redis,
    key: `${prefix}:upload-draft:${owner}:${caseId}`,
  };
}

export async function saveUploadDraft(req: Request): Promise<void> {
  const { redis, key } = getDraftContext(req);
  const ttl = config.get<number>('uploadDraft.ttlInSeconds');

  const draft: UploadDraft = {
    version: 1,
    DocumentSelection: req.session.DocumentSelection,
    documents: req.session.documents,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(key, JSON.stringify(draft), 'EX', ttl);
}

export async function restoreUploadDraft(req: Request): Promise<void> {
  const { redis, key } = getDraftContext(req);
  const stored = await redis.get(key);

  if (!stored) {
    return;
  }

  const draft = JSON.parse(stored) as UploadDraft;

  if (draft.version !== 1) {
    throw new Error('Unsupported upload draft version');
  }

  req.session.DocumentSelection = draft.DocumentSelection;
  req.session.documents = draft.documents;
}

export async function deleteUploadDraft(req: Request): Promise<void> {
  const { redis, key } = getDraftContext(req);
  await redis.del(key);
}

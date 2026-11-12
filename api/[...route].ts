import type { VercelRequest, VercelResponse } from '@vercel/node';
import app, { ensureDatabase } from '../server.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDatabase();
  return new Promise<void>((resolve, reject) => {
    // Cast to any: Express and Vercel share the same underlying IncomingMessage/ServerResponse
    (app as any)(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

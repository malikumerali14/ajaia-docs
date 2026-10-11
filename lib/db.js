import { MongoClient } from 'mongodb';

// Cached across hot reloads / serverless invocations.
export async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  globalThis._mongo ??= new MongoClient(process.env.MONGODB_URI).connect().catch((e) => {
    globalThis._mongo = undefined;
    throw e;
  });
  return (await globalThis._mongo).db(process.env.MONGODB_DB || 'ajaia_docs');
}
export const docs = async () => (await getDb()).collection('documents');

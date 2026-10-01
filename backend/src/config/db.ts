import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[db] connection failed: ${reason}`);
    // eslint-disable-next-line no-console
    console.error('[db] check that MONGODB_URI in server/.env points to a reachable database.');
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] disconnected');
  });
}

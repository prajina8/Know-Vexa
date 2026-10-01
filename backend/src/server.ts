import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`[server] AI provider: ${env.aiProvider}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] fatal startup error', err);
  process.exit(1);
});

import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { recoverStuckMaterials } from './controllers/materialController';

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] uncaught exception:', err);
});

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
    console.log(`[server] AI provider: ${env.aiProvider}`);
  });

  void recoverStuckMaterials();
}

main().catch((err) => {
  console.error('[server] fatal startup error', err);
  process.exit(1);
});
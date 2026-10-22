import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/database';
import { config } from './config';
import app from './app';

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Daily Brew server running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Frontend origin: ${config.frontendOrigin}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

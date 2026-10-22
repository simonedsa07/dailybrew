import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET || 'fallback-dev-secret-change-me';
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/daily-brew';
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

if (isProduction) {
  if (
    !process.env.JWT_SECRET ||
    jwtSecret === 'fallback-dev-secret-change-me' ||
    jwtSecret.length < 32
  ) {
    throw new Error('Production requires a JWT_SECRET of at least 32 characters.');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Production requires MONGODB_URI.');
  }

  if (!process.env.FRONTEND_ORIGIN) {
    throw new Error('Production requires FRONTEND_ORIGIN.');
  }

  let parsedFrontendOrigin: URL;
  try {
    parsedFrontendOrigin = new URL(frontendOrigin);
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid HTTPS URL in production.');
  }

  if (
    parsedFrontendOrigin.protocol !== 'https:' ||
    parsedFrontendOrigin.origin !== frontendOrigin
  ) {
    throw new Error('FRONTEND_ORIGIN must be an HTTPS origin without a path in production.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigin,
  nodeEnv,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  // Reward values (server-authoritative)
  rewards: {
    habitCompletion: 5,
    dailyCheckIn: 3,
    allHabitsBonus: 10,
  },
} as const;

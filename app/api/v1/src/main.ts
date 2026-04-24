import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import {
  isProduction,
  parseBoolean,
  parsePositiveInt,
} from './common/security/env';
import { createRateLimitMiddleware } from './common/security/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  const trustProxy = parseBoolean(process.env.TRUST_PROXY, isProduction());
  if (trustProxy) {
    expressApp.set('trust proxy', 1);
  }

  const bodyLimit = process.env.REQUEST_BODY_LIMIT || '512kb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    );
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (isProduction() && req.secure) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  const authWindowMs = parsePositiveInt(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  );
  const authMax = parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 20);
  const refreshMax = parsePositiveInt(process.env.REFRESH_RATE_LIMIT_MAX, 60);

  const authLimiter = createRateLimitMiddleware({
    windowMs: authWindowMs,
    max: authMax,
    message: 'Too many authentication attempts, please try again later.',
    keyPrefix: 'auth',
  });

  const refreshLimiter = createRateLimitMiddleware({
    windowMs: authWindowMs,
    max: refreshMax,
    message: 'Too many refresh attempts, please try again later.',
    keyPrefix: 'refresh',
  });

  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/google/start', authLimiter);
  app.use('/api/v1/auth/google/callback', authLimiter);
  app.use('/api/v1/auth/refresh', refreshLimiter);

  const configuredCorsOrigins =
    process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL;
  if (isProduction() && !configuredCorsOrigins) {
    throw new Error(
      'Set CORS_ORIGIN (comma-separated list) or FRONTEND_URL in production.',
    );
  }

  const allowedOrigins = (
    configuredCorsOrigins ?? 'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}`);
}
bootstrap();

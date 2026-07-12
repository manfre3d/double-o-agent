import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SessionMiddleware } from './session/session.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  const config = app.get(ConfigService);

  // Behind Render's proxy: trust X-Forwarded-* so Secure cookies and client IPs resolve.
  app.set('trust proxy', 1);
  app.use(cookieParser(config.getOrThrow<string>('SESSION_COOKIE_SECRET')));
  // Global (all routes, incl. the SPA shell) so a session cookie is minted on the
  // very first visit; app.use avoids router-specific wildcard quirks.
  const session = app.get(SessionMiddleware);
  app.use(session.use.bind(session));

  await app.listen(config.get<number>('PORT') ?? 3000);
}
void bootstrap();

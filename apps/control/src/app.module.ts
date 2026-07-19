import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MissionsModule } from './missions/missions.module';
import { SessionMiddleware } from './session/session.middleware';
import { SessionThrottlerGuard } from './session/session-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env lives at the repo root; the first path covers running from apps/control.
      envFilePath: ['.env', '../../.env'],
    }),
    // Abuse/cost guard for the public, unauthenticated LLM endpoints; per-route
    // limits live on the controllers and are keyed by session (see guard).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    // Drives the mission retention sweep (RetentionService @Cron).
    ScheduleModule.forRoot(),
    // Serves HQ's built bundle from the same origin, so production is one
    // service and '/api' needs no CORS. In dev the folder may be missing —
    // harmless, since HQ is served by ng serve on 4200 instead.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'hq', 'dist', 'hq', 'browser'),
      exclude: ['/api/{*splat}'],
    }),
    // Provides LLM_LIVE_AVAILABLE for AppService's status report.
    AgentModule,
    InvoicesModule,
    MissionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SessionMiddleware,
    { provide: APP_GUARD, useClass: SessionThrottlerGuard },
  ],
})
export class AppModule {}

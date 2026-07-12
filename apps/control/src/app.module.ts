import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionsModule } from './missions/missions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env lives at the repo root; the first path covers running from apps/control.
      envFilePath: ['.env', '../../.env'],
    }),
    // Serves HQ's built bundle from the same origin, so production is one
    // service and '/api' needs no CORS. In dev the folder may be missing —
    // harmless, since HQ is served by ng serve on 4200 instead.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'hq', 'dist', 'hq', 'browser'),
      exclude: ['/api/{*splat}'],
    }),
    MissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

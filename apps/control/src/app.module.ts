import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    MissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

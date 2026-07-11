import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionsRepository } from './missions.repository';

@Module({
  imports: [AgentModule, PrismaModule],
  controllers: [MissionsController],
  providers: [MissionsService, MissionsRepository],
})
export class MissionsModule {}

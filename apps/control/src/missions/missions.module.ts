import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

@Module({
  imports: [AgentModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}

import { Module } from '@nestjs/common';
import { GadgetsModule } from '../gadgets/gadgets.module';
import { LlmService } from './llm.service';
import { AgentLoopService } from './agent-loop.service';

@Module({
  imports: [GadgetsModule],
  providers: [LlmService, AgentLoopService],
  exports: [AgentLoopService],
})
export class AgentModule {}

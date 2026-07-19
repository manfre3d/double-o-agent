import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GadgetsModule } from '../gadgets/gadgets.module';
import {
  LLM_LIVE_AVAILABLE,
  liveLlmAvailable,
  LlmService,
  OpenAiLlmService,
} from './llm.service';
import { DemoLlmService } from './demo-llm.service';
import { AgentLoopService } from './agent-loop.service';

@Module({
  imports: [GadgetsModule],
  providers: [
    // Always available so a live-configured run can still be launched in demo
    // mode. Built via factory: its only ctor param is a primitive with a
    // default, which Nest can't resolve by DI.
    { provide: DemoLlmService, useFactory: () => new DemoLlmService() },
    {
      provide: LLM_LIVE_AVAILABLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): boolean => liveLlmAvailable(config),
    },
    {
      // Default brain: live when a key is configured, else the demo singleton.
      provide: LlmService,
      inject: [ConfigService, DemoLlmService],
      useFactory: (config: ConfigService, demo: DemoLlmService): LlmService => {
        if (!liveLlmAvailable(config)) {
          new Logger('AgentModule').warn(
            config.get<string>('DEMO_MODE') === 'true'
              ? 'DEMO_MODE=true — missions run on the scripted demo brain.'
              : 'No usable OPENAI_API_KEY — missions run on the scripted demo brain. Set the key in .env for live missions.',
          );
          return demo;
        }
        return new OpenAiLlmService(config);
      },
    },
    AgentLoopService,
  ],
  exports: [AgentLoopService, LLM_LIVE_AVAILABLE],
})
export class AgentModule {}

import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GadgetsModule } from '../gadgets/gadgets.module';
import { LlmService, OpenAiLlmService } from './llm.service';
import { DemoLlmService } from './demo-llm.service';
import { AgentLoopService } from './agent-loop.service';

/** The placeholder shipped in .env.example — not a usable key. */
const PLACEHOLDER_KEY = 'sk-replace-me';

@Module({
  imports: [GadgetsModule],
  providers: [
    {
      provide: LlmService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): LlmService => {
        const key = config.get<string>('OPENAI_API_KEY');
        const forced = config.get<string>('DEMO_MODE') === 'true';
        if (forced || !key || key === PLACEHOLDER_KEY) {
          new Logger('AgentModule').warn(
            forced
              ? 'DEMO_MODE=true — missions run on the scripted demo brain.'
              : 'No usable OPENAI_API_KEY — missions run on the scripted demo brain. Set the key in .env for live missions.',
          );
          return new DemoLlmService();
        }
        return new OpenAiLlmService(config);
      },
    },
    AgentLoopService,
  ],
  exports: [AgentLoopService],
})
export class AgentModule {}

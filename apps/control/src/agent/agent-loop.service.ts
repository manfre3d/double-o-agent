import { Inject, Injectable } from '@nestjs/common';
import type {
  BriefingEvent,
  DebriefEvent,
  GadgetCallEvent,
  GadgetResultEvent,
  MissionErrorEvent,
  ThinkingEvent,
} from '@double-o/shared';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { MissionContext, MissionDocument } from '../gadgets/gadget.interface';
import { LLM_LIVE_AVAILABLE, LlmService } from './llm.service';
import { DemoLlmService } from './demo-llm.service';
import { ChatMessage } from './agent.types';

type Draft<T> = Omit<T, 'missionId' | 'seq' | 'at'>;
export type MissionEventDraft =
  | Draft<BriefingEvent>
  | Draft<ThinkingEvent>
  | Draft<GadgetCallEvent>
  | Draft<GadgetResultEvent>
  | Draft<DebriefEvent>
  | Draft<MissionErrorEvent>;

export type EmitFn = (draft: MissionEventDraft) => void;

export interface MissionRunSpec {
  missionId: string;
  code: string;
  /** Italian lore strings, shown in the briefing event. */
  title: string;
  objective: string;
  /** English task prompt handed to the LLM as the user message. */
  task: string;
  /** English mission-specific rules, appended to the shared system prompt. */
  instructions: string;
  /** Gadget names exposed to the LLM for this mission. */
  gadgets: string[];
  /** Uploaded document, attached to extraction missions. */
  document?: MissionDocument;
}

const MAX_TURNS = 12;

const SYSTEM_PROMPT = `You are Double-O Agent, an AI field agent working for a small-business finance team, completing the current mission using only the tools provided.

Rules:
- Inspect the data with tools before drawing any conclusion.
- Everything you write is streamed live to an Italian-speaking user: write all prose (interim notes, flag reasons, final report) in Italian — terse, professional, with a light 1960s spy-film flavor. Never switch to English.
- Your words are rendered verbatim on a plain-text feed: no markdown of any kind (no **bold**, bullet lists, or headers) — write flowing prose.
- When the mission is complete, reply without any tool call: that final message is the mission debrief, summarizing what was done and any anomaly worth a follow-up.`;

@Injectable()
export class AgentLoopService {
  constructor(
    private readonly llm: LlmService,
    private readonly demo: DemoLlmService,
    private readonly registry: GadgetRegistry,
    @Inject(LLM_LIVE_AVAILABLE) private readonly liveAvailable: boolean,
  ) {}

  async run(
    spec: MissionRunSpec,
    emit: EmitFn,
    opts: { demo?: boolean } = {},
  ): Promise<void> {
    // Honest fallback: without a live brain, every run is demo regardless of the flag.
    const brain = opts.demo || !this.liveAvailable ? this.demo : this.llm;
    emit({
      type: 'briefing',
      code: spec.code,
      title: spec.title,
      objective: spec.objective,
    });

    const ctx: MissionContext = {
      missionId: spec.missionId,
      flagged: [],
      document: spec.document,
    };
    const tools = this.registry.toolDefinitions(spec.gadgets);
    const messages: ChatMessage[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${spec.instructions}` },
      { role: 'user', content: spec.task },
    ];

    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const reply = await brain.chat(messages, tools);

        if (reply.toolCalls.length === 0) {
          emit({
            type: 'debrief',
            text: reply.text ?? 'Missione conclusa.',
            flagged: ctx.flagged,
            ...(ctx.extracted ? { extracted: ctx.extracted } : {}),
          });
          return;
        }

        if (reply.text) {
          emit({ type: 'thinking', text: reply.text });
        }
        messages.push({
          role: 'assistant',
          content: reply.text,
          toolCalls: reply.toolCalls,
        });

        for (const call of reply.toolCalls) {
          emit({ type: 'gadget_call', gadget: call.name, params: call.args });
          const outcome = await this.registry.execute(
            call.name,
            call.args,
            ctx,
          );
          emit({
            type: 'gadget_result',
            gadget: call.name,
            ok: outcome.ok,
            result: outcome.ok ? outcome.value : undefined,
            error: outcome.ok ? undefined : outcome.error,
          });
          messages.push({
            role: 'tool',
            toolCallId: call.id,
            content: JSON.stringify(
              outcome.ok ? outcome.value : { error: outcome.error },
            ),
          });
        }
      }
      emit({
        type: 'error',
        message: 'Missione interrotta: limite di turni raggiunto.',
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      emit({ type: 'error', message: `Missione fallita: ${detail}` });
    }
  }
}

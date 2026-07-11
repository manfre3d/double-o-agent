import { Injectable } from '@nestjs/common';
import type {
  BriefingEvent,
  DebriefEvent,
  GadgetCallEvent,
  GadgetResultEvent,
  MissionErrorEvent,
  ThinkingEvent,
} from '@double-o/shared';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { MissionContext } from '../gadgets/gadget.interface';
import { LlmService } from './llm.service';
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
}

const MAX_TURNS = 12;

const SYSTEM_PROMPT = `You are Double-O Agent, an AI field agent working for a small-business finance team.
Your mission: hunt duplicate invoices in the current batch, using only the tools provided.

Rules:
- Inspect the data with tools before drawing any conclusion.
- A duplicate is the same supplier invoice entered more than once; formatting differences in the invoice number or a one-day date slip do not make two entries distinct.
- Verify each suspicion with a comparison before flagging, and flag the redundant copy, not the original.
- Everything you write is streamed live to an Italian-speaking user: write all prose (interim notes, flag reasons, final report) in Italian — terse, professional, with a light 1960s spy-film flavor. Never switch to English.
- Your words are rendered verbatim on a plain-text feed: no markdown of any kind (no **bold**, bullet lists, or headers) — write flowing prose; name invoices inline by their id.
- When the hunt is complete, reply without any tool call: that final message is the mission debrief. Summarize what was scanned, what was flagged and why, and any anomaly worth a follow-up.`;

@Injectable()
export class AgentLoopService {
  constructor(
    private readonly llm: LlmService,
    private readonly registry: GadgetRegistry,
  ) {}

  async run(spec: MissionRunSpec, emit: EmitFn): Promise<void> {
    emit({
      type: 'briefing',
      code: spec.code,
      title: spec.title,
      objective: spec.objective,
    });

    const ctx: MissionContext = { missionId: spec.missionId, flagged: [] };
    const tools = this.registry.toolDefinitions();
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: spec.task },
    ];

    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const reply = await this.llm.chat(messages, tools);

        if (reply.toolCalls.length === 0) {
          emit({
            type: 'debrief',
            text: reply.text ?? 'Missione conclusa.',
            flagged: ctx.flagged,
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

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import type { ToolDefinition } from '../gadgets/gadget.registry';
import type { AssistantTurn, ChatMessage } from './agent.types';

/**
 * Injection token + contract for the agent's brain. The agent loop only
 * knows this interface; AgentModule decides which implementation to bind
 * (OpenAI, or the scripted demo brain when no API key is configured).
 */
export abstract class LlmService {
  abstract chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ): Promise<AssistantTurn>;
}

/** The placeholder shipped in .env.example — not a usable key. */
export const PLACEHOLDER_KEY = 'sk-replace-me';

/** DI token for a boolean: whether a live OpenAI brain is configured. */
export const LLM_LIVE_AVAILABLE = 'LLM_LIVE_AVAILABLE';

/**
 * Single source of truth for whether live missions are possible. False when the
 * key is missing/placeholder or when DEMO_MODE forces the scripted brain globally.
 */
export function liveLlmAvailable(config: ConfigService): boolean {
  const key = config.get<string>('OPENAI_API_KEY');
  const forced = config.get<string>('DEMO_MODE') === 'true';
  return !forced && !!key && key !== PLACEHOLDER_KEY;
}

/**
 * The only class in the codebase that imports the OpenAI SDK.
 * Swapping providers means rewriting this class and nothing else.
 */
@Injectable()
export class OpenAiLlmService extends LlmService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    super();
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set — add it to .env (see .env.example).',
      );
    }
    this.client = new OpenAI({ apiKey });
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  async chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ): Promise<AssistantTurn> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(toOpenAiMessage),
      tools: tools.map(toOpenAiTool),
    });

    const reply = completion.choices[0]?.message;
    if (!reply) {
      throw new Error('LLM returned no choices.');
    }
    return {
      text: reply.content ?? undefined,
      toolCalls: (reply.tool_calls ?? [])
        .filter((tc) => tc.type === 'function')
        .map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          args: parseArgs(tc.function.arguments),
        })),
    };
  }
}

function toOpenAiMessage(message: ChatMessage): ChatCompletionMessageParam {
  switch (message.role) {
    case 'system':
    case 'user':
      return { role: message.role, content: message.content };
    case 'assistant':
      return {
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.toolCalls?.length
          ? message.toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: JSON.stringify(tc.args) },
            }))
          : undefined,
      };
    case 'tool':
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: message.content,
      };
  }
}

function toOpenAiTool(tool: ToolDefinition): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

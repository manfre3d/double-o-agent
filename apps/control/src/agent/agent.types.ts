/**
 * Provider-neutral chat types. The agent loop speaks only these;
 * LlmService translates them to the provider's wire format.
 */

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content?: string; toolCalls?: ToolCallRequest[] }
  | { role: 'tool'; toolCallId: string; content: string };

export interface AssistantTurn {
  text?: string;
  toolCalls: ToolCallRequest[];
}

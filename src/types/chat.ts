import type { AttachmentMeta } from '@/lib/attachments';
import type { ActionView } from '@/lib/agent/actions';

export type { ActionView };

export interface ToolCall {
  id: string;
  name: string;
  input: any;
  result: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  actions?: ActionView[];
  attachments?: AttachmentMeta[];
}

export type StreamEvent =
  | { type: 'start'; conversationId: string }
  | { type: 'text-delta'; text: string }
  | { type: 'tool-start'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool-result'; id: string; name: string; result: string }
  | { type: 'action-proposed'; action: ActionView }
  | { type: 'notice'; message: string }
  | { type: 'done'; conversationId?: string }
  | { type: 'error'; message: string; code?: string };

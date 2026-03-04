import type { AttachmentMeta } from '@/lib/attachments';

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
  attachments?: AttachmentMeta[];
}

export type StreamEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'tool-start'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool-result'; id: string; name: string; result: string }
  | { type: 'done'; conversationId?: string }
  | { type: 'error'; message: string };

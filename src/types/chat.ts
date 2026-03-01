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

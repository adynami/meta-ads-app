'use client';

import { ToolCallCard } from './ToolCallCard';

interface ToolCall {
  id: string;
  name: string;
  input: any;
  result: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-2xl ${isUser ? '' : 'space-y-3'}`}>
        {/* Tool calls shown before the assistant text */}
        {!isUser && message.toolCalls?.map((tc) => (
          <ToolCallCard key={tc.id} toolCall={tc} />
        ))}

        {message.content && (
          <div
            className={
              isUser
                ? 'message-user px-5 py-3'
                : 'message-assistant px-5 py-4'
            }
          >
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? '' : 'text-gray-300'}`}>
              {message.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

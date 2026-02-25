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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5'
            : 'space-y-2'
        }`}
      >
        {/* Tool calls shown before the assistant text */}
        {!isUser && message.toolCalls?.map((tc) => (
          <ToolCallCard key={tc.id} toolCall={tc} />
        ))}

        {message.content && (
          <div
            className={
              isUser
                ? ''
                : 'bg-muted/40 rounded-2xl rounded-bl-md px-4 py-2.5'
            }
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

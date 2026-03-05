'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Film } from 'lucide-react';
import type { Message } from '@/types/chat';
import { ToolCallCard } from './ToolCallCard';

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-white mt-3 mb-1">{children}</h3>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-400 hover:underline"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="bg-black/40 rounded-lg p-3 my-2 overflow-x-auto font-mono text-xs">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) return <code className={`${className} font-mono`}>{children}</code>;
    return <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>;
  },
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  hr: () => <hr className="border-white/10 my-3" />,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="prose-chat-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-full sm:max-w-2xl">
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5"
              >
                {att.preview_url && isImageMime(att.media_type) ? (
                  <img
                    src={att.preview_url}
                    alt={att.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <Film className="w-4 h-4 text-purple-400" />
                    <span className="max-w-[120px] truncate">{att.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 mb-2">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        {message.content && (
          <div
            className={
              isUser
                ? 'message-user px-3 py-2 sm:px-5 sm:py-3'
                : 'message-assistant px-3 py-3 sm:px-5 sm:py-4'
            }
          >
            {isUser ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="text-sm leading-relaxed text-gray-300 prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

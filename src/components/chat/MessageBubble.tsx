'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

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

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-3 mb-1">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="bg-black/40 rounded-lg p-3 my-2 overflow-x-auto font-mono text-xs">{children}</pre>
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

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-2xl">
        {message.content && (
          <div
            className={
              isUser
                ? 'message-user px-5 py-3'
                : 'message-assistant px-5 py-4'
            }
          >
            {isUser ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
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

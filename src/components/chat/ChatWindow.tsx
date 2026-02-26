'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Search, TrendingUp, BarChart3, Target } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

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

const suggestions = [
  { icon: Search, text: 'Which campaigns are spending but not converting?' },
  { icon: TrendingUp, text: 'How did my campaigns perform last week?' },
  { icon: BarChart3, text: 'Break down last 30 days by age and gender' },
  { icon: Target, text: 'Build a lookalike audience from my purchasers' },
];

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const sendMessage = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const apiMessages = updated.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.text,
        toolCalls: data.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-8" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full text-center pt-16">
            <div className="mb-8">
              <span className="text-4xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-md mb-8">
              Ask about your campaigns, analyse performance, create ads, or manage your Meta ad account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion.text)}
                  className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-3 text-left"
                >
                  <suggestion.icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="flex justify-start">
              <div className="message-assistant px-5 py-4">
                <div className="loading-dots text-purple-400 text-lg">
                  <span>&#x25CF;</span> <span>&#x25CF;</span> <span>&#x25CF;</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-white/5 bg-[#0d0d1a] p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your Meta ads..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm"
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="gradient-bg p-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-500">
              Adynami reads and writes your live Meta account. Actions execute immediately.
            </p>
            <p className="text-xs text-gray-600 hidden sm:block">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

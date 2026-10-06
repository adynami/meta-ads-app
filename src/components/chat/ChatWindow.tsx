'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Square,
  Search,
  TrendingUp,
  BarChart3,
  Target,
  Paperclip,
  X,
  Film,
  Plus,
} from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { MessageBubble } from './MessageBubble';
import { PlaybookMenu } from './PlaybookMenu';
import type { AttachmentMeta, AttachmentRef } from '@/lib/attachments';
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_INLINE_SIZE,
  MAX_VIDEO_SIZE,
  isImageType,
} from '@/lib/attachments';
import type { ActionView, Message, StreamEvent, ToolCall } from '@/types/chat';

export type { Message };

/** Client-side attachment awaiting send */
interface ClientAttachment {
  id: string;
  file: File;
  name: string;
  media_type: string;
  size: number;
  preview_url?: string;
}

interface UploadConfig {
  enabled: boolean;
  prefix: string;
}

let uploadConfigPromise: Promise<UploadConfig> | null = null;
function getUploadConfig(): Promise<UploadConfig> {
  uploadConfigPromise ??= fetch('/api/attachments/upload')
    .then((r) => (r.ok ? r.json() : { enabled: false, prefix: '' }))
    .catch(() => ({ enabled: false, prefix: '' }));
  return uploadConfigPromise;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Production: upload straight to Vercel Blob so file bytes never hit our
 * serverless request-size limit. Local dev without BLOB_READ_WRITE_TOKEN:
 * small images go inline.
 */
async function toAttachmentRef(att: ClientAttachment): Promise<AttachmentRef> {
  const cfg = await getUploadConfig();
  if (cfg.enabled) {
    const blob = await upload(`${cfg.prefix}${att.name}`, att.file, {
      access: 'public',
      handleUploadUrl: '/api/attachments/upload',
      multipart: att.size > 20 * 1024 * 1024,
    });
    return { name: att.name, media_type: att.media_type, size: att.size, url: blob.url };
  }
  if (!isImageType(att.media_type) || att.size > MAX_INLINE_SIZE) {
    throw new Error(
      `${att.name}: file storage isn't configured, so only images under 3 MB can be attached.`,
    );
  }
  return {
    name: att.name,
    media_type: att.media_type,
    size: att.size,
    base64: await readAsBase64(att.file),
  };
}

/** Patch an action's latest state into every message that shows it. */
function mergeAction(messages: Message[], updated: ActionView): Message[] {
  return messages.map((m) =>
    m.actions?.some((a) => a.id === updated.id)
      ? { ...m, actions: m.actions.map((a) => (a.id === updated.id ? updated : a)) }
      : m,
  );
}

function restoreMessages(raw: any[] | undefined): Message[] {
  return (raw ?? []).map((m: any) => ({
    role: m.role,
    content: m.content,
    toolCalls: m.toolCalls,
    actions: m.actions,
    attachments: m.attachments,
  }));
}

/** Stored messages carry each action's state at proposal time; refresh it. */
async function refreshActions(conversationId: string, messages: Message[]): Promise<Message[]> {
  if (!messages.some((m) => m.actions?.length)) return messages;
  try {
    const res = await fetch(`/api/actions?conversationId=${encodeURIComponent(conversationId)}`);
    if (!res.ok) return messages;
    const { actions } = (await res.json()) as { actions: ActionView[] };
    return actions.reduce(mergeAction, messages);
  } catch {
    return messages;
  }
}

const suggestions = [
  { icon: Search, text: 'Which campaigns are spending but not converting?' },
  { icon: TrendingUp, text: 'How did my campaigns perform last week?' },
  { icon: BarChart3, text: 'Break down last 30 days by age and gender' },
  { icon: Target, text: 'Build a lookalike audience from my purchasers' },
];

interface ChatWindowProps {
  accountId: string | null;
  conversationId: string | null;
  onConversationId: (id: string) => void;
  loadRecent: boolean;
  onNewChat?: () => void;
  initialPrompt?: string | null;
}

export function ChatWindow({
  accountId,
  conversationId,
  onConversationId,
  loadRecent,
  onNewChat,
  initialPrompt,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(loadRecent);
  const [attachments, setAttachments] = useState<ClientAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Track the id locally too: the server assigns it at the start of the first turn.
  const conversationIdRef = useRef<string | null>(conversationId);

  const setConversation = useCallback(
    (id: string) => {
      conversationIdRef.current = id;
      onConversationId(id);
    },
    [onConversationId],
  );

  // Load conversation on mount: by ID if provided, or most recent if loadRecent
  useEffect(() => {
    if (conversationId) {
      setIsLoadingHistory(true);
      fetch(`/api/conversations?id=${encodeURIComponent(conversationId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(async (data) => {
          const conv = data?.conversation;
          if (!conv) return;
          const restored = await refreshActions(conv.id, restoreMessages(conv.messages));
          if (restored.length > 0) setMessages(restored);
        })
        .catch(() => {})
        .finally(() => setIsLoadingHistory(false));
      return;
    }

    if (!loadRecent || !accountId) {
      setIsLoadingHistory(false);
      return;
    }

    fetch(`/api/conversations?accountId=${encodeURIComponent(accountId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        const conv = data?.conversations?.[0];
        if (!conv) return;
        const restored = await refreshActions(conv.id, restoreMessages(conv.messages));
        if (restored.length > 0) {
          setMessages(restored);
          setConversation(conv.id);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- runs once on mount

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-send initial prompt from onboarding (e.g., /chat?prompt=...)
  const initialPromptSent = useRef(false);
  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current && !isLoadingHistory) {
      initialPromptSent.current = true;
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, isLoadingHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  const processFiles = useCallback((files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) continue;
      const maxSize = isImageType(file.type) ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (file.size > maxSize) continue;
      setAttachments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          media_type: file.type,
          size: file.size,
          preview_url: isImageType(file.type) ? URL.createObjectURL(file) : undefined,
        },
      ]);
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.preview_url) URL.revokeObjectURL(removed.preview_url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const stopChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const patchLastAssistant = (patch: Partial<Message>) =>
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, ...patch };
      return updated;
    });

  const sendMessage = async (text?: string) => {
    const trimmed = (text || input).trim();
    if ((!trimmed && attachments.length === 0) || isLoading) return;

    const attachmentMetas: AttachmentMeta[] = attachments.map((a) => ({
      id: a.id,
      name: a.name,
      media_type: a.media_type,
      preview_url: a.preview_url,
    }));
    const pending = attachments;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: trimmed,
        attachments: attachmentMetas.length > 0 ? attachmentMetas : undefined,
      },
    ]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const attachmentRefs = await Promise.all(pending.map(toAttachmentRef));

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          accountId,
          conversationId: conversationIdRef.current,
          stream: true,
          attachments: attachmentRefs.length > 0 ? attachmentRefs : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === 'RATE_LIMITED' && err.canTopUp) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `You've used all your credits this month. [Buy a credit pack](/billing) to keep going, or upgrade your plan.`,
            },
          ]);
          return;
        }
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      const toolCalls: ToolCall[] = [];
      const actions: ActionView[] = [];

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';

        for (const frame of frames) {
          if (!frame.startsWith('data: ')) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(frame.slice(6));
          } catch {
            continue;
          }

          switch (event.type) {
            case 'start':
              setConversation(event.conversationId);
              break;

            case 'text-delta':
              accumulatedText += event.text;
              patchLastAssistant({ content: accumulatedText.trimEnd() });
              break;

            case 'notice':
              accumulatedText += `\n\n_${event.message}_`;
              patchLastAssistant({ content: accumulatedText.trimEnd() });
              break;

            case 'tool-start':
              toolCalls.push({ id: event.id, name: event.name, input: event.input, result: '...' });
              patchLastAssistant({ toolCalls: [...toolCalls] });
              break;

            case 'tool-result': {
              const tc = toolCalls.find((t) => t.id === event.id);
              if (tc) tc.result = event.result;
              patchLastAssistant({ toolCalls: [...toolCalls] });
              break;
            }

            case 'action-proposed':
              actions.push(event.action);
              patchLastAssistant({ actions: [...actions] });
              break;

            case 'done':
              if (event.conversationId) setConversation(event.conversationId);
              break;

            case 'error':
              throw new Error(event.message);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return; // user cancelled — no error message
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      abortRef.current = null;
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
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  return (
    <div className="flex flex-col h-full">
      {/* New Chat header bar */}
      {messages.length > 0 && onNewChat && (
        <div className="flex items-center justify-end px-3 sm:px-6 py-2 border-b border-white/5 shrink-0">
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-3 sm:px-6 py-6 sm:py-8"
        ref={scrollRef}
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="loading-dots text-purple-400 text-lg">
              <span>&#x25CF;</span> <span>&#x25CF;</span> <span>&#x25CF;</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full text-center pt-8 sm:pt-16 px-2">
            <div className="mb-8">
              <span className="text-3xl sm:text-4xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-md mb-8">
              Ask about your campaigns, analyse performance, create ads, or manage your Meta ad
              account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion.text)}
                  className="glass-card glass-card-hover rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left"
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
              <MessageBubble
                key={i}
                message={msg}
                busy={isLoading}
                onActionChange={(a) => setMessages((prev) => mergeAction(prev, a))}
              />
            ))}
          </div>
        )}

        {isLoading &&
          (messages.length === 0 ||
            messages[messages.length - 1]?.role !== 'assistant' ||
            !messages[messages.length - 1]?.content) && (
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
      <div className="border-t border-white/5 bg-[#0d0d1a] p-2 sm:p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div
            className={`flex flex-col gap-2 bg-white/5 border rounded-xl p-2 sm:p-3 transition-colors ${
              isDragOver ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Attachment preview strip */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300"
                  >
                    {att.preview_url ? (
                      <img
                        src={att.preview_url}
                        alt={att.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <Film className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="max-w-[100px] truncate">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="ml-1 text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processFiles(e.target.files);
                  e.target.value = ''; // reset so same file can be re-selected
                }}
              />

              <PlaybookMenu disabled={isLoading} onRun={(prompt) => sendMessage(prompt)} />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50 p-1"
                title="Attach image or video"
              >
                <Paperclip className="w-5 h-5" />
              </button>

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
              {isLoading ? (
                <button
                  onClick={stopChat}
                  className="bg-red-500/80 hover:bg-red-500 p-2 rounded-lg transition-colors"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() && attachments.length === 0}
                  className="gradient-bg p-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] sm:text-xs text-gray-500">
              Adynami reads your live Meta account. Changes run only after you approve them.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

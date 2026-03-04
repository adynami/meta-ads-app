'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string | null;
  adAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  accountId: string | null;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  refreshKey: number;
}

function relativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ConversationList({
  accountId,
  activeConversationId,
  onSelect,
  refreshKey,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/conversations')
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((data) => {
        setConversations(data.conversations || []);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered =
    !accountId || accountId === 'all'
      ? conversations
      : conversations.filter((c) => c.adAccountId === accountId || c.adAccountId === null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // ignore
    }
  };

  if (loading) return null;

  return (
    <div className="p-4 border-b border-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-3">
        Conversations
      </p>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No conversations yet</p>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg transition-all cursor-pointer ${
                activeConversationId === conv.id
                  ? 'bg-white/5 border-l-2 border-purple-500'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-gray-300">{conv.title || 'New conversation'}</p>
                <p className="text-[10px] text-gray-600">{relativeDate(conv.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                title="Delete conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

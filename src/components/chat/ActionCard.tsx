'use client';

import { useState } from 'react';
import { Check, X, Undo2, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';
import type { ActionView } from '@/types/chat';

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: 'Needs approval', className: 'text-amber-300' },
  executing: { text: 'Running…', className: 'text-purple-300' },
  executed: { text: 'Done', className: 'text-green-400' },
  failed: { text: 'Failed', className: 'text-red-400' },
  rejected: { text: 'Rejected', className: 'text-gray-400' },
  expired: { text: 'Expired', className: 'text-gray-500' },
  rolling_back: { text: 'Undoing…', className: 'text-purple-300' },
  rolled_back: { text: 'Undone', className: 'text-gray-400' },
};

interface ActionCardProps {
  action: ActionView;
  /** Approvals are blocked while a reply is streaming (keeps history append-only). */
  disabled?: boolean;
  onChange: (action: ActionView) => void;
}

export function ActionCard({ action, disabled, onChange }: ActionCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const decide = async (decision: 'approve' | 'reject' | 'undo') => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onChange(data.action);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const status = STATUS_LABEL[action.status] ?? { text: action.status, className: 'text-gray-400' };
  const isPending = action.status === 'pending';
  const canUndo = action.status === 'executed' && action.reversible;

  return (
    <div
      className={`tool-card px-3 py-2 sm:px-4 sm:py-3 ${isPending ? 'border-amber-400/40 bg-amber-400/5' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-start gap-2 text-left text-sm min-w-0"
        >
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
          <span className="min-w-0">
            <span className="font-medium break-words">{action.summary}</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              {action.metaAdAccountId}
              {!action.reversible &&
                action.status === 'pending' &&
                ' · cannot be undone automatically'}
            </span>
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          )}
        </button>
        <span className={`text-xs font-medium shrink-0 ${status.className}`}>{status.text}</span>
      </div>

      {expanded && (
        <pre className="mono mt-3 bg-black/30 rounded-lg p-3 overflow-x-auto max-h-60 border border-white/5 text-xs text-gray-300">
          {JSON.stringify(action.input, null, 2)}
          {action.error ? `\n\nError: ${action.error}` : ''}
          {action.result ? `\n\nResult: ${JSON.stringify(action.result, null, 2)}` : ''}
        </pre>
      )}

      {(isPending || canUndo) && (
        <div className="flex items-center gap-2 mt-3">
          {isPending && (
            <>
              <button
                onClick={() => decide('approve')}
                disabled={busy || disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/80 hover:bg-green-500 text-white disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => decide('reject')}
                disabled={busy || disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-gray-200 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          {canUndo && (
            <button
              onClick={() => decide('undo')}
              disabled={busy || disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-gray-200 disabled:opacity-50"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
          )}
          {disabled && isPending && (
            <span className="text-[11px] text-gray-500">Wait for the reply to finish</span>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}

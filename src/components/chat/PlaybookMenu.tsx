'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import type { Playbook } from '@/lib/playbooks';

interface PlaybookMenuProps {
  disabled?: boolean;
  onRun: (prompt: string) => void;
}

/** Saved prompt workflows: built-ins plus the user's own, run in one click. */
export function PlaybookMenu({ disabled, onRun }: PlaybookMenuProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Playbook[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || items) return;
    fetch('/api/playbooks')
      .then((r) => (r.ok ? r.json() : { playbooks: [] }))
      .then((d) => setItems(d.playbooks))
      .catch(() => setItems([]));
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const save = async () => {
    setError(null);
    const res = await fetch('/api/playbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prompt }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not save');
      return;
    }
    setItems((prev) => [...(prev ?? []), data.playbook]);
    setCreating(false);
    setName('');
    setPrompt('');
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/playbooks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50 p-1"
        title="Playbooks"
      >
        <BookOpen className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-[min(22rem,calc(100vw-2rem))] max-h-96 overflow-y-auto bg-[#14142a] border border-white/10 rounded-xl shadow-xl p-2 z-20">
          <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-gray-500">Playbooks</p>
          {items === null && <p className="px-2 py-2 text-xs text-gray-500">Loading…</p>}
          {items?.map((p) => (
            <div key={p.id} className="group flex items-start gap-1 rounded-lg hover:bg-white/5">
              <button
                onClick={() => {
                  setOpen(false);
                  onRun(p.prompt);
                }}
                className="flex-1 text-left px-2 py-2 min-w-0"
              >
                <span className="block text-sm text-gray-200">{p.name}</span>
                <span className="block text-xs text-gray-500 truncate">{p.prompt}</span>
              </button>
              {!p.builtIn && (
                <button
                  onClick={() => remove(p.id)}
                  className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  title="Delete playbook"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {creating ? (
            <div className="p-2 space-y-2 border-t border-white/5 mt-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
              />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should Adynami do?"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none resize-none"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={!name.trim() || !prompt.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium gradient-bg disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-1.5 px-2 py-2 mt-1 border-t border-white/5 text-xs text-gray-400 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" /> New playbook
            </button>
          )}
        </div>
      )}
    </div>
  );
}

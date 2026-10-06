'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface AlertsState {
  enabled: boolean;
  hasWebhook: boolean;
  lastRunAt: string | null;
}

/** Daily anomaly alerts to a Slack incoming webhook. */
export function AlertsSettings() {
  const [state, setState] = useState<AlertsState | null>(null);
  const [webhook, setWebhook] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setState(d))
      .catch(() => {});
  }, []);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save');
      const fresh = await fetch('/api/alerts').then((r) => r.json());
      setState(fresh);
      setWebhook('');
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!state) return null;

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold mb-2">Daily Alerts</h2>
      <p className="text-sm text-gray-400 mb-6">
        Every morning Adynami compares each campaign&apos;s last day with its 7-day average and
        posts spend spikes, CPA jumps, CTR drops and stalled delivery to Slack. Uses no credits.
      </p>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={state.enabled}
            disabled={saving || (!state.hasWebhook && !webhook)}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          Send daily alerts
        </label>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Slack incoming webhook URL{' '}
            {state.hasWebhook && <span className="text-green-400">(saved)</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              placeholder={
                state.hasWebhook
                  ? 'Enter a new URL to replace'
                  : 'https://hooks.slack.com/services/…'
              }
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            />
            <button
              onClick={() => patch({ slackWebhookUrl: webhook, enabled: true })}
              disabled={saving || !webhook}
              className="gradient-bg px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {state.hasWebhook && (
            <button
              onClick={() => patch({ slackWebhookUrl: null })}
              disabled={saving}
              className="text-xs text-gray-500 hover:text-red-400 mt-2"
            >
              Remove webhook
            </button>
          )}
        </div>

        {state.lastRunAt && (
          <p className="text-xs text-gray-500">
            Last checked {new Date(state.lastRunAt).toLocaleString()}
          </p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {saved && (
          <p className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ToolCall } from '@/types/chat';

const TOOL_ICONS: Record<string, string> = {
  campaign: '\u{1F4E2}',
  ad_set: '\u{1F3AF}',
  ad: '\u{1F4F0}',
  audience: '\u{1F465}',
  insight: '\u{1F4CA}',
  creative: '\u{1F3A8}',
  pixel: '\u{1F4E1}',
  conversion: '\u{1F4B0}',
  library: '\u{1F50D}',
  budget: '\u{1F4B5}',
  rule: '\u{2699}',
  default: '\u{1F527}',
};

function getToolIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (key !== 'default' && lower.includes(key)) return icon;
  }
  return TOOL_ICONS.default;
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  let parsedResult: any;
  try {
    parsedResult = JSON.parse(toolCall.result);
  } catch {
    parsedResult = toolCall.result;
  }

  const isError = parsedResult?.error;
  const displayName = toolCall.name.replace('meta_', '').replaceAll('_', ' ');
  const icon = getToolIcon(toolCall.name);

  return (
    <div className={`tool-card ${isError ? 'border-red-500/30 bg-red-500/5' : ''} px-4 py-3`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-sm">
          <span>{icon}</span>
          <span className="font-medium">
            {expanded ? '' : 'Running: '}
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isError ? (
            <span className="text-red-400 text-xs font-medium">Error</span>
          ) : (
            <span className="text-green-400 text-sm">&#x2713;</span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {!expanded && <p className="text-xs text-gray-400 mt-1 ml-6">{summarize(parsedResult)}</p>}

      {expanded && (
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <span className="font-medium text-gray-400 block mb-1">Input:</span>
            <pre className="mono bg-black/30 rounded-lg p-3 overflow-x-auto max-h-40 border border-white/5 text-gray-300">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-1">Result:</span>
            <pre
              className={`mono bg-black/30 rounded-lg p-3 overflow-x-auto max-h-60 border border-white/5 ${isError ? 'text-red-400' : 'text-gray-300'}`}
            >
              {typeof parsedResult === 'string'
                ? parsedResult
                : JSON.stringify(parsedResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function summarize(result: any): string {
  if (!result || typeof result !== 'object') return 'Completed';
  if (result.error) return result.error;
  if (result.data && Array.isArray(result.data)) {
    return `${result.data.length} result${result.data.length === 1 ? '' : 's'}`;
  }
  if (result.campaigns) return `${result.campaigns.length} campaigns`;
  if (result.adsets) return `${result.adsets.length} ad sets`;
  if (result.ads) return `${result.ads.length} ads`;
  if (result.id) return `id: ${result.id}`;
  if (result.success !== undefined) return result.success ? 'Success' : 'Failed';
  return 'Completed';
}

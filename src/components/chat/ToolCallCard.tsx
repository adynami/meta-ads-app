'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ToolCall {
  id: string;
  name: string;
  input: any;
  result: string;
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

  return (
    <div className="border rounded-lg overflow-hidden text-sm my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <span className="text-muted-foreground">{expanded ? '▼' : '▶'}</span>
        <Badge variant={isError ? 'destructive' : 'secondary'} className="text-xs">
          {displayName}
        </Badge>
        {!expanded && !isError && (
          <span className="text-muted-foreground truncate text-xs">
            {summarize(parsedResult)}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2 space-y-2 text-xs">
          <div>
            <span className="font-medium text-muted-foreground">Input:</span>
            <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto max-h-40">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Result:</span>
            <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto max-h-60">
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
  if (!result || typeof result !== 'object') return '';
  if (result.data && Array.isArray(result.data)) {
    return `${result.data.length} result${result.data.length === 1 ? '' : 's'}`;
  }
  if (result.campaigns) return `${result.campaigns.length} campaigns`;
  if (result.adsets) return `${result.adsets.length} ad sets`;
  if (result.ads) return `${result.ads.length} ads`;
  if (result.id) return `id: ${result.id}`;
  if (result.success !== undefined) return result.success ? 'success' : 'failed';
  return '';
}

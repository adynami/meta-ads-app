'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardRow {
  name: string;
  id: string | null;
  status: string | null;
  objective: string | null;
  daily_budget: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  cpa: number;
  roas: number;
}

type Level = 'campaign' | 'adset' | 'ad';
type SortDir = 'asc' | 'desc';

interface Column {
  key: keyof DashboardRow;
  label: string;
  align: 'left' | 'right';
  levels: Level[];
  format: (v: any) => string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  PAUSED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ARCHIVED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function formatInt(v: any): string {
  const n = Number(v);
  if (!n && n !== 0) return '—';
  return n.toLocaleString();
}

function formatCurrency(v: any): string {
  const n = Number(v);
  if (!n && n !== 0) return '—';
  return `$${n.toFixed(2)}`;
}

function formatPct(v: any): string {
  const n = Number(v);
  if (!n && n !== 0) return '—';
  return `${n.toFixed(2)}%`;
}

function formatRatio(v: any): string {
  const n = Number(v);
  if (!n && n !== 0) return '—';
  return n.toFixed(2);
}

function formatBudget(v: any): string {
  if (!v) return '—';
  const n = Number(v) / 100; // Meta returns budget in cents
  return `$${n.toFixed(2)}`;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name', align: 'left', levels: ['campaign', 'adset', 'ad'], format: (v) => v ?? '—' },
  { key: 'status', label: 'Status', align: 'left', levels: ['campaign', 'adset', 'ad'], format: (v) => v ?? '—' },
  { key: 'objective', label: 'Objective', align: 'left', levels: ['campaign'], format: (v) => v ?? '—' },
  { key: 'daily_budget', label: 'Daily Budget', align: 'right', levels: ['campaign', 'adset'], format: formatBudget },
  { key: 'spend', label: 'Spend', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatCurrency },
  { key: 'impressions', label: 'Impr.', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatInt },
  { key: 'clicks', label: 'Clicks', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatInt },
  { key: 'ctr', label: 'CTR', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatPct },
  { key: 'cpc', label: 'CPC', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatCurrency },
  { key: 'conversions', label: 'Conv.', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatInt },
  { key: 'cpa', label: 'CPA', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatCurrency },
  { key: 'roas', label: 'ROAS', align: 'right', levels: ['campaign', 'adset', 'ad'], format: formatRatio },
];

interface DashboardTableProps {
  rows: DashboardRow[];
  level: Level;
  isLoading: boolean;
  sortBy: keyof DashboardRow | null;
  sortDir: SortDir;
  onSort: (key: keyof DashboardRow) => void;
}

export function DashboardTable({
  rows,
  level,
  isLoading,
  sortBy,
  sortDir,
  onSort,
}: DashboardTableProps) {
  const visibleColumns = COLUMNS.filter((c) => c.levels.includes(level));

  if (isLoading) {
    return (
      <table className="prose-chat-table w-full">
        <thead>
          <tr>
            {visibleColumns.map((col) => (
              <th key={col.key} className={cn(col.align === 'right' && 'text-right')}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              {visibleColumns.map((col) => (
                <td key={col.key}>
                  <div className="h-4 rounded animate-pulse bg-white/5" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No data for the selected period
      </div>
    );
  }

  return (
    <table className="prose-chat-table w-full">
      <thead>
        <tr>
          {visibleColumns.map((col) => (
            <th
              key={col.key}
              className={cn(
                'cursor-pointer select-none hover:bg-white/5 transition-colors',
                col.align === 'right' && 'text-right',
              )}
              onClick={() => onSort(col.key)}
            >
              <span className="inline-flex items-center gap-1">
                {col.label}
                {sortBy === col.key && (
                  sortDir === 'asc'
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                )}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id ?? i}>
            {visibleColumns.map((col) => (
              <td
                key={col.key}
                className={cn(col.align === 'right' && 'text-right')}
              >
                {col.key === 'status' && row.status ? (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      STATUS_COLORS[row.status] ?? STATUS_COLORS.ARCHIVED,
                    )}
                  >
                    {row.status}
                  </span>
                ) : col.key === 'name' ? (
                  <span className="font-medium">{row.name}</span>
                ) : (
                  col.format(row[col.key])
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

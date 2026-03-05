'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardToolbar } from './DashboardToolbar';
import { DashboardTable, type DashboardRow, COLUMNS, colId } from './DashboardTable';
import type { Level, TimeRange, SortDir } from '@/types/dashboard';

interface DashboardPanelProps {
  accountId: string;
}

export function DashboardPanel({ accountId }: DashboardPanelProps) {
  const [level, setLevel] = useState<Level>('campaign');
  const [timeRange, setTimeRange] = useState<TimeRange>('last_7d');
  const [since, setSince] = useState<string | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('spend');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = { accountId, level, timeRange };
      if (timeRange === 'custom' && since && until) {
        payload.since = since;
        payload.until = until;
      }

      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard data');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, level, timeRange, since, until]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const handleCustomRange = (newSince: string, newUntil: string) => {
    setTimeRange('custom');
    setSince(newSince);
    setUntil(newUntil);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    if (range !== 'custom') {
      setSince(null);
      setUntil(null);
    }
  };

  // Client-side sort
  const sortedRows = [...rows].sort((a, b) => {
    if (!sortBy) return 0;

    // Find the column definition for this sortBy key
    const col = COLUMNS.find((c) => colId(c) === sortBy);

    let aVal: any;
    let bVal: any;

    if (col?.subKey) {
      // Sort by conversion breakdown subKey
      aVal = a.conversion_breakdown?.[col.subKey] ?? 0;
      bVal = b.conversion_breakdown?.[col.subKey] ?? 0;
    } else {
      const rowKey = sortBy as keyof DashboardRow;
      aVal = a[rowKey];
      bVal = b[rowKey];
    }

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let cmp: number;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar
        level={level}
        timeRange={timeRange}
        onLevelChange={setLevel}
        onTimeRangeChange={handleTimeRangeChange}
        onCustomRange={handleCustomRange}
        onRefresh={fetchData}
        isLoading={isLoading}
      />
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-4">
        <div className="overflow-x-auto px-3 sm:px-6">
          {error ? (
            <div className="flex items-center justify-center h-64 text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <DashboardTable
              rows={sortedRows}
              level={level}
              isLoading={isLoading}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardToolbar } from './DashboardToolbar';
import { DashboardTable, type DashboardRow } from './DashboardTable';

type Level = 'campaign' | 'adset' | 'ad';
type TimeRange = 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month';
type SortDir = 'asc' | 'desc';

interface DashboardPanelProps {
  accountId: string;
}

export function DashboardPanel({ accountId }: DashboardPanelProps) {
  const [level, setLevel] = useState<Level>('campaign');
  const [timeRange, setTimeRange] = useState<TimeRange>('last_7d');
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof DashboardRow | null>('spend');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, level, timeRange }),
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
  }, [accountId, level, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: keyof DashboardRow) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  // Client-side sort
  const sortedRows = [...rows].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = a[sortBy];
    const bVal = b[sortBy];
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
        onTimeRangeChange={setTimeRange}
        onRefresh={fetchData}
        isLoading={isLoading}
      />
      <div className="flex-1 overflow-auto scrollbar-thin px-6 py-4">
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
  );
}

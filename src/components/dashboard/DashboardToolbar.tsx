'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Level = 'campaign' | 'adset' | 'ad';
type TimeRange = 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  last_7d: 'Last 7 days',
  last_14d: 'Last 14 days',
  last_30d: 'Last 30 days',
  last_90d: 'Last 90 days',
  this_month: 'This month',
  last_month: 'Last month',
};

interface DashboardToolbarProps {
  level: Level;
  timeRange: TimeRange;
  onLevelChange: (level: Level) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function DashboardToolbar({
  level,
  timeRange,
  onLevelChange,
  onTimeRangeChange,
  onRefresh,
  isLoading,
}: DashboardToolbarProps) {
  const [timeOpen, setTimeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTimeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const levels: { key: Level; label: string }[] = [
    { key: 'campaign', label: 'Campaign' },
    { key: 'adset', label: 'Ad Set' },
    { key: 'ad', label: 'Ad' },
  ];

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
      <div className="flex items-center gap-4">
        {/* Level selector */}
        <div className="flex items-center bg-white/5 rounded-lg p-1">
          {levels.map((l) => (
            <button
              key={l.key}
              onClick={() => onLevelChange(l.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                level === l.key
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Time range dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setTimeOpen(!timeOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            {TIME_RANGE_LABELS[timeRange]}
            <ChevronDown className="w-4 h-4" />
          </button>

          {timeOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 glass-card rounded-lg py-1 min-w-[160px]">
              {(Object.entries(TIME_RANGE_LABELS) as [TimeRange, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onTimeRangeChange(key);
                      setTimeOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      timeRange === key
                        ? 'text-white bg-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
      </button>
    </div>
  );
}

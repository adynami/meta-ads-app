'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Column } from '@/components/dashboard/DashboardTable';
import { colId } from '@/components/dashboard/DashboardTable';

function storageKey(level: string): string {
  return `dashboard-col-order-${level}`;
}

function readOrder(level: string): string[] | null {
  try {
    const raw = localStorage.getItem(storageKey(level));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeOrder(level: string, order: string[]): void {
  try {
    localStorage.setItem(storageKey(level), JSON.stringify(order));
  } catch {
    // quota or SSR — ignore
  }
}

/** Merge stored order with current visible columns: prune removed, append new. */
function reconcile(stored: string[], visible: Column[]): string[] {
  const visibleIds = new Set(visible.map(colId));
  const ordered = stored.filter((id) => visibleIds.has(id));
  const seen = new Set(ordered);
  for (const col of visible) {
    const id = colId(col);
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

export function useColumnOrder(level: string, visibleColumns: Column[]) {
  const visibleIds = useMemo(() => visibleColumns.map(colId), [visibleColumns]);

  const [order, setOrder] = useState<string[]>(() => {
    const stored = readOrder(level);
    return stored ? reconcile(stored, visibleColumns) : visibleIds;
  });

  // Re-reconcile when level or visible columns change
  const orderedColumns = useMemo(() => {
    const currentOrder = readOrder(level)
      ? reconcile(readOrder(level)!, visibleColumns)
      : visibleIds;

    // Build a lookup map for O(1) access
    const colMap = new Map(visibleColumns.map((c) => [colId(c), c]));
    return currentOrder.map((id) => colMap.get(id)).filter(Boolean) as Column[];
  }, [level, visibleColumns, visibleIds, order]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveColumn = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      setOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(fromId);
        const toIdx = next.indexOf(toId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, fromId);
        writeOrder(level, next);
        return next;
      });
    },
    [level],
  );

  return { orderedColumns, moveColumn };
}

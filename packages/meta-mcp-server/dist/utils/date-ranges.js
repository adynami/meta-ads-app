function fmt(d) {
    return d.toISOString().split('T')[0];
}
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}
export function resolveRange(key) {
    const today = new Date();
    switch (key) {
        case 'today':
            return { since: fmt(today), until: fmt(today) };
        case 'yesterday': {
            const y = daysAgo(1);
            return { since: fmt(y), until: fmt(y) };
        }
        case 'last_3d':
            return { since: fmt(daysAgo(3)), until: fmt(daysAgo(1)) };
        case 'last_7d':
            return { since: fmt(daysAgo(7)), until: fmt(daysAgo(1)) };
        case 'last_14d':
            return { since: fmt(daysAgo(14)), until: fmt(daysAgo(1)) };
        case 'last_30d':
            return { since: fmt(daysAgo(30)), until: fmt(daysAgo(1)) };
        case 'last_90d':
            return { since: fmt(daysAgo(90)), until: fmt(daysAgo(1)) };
        case 'this_month': {
            const first = new Date(today.getFullYear(), today.getMonth(), 1);
            return { since: fmt(first), until: fmt(today) };
        }
        case 'last_month': {
            const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const last = new Date(today.getFullYear(), today.getMonth(), 0);
            return { since: fmt(first), until: fmt(last) };
        }
        case 'custom':
            throw new Error('resolveRange: "custom" requires explicit since/until — handle before calling resolveRange');
    }
}
export function resolvePreviousPeriod(key) {
    const current = resolveRange(key);
    const sinceDate = new Date(current.since);
    const untilDate = new Date(current.until);
    const days = Math.round((untilDate.getTime() - sinceDate.getTime()) / 86400000) + 1;
    const prevUntil = new Date(sinceDate);
    prevUntil.setDate(prevUntil.getDate() - 1);
    const prevSince = new Date(prevUntil);
    prevSince.setDate(prevSince.getDate() - days + 1);
    return { since: fmt(prevSince), until: fmt(prevUntil) };
}
//# sourceMappingURL=date-ranges.js.map
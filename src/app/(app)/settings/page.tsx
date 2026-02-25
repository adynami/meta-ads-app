'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AdAccount {
  id: string;
  metaAdAccountId: string;
  metaAccountName: string | null;
  isActive: boolean;
  tokenExpiresAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } finally {
      setLoading(false);
    }
  }

  async function disconnectAccount(id: string) {
    if (!confirm('Disconnect this ad account?')) return;
    await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Connected Ad Accounts</h2>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : accounts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No ad accounts connected yet. Connect your Meta ad account to get
              started.
            </p>
            <Button>Connect Meta Account</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const expiresAt = account.tokenExpiresAt
                ? new Date(account.tokenExpiresAt)
                : null;
              const isExpiring =
                expiresAt && expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

              return (
                <Card key={account.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {account.metaAccountName ?? account.metaAdAccountId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {account.metaAdAccountId}
                    </p>
                    {isExpiring && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        Token expires soon
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
                  >
                    Disconnect
                  </Button>
                </Card>
              );
            })}

            <Separator className="my-4" />
            <Button variant="outline">Connect Another Account</Button>
          </div>
        )}
      </section>
    </div>
  );
}

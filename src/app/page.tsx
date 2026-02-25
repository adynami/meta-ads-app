import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight">Meta Ads AI</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          AI-powered Meta advertising assistant. Manage campaigns, analyse
          performance, and create ads through natural conversation.
        </p>
        <Link
          href="/chat"
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Open Chat
        </Link>
      </main>
    </div>
  );
}

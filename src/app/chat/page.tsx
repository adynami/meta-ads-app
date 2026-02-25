import { ChatWindow } from '@/components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Meta Ads AI</h1>
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto h-full">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}

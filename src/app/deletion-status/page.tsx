import Link from 'next/link';

export const metadata = {
  title: 'Data Deletion Status - Adynami',
  description: 'Status of your data deletion request.',
};

export default async function DeletionStatus({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="min-h-screen bg-[#08080f] text-white flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Data Deletion Request</h1>
        {code ? (
          <>
            <p className="text-gray-400 mb-4">Your data deletion request has been processed.</p>
            <div className="glass-card rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-400 mb-2">Confirmation code:</p>
              <p className="text-white font-mono text-sm break-all">{code}</p>
            </div>
            <p className="text-gray-500 text-sm">
              All data associated with your account has been permanently deleted from our systems,
              including your profile, connected ad accounts, conversation history, and usage
              records.
            </p>
          </>
        ) : (
          <p className="text-gray-400">No deletion request code provided.</p>
        )}
        <div className="mt-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm underline">
            Return to Adynami
          </Link>
        </div>
      </div>
    </div>
  );
}

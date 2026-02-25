import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <h1 className="text-3xl font-bold">Meta Ads AI</h1>
        <p className="text-muted-foreground">
          Sign in with your Meta account to manage your ad campaigns with AI.
        </p>
        <form
          action={async () => {
            'use server';
            await signIn('facebook', { redirectTo: '/chat' });
          }}
        >
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#1877F2] px-8 text-white font-medium hover:bg-[#166FE5] transition-colors"
          >
            Continue with Meta
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          7-day free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}

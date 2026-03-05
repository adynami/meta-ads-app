import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Guides, use cases, and API reference for managing Meta ads with AI.',
  alternates: { canonical: '/docs' },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

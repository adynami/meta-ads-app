import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Adynami',
  description: 'Adynami terms of service. Rules and conditions for using the platform.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-white">Ady</span>
              <span className="gradient-text">nami</span>
            </span>
            <span className="w-2 h-2 rounded-full gradient-bg pulse-dot"></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</Link>
            <Link href="/#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</Link>
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors text-sm">Docs</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm hidden md:block">
              Login
            </Link>
            <Link href="/register">
              <button className="gradient-bg px-5 py-2.5 rounded-lg font-medium text-sm glow-btn">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="relative pt-32 pb-16">
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400 mb-12">Last updated: February 26, 2026</p>

          <div className="space-y-10 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Adynami (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>
                Adynami is a conversational AI tool that connects to your Meta (Facebook) Ads accounts via the Meta Marketing API. It allows you to manage campaigns, pull reports, build audiences, and perform other advertising operations through natural language commands. The Service reads and writes to your live Meta Ads account based on your instructions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
              <p>To use the Service, you must:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Authenticate via Meta OAuth and grant the required advertising API permissions</li>
                <li>Be at least 18 years old</li>
                <li>Have the authority to manage the Meta Ad accounts you connect</li>
                <li>Provide accurate information</li>
              </ul>
              <p className="mt-2">
                You are responsible for all activity under your account. Keep your login credentials secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription &amp; Billing</h2>
              <p>
                The Service is offered on a subscription basis with a 7-day free trial. By subscribing, you agree to pay the fees associated with your selected plan. Payments are processed through Stripe. You may cancel your subscription at any time through the billing settings; access continues until the end of your current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Use the Service to violate Meta&apos;s Advertising Policies or any applicable laws</li>
                <li>Attempt to gain unauthorized access to the Service, other users&apos; accounts, or our systems</li>
                <li>Use the Service to send spam, misleading ads, or prohibited content</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Resell or redistribute access to the Service without written permission</li>
                <li>Use the Service to process data of individuals under the age of 13</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Meta Platform Compliance</h2>
              <p>
                Your use of the Service is subject to Meta&apos;s{' '}
                <a href="https://developers.facebook.com/terms/" className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">
                  Platform Terms
                </a>{' '}
                and{' '}
                <a href="https://www.facebook.com/policies/ads/" className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">
                  Advertising Policies
                </a>.
                You are responsible for ensuring that your advertising content and practices comply with Meta&apos;s policies. Adynami executes your instructions &mdash; it does not review your ad content for policy compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. AI-Generated Actions</h2>
              <p>
                The Service uses artificial intelligence (powered by Anthropic Claude) to interpret your requests and execute advertising operations. While we strive for accuracy, AI-generated actions may occasionally misinterpret instructions. You are responsible for reviewing the actions taken on your account. We recommend reviewing campaign changes before they go live, especially for large budget allocations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Adynami shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of revenue, loss of profits, or loss of data arising from your use of the Service. This includes losses resulting from:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>AI misinterpretation of commands</li>
                <li>Meta API errors or outages</li>
                <li>Campaign performance outcomes</li>
                <li>Unauthorized access to your account</li>
              </ul>
              <p className="mt-2">
                Our total liability for any claim arising from the Service is limited to the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that it will achieve specific advertising results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Data &amp; Privacy</h2>
              <p>
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>.
                By using the Service, you consent to the collection and processing of data as described therein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Account Termination</h2>
              <p>
                You may delete your account at any time from the Settings page. We may suspend or terminate your account if you violate these Terms, Meta&apos;s policies, or applicable law. Upon termination, your data is permanently deleted as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page. Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the State of Israel, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Contact</h2>
              <p>
                For questions about these Terms, contact us at:
              </p>
              <p className="mt-2 text-white font-medium">
                legal@adynami.com
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
              <span className="text-gray-500 text-sm ml-4">AI-powered Meta ads management.</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-white transition-colors">Terms</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm mt-8">
            &copy; 2026 Adynami
          </div>
        </div>
      </footer>
    </div>
  );
}

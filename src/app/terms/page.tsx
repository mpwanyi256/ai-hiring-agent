import React from 'react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';

const sections = [
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'use-platform', label: 'Use of the Platform' },
  { id: 'user-accounts', label: 'User Accounts' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'pricing-payment', label: 'Pricing & Payment' },
  { id: 'ai-limitations', label: 'AI Limitations' },
  { id: 'cancellation', label: 'Cancellation & Termination' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Navigation />
      <div className="flex flex-1 w-full max-w-7xl mx-auto pt-28 pb-8 px-2 sm:px-4 md:px-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 pr-8">
          <nav className="sticky top-32">
            <h2 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest">
              On this page
            </h2>
            <ul className="space-y-2 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-gray-700 hover:text-primary transition-colors block py-1 px-2 rounded-lg"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <header className="flex-col gap-2 mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
            <p className="text-sm text-gray-500">Effective Date: 15th July, 2025</p>
            <p className="text-sm text-gray-500 pt-4 mx-auto">
              Welcome to Intervio. These Terms of Use (&ldquo;Terms&rdquo;) govern your access to
              and use of our platform and services (&ldquo;Service&rdquo;). By accessing or using
              the Service, you agree to these Terms and our{' '}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              . If you do not agree, please do not use the platform.
            </p>
          </header>

          <section id="eligibility" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">1. Eligibility</h2>
            <p className="mb-6 text-sm leading-relaxed">
              You must be at least 18 years old and legally capable to enter into contracts. You
              agree to provide accurate account details and to keep them up to date.
            </p>
          </section>

          <section id="use-platform" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">2. Use of the Platform</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>Use the Service only for lawful purposes</li>
              <li>Not reverse-engineer, scrape, or misuse any part of the Service</li>
              <li>Use the platform within permitted limits of your subscription plan</li>
              <li>Abide by restrictions on candidate data use and fair hiring practices</li>
            </ul>
          </section>

          <section id="user-accounts" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>You are responsible for all activity under your account</li>
              <li>Do not share your login credentials</li>
              <li>Notify us immediately of any breach or unauthorized access</li>
            </ul>
          </section>

          <section id="intellectual-property" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>All platform IP, code, branding, and AI logic belong to us</li>
              <li>Your company owns your data; we only use it to provide the service</li>
              <li>
                You grant us a limited license to use submitted data for improving functionality
              </li>
            </ul>
          </section>

          <section id="pricing-payment" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">5. Pricing & Payment</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>Subscriptions are billed monthly or annually via Stripe</li>
              <li>Overage charges apply beyond plan limits (see pricing page)</li>
              <li>We may suspend accounts for non-payment or policy violations</li>
            </ul>
          </section>

          <section id="ai-limitations" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">6. AI Limitations</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>AI scoring and suggestions are advisory only</li>
              <li>Final hiring decisions are your responsibility</li>
              <li>We do not guarantee fairness or outcomes of AI-based evaluation</li>
            </ul>
          </section>

          <section id="cancellation" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">7. Cancellation & Termination</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>You may cancel anytime via your dashboard</li>
              <li>We may suspend or terminate access for abuse, fraud, or legal compliance</li>
              <li>
                Data will be retained up to 30 days after cancellation, unless legally required
                longer
              </li>
            </ul>
          </section>

          <section id="disclaimers" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>Service is provided &ldquo;as-is&rdquo; and &ldquo;as available&rdquo;</li>
              <li>No warranty for uninterrupted or error-free use</li>
              <li>We are not responsible for lost data or third-party service outages</li>
            </ul>
          </section>

          <section id="liability" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <ul className="list-disc ml-6 mb-6 text-sm leading-relaxed">
              <li>We are not liable for indirect or consequential damages</li>
              <li>Total liability is limited to fees paid by you in the past 12 months</li>
            </ul>
          </section>

          <section id="indemnification" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
            <p className="mb-6 text-sm leading-relaxed">
              You agree to indemnify and hold us harmless from claims arising out of your use of the
              platform, breach of these terms, or misuse of data.
            </p>
          </section>

          <section id="changes" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
            <p className="mb-6 text-sm leading-relaxed">
              We may revise these Terms. Continued use constitutes acceptance. Material changes will
              be notified via email or dashboard.
            </p>
          </section>

          <section id="governing-law" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
            <p className="mb-6 text-sm leading-relaxed">
              These Terms are governed by the laws of [Your Country/State]. Disputes shall be
              resolved under local jurisdiction.
            </p>
          </section>

          <section id="contact" className="mb-8">
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-sm">
              For legal questions or support, contact <b>legal@prodevkampala.com</b>.
            </p>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

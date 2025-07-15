import React from 'react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';

const sections = [
  { id: 'info-collect', label: 'Information We Collect' },
  { id: 'use-info', label: 'How We Use Your Information' },
  { id: 'legal-basis', label: 'Legal Basis (GDPR)' },
  { id: 'data-sharing', label: 'Data Sharing' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'international', label: 'International Transfers' },
  { id: 'changes', label: 'Changes to Policy' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Effective Date: 15th July, 2025</p>
            <p className="text-sm text-gray-500 pt-4 mx-auto">
              We at Prodev Innovations Limited (&ldquo;Company&rdquo;, &ldquo;we&rdquo;,
              &ldquo;our&rdquo;, or &ldquo;us&rdquo;) are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you visit our platform.
            </p>
          </header>

          <section id="info-collect" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <h3 className="text-base font-semibold mt-4 mb-1">a. Information You Provide to Us</h3>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>
                <b>Account data:</b> Name, company name, email, password
              </li>
              <li>
                <b>Candidate data:</b> Candidate name, email (if provided), and interview answers
              </li>
              <li>
                <b>Job data:</b> Job title, custom job requirements
              </li>
              <li>
                <b>Payment data:</b> Managed by Stripe. We do not store credit card numbers.
              </li>
            </ul>
            <h3 className="text-base font-semibold mt-4 mb-1">
              b. Information We Collect Automatically
            </h3>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>IP address, browser type, device info</li>
              <li>Interaction logs (e.g., time spent, navigation paths)</li>
              <li>Cookies (essential and optional analytics cookies)</li>
            </ul>
            <h3 className="text-base font-semibold mt-4 mb-1">c. Calendar Integration Data</h3>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>We collect access tokens (with OAuth 2.0) if you connect your Google Calendar</li>
              <li>Access to create/view interview events only</li>
            </ul>
          </section>

          <section id="use-info" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>To create and maintain your account</li>
              <li>To facilitate and schedule AI-based interviews</li>
              <li>To provide calendar-based scheduling (Google Calendar API)</li>
              <li>To communicate with you via email</li>
              <li>To generate AI-based insights and scoring</li>
              <li>For billing and subscription enforcement</li>
              <li>To improve and personalize your experience</li>
            </ul>
          </section>

          <section id="legal-basis" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">3. Legal Basis (GDPR Compliance)</h2>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>
                <b>Consent:</b> For cookies, communication, and calendar access
              </li>
              <li>
                <b>Contractual necessity:</b> For creating accounts and billing
              </li>
              <li>
                <b>Legitimate interest:</b> For analytics, product improvement
              </li>
            </ul>
          </section>

          <section id="data-sharing" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="mb-2 text-sm">
              We share limited data with the following trusted vendors:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs mb-6 border border-gray-200 min-w-[400px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Partner</th>
                    <th className="border px-2 py-1 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">Google API</td>
                    <td className="border px-2 py-1">Calendar sync</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">OpenAI</td>
                    <td className="border px-2 py-1">AI scoring & interview processing</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Supabase</td>
                    <td className="border px-2 py-1">Database & authentication</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Stripe</td>
                    <td className="border px-2 py-1">Payment processing</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mb-6 text-sm">We never sell your personal data.</p>
          </section>

          <section id="data-retention" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>Account data: Retained until account deletion</li>
              <li>Candidate data: Retained for 12 months or until employer removes</li>
              <li>Interview records: Stored securely and deletable on request</li>
            </ul>
          </section>

          <section id="your-rights" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccuracies</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Opt-out of sale or sharing (we do not sell data)</li>
              <li>File a complaint with your data protection authority</li>
            </ul>
            <p className="mb-6 text-sm">
              To exercise your rights, email <b>privacy@prodevkampala.com</b>
            </p>
          </section>

          <section id="data-security" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>TLS encryption for data in transit</li>
              <li>Encrypted storage and role-based access</li>
              <li>Secure cloud hosting</li>
            </ul>
          </section>

          <section id="cookies" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
            <ul className="list-disc ml-6 mb-2 text-sm leading-relaxed">
              <li>Maintain session state</li>
              <li>Understand user behavior (Google Analytics)</li>
              <li>Improve platform performance</li>
            </ul>
            <p className="mb-6 text-sm">
              Users can opt out of non-essential cookies via our cookie banner.
            </p>
          </section>

          <section id="international" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">9. International Transfers</h2>
            <p className="mb-6 text-sm">
              Data may be stored in the U.S. by our cloud providers. We ensure adequate safeguards
              are in place per GDPR.
            </p>
          </section>

          <section id="changes" className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-semibold mb-3">10. Changes to Policy</h2>
            <p className="mb-6 text-sm">
              We may update this policy. We will notify you via the dashboard or email.
            </p>
          </section>

          <section id="contact" className="mb-8">
            <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
            <p className="text-sm">
              If you have questions or complaints, email us at <b>privacy@prodevkampala.com</b>.
            </p>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

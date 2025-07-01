'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { 
  UserGroupIcon,
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would normally send to your backend
    console.log('Waitlist email:', email);
    setEmail('');
    setIsSubmitting(false);
    
    // Show success message (you can implement this with a toast later)
    alert('Thanks! We&apos;ll get in touch within 24h.');
  };

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="border-b border-surface bg-white shadow-sm">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">AI Hiring Agent</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#how-it-works" className="text-muted-text hover:text-text transition-colors">
                How it Works
              </Link>
              <Link href="#testimonials" className="text-muted-text hover:text-text transition-colors">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-muted-text hover:text-text transition-colors">
                Pricing
              </Link>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </nav>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-text">
                Hire 5x Faster with{' '}
                <span className="text-primary">AI-Powered Interviews</span>
              </h1>
              <h2 className="text-xl md:text-2xl text-muted-text mb-6 font-normal">
                Skip endless resumes and long application queues. Our AI interviews, evaluates, and shortlists top candidates automatically.
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="text-lg">
                  Start Free Screening
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="text-lg">
                  Watch Demo
                </Button>
              </div>
              <p className="text-sm text-muted-text">
                ✨ First 10 interviews free • No credit card required
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {/* Placeholder for professional illustration */}
                <div className="bg-surface rounded-lg p-8 flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserGroupIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-muted-text">Professional Interview Illustration</p>
                    <p className="text-sm text-muted-text mt-2">
                      (Replace with unDraw illustration)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-surface">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text">How It Works</h2>
            <p className="text-lg text-muted-text max-w-2xl mx-auto">
              Get from job posting to shortlisted candidates in just 3 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text">Tell us what you&apos;re hiring for</h3>
              <p className="text-muted-text">
                Briefly describe your ideal candidate, role requirements, and preferences.
              </p>
            </div>
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text">Our AI handles the interviews</h3>
              <p className="text-muted-text">
                Every applicant gets an instant, dynamic interview. No resumes. No waiting.
              </p>
            </div>
            <div className="text-center bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text">Get a smart shortlist</h3>
              <p className="text-muted-text">
                We send you a summarized report with the top fits — scored and ranked.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Use This Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text">Why Choose AI Hiring?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <BoltIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-text">5x Faster Hiring</h3>
              <p className="text-muted-text">Reduce time-to-hire from days to hours</p>
            </div>
            <div className="text-center">
              <ShieldCheckIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-text">Bias-Free Process</h3>
              <p className="text-muted-text">No resume screening or unconscious bias</p>
            </div>
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-text">AI-Powered Insights</h3>
              <p className="text-muted-text">Automatic evaluation and candidate ranking</p>
            </div>
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-text">Human-Like Experience</h3>
              <p className="text-muted-text">Natural, conversational interviews</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Who Is It For Section */}
      <section className="py-20 bg-surface">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text">Perfect for Growing Teams</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-light">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2 text-text">Startup Founders</h3>
              <p className="text-sm text-muted-text">Building your first team without HR support</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-light">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2 text-text">Small Business Owners</h3>
              <p className="text-sm text-muted-text">Scale hiring without dedicated recruiters</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-light">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2 text-text">Recruitment Agencies</h3>
              <p className="text-sm text-muted-text">Handle multiple clients efficiently</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-light">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2 text-text">HR Managers</h3>
              <p className="text-sm text-muted-text">Streamline your screening process</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text">What Our Users Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-surface p-8 rounded-lg border border-gray-light">
              <p className="text-lg mb-4 italic text-text">
                &ldquo;It&apos;s like having a recruiter, interviewer, and assistant — all in one.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">J</span>
                </div>
                <div>
                  <p className="font-semibold text-text">James Chen</p>
                  <p className="text-sm text-muted-text">Tech Startup CEO</p>
                </div>
              </div>
            </div>
            <div className="bg-surface p-8 rounded-lg border border-gray-light">
              <p className="text-lg mb-4 italic text-text">
                &ldquo;We saved 20 hours on one hire. This changes everything.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">S</span>
                </div>
                <div>
                  <p className="font-semibold text-text">Sharon Williams</p>
                  <p className="text-sm text-muted-text">HR Manager, LogiCorp</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Early Access Section */}
      <section className="py-20 bg-primary/5">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text">Get Early Access</h2>
            <p className="text-lg text-muted-text mb-8 max-w-2xl mx-auto">
              Join our private beta and be among the first to experience the future of hiring.
            </p>
            <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white border border-gray-light text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <Button type="submit" isLoading={isSubmitting}>
                  Join Waitlist
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-surface bg-white">
        <Container>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-primary">AI Hiring Agent</span>
            </div>
            <p className="text-muted-text mb-4">
              Hire 5x faster with AI-powered interviews
            </p>
            <div className="flex justify-center space-x-6 text-sm text-muted-text">
              <Link href="/privacy" className="hover:text-text transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-text transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-text transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-muted-text mt-6">
              © 2024 AI Hiring Agent. All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

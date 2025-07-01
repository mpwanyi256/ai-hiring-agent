'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { 
  CheckCircleIcon, 
  SparklesIcon, 
  ClockIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon
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
    alert('Thanks! We\'ll get in touch within 24h.');
  };

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="border-b border-surface">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-black" />
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
      <section className="py-20 lg:py-32">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-primary">🤖 AI Hiring Agent</span>
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl text-muted-text mb-4 font-medium">
              Tired of endless resumes? Let AI find the right candidate for you.
            </h2>
            <p className="text-lg md:text-xl text-muted-text mb-8 max-w-3xl mx-auto">
              Skip job boards and long application queues. Our AI interviews, evaluates, and shortlists top candidates — automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4">
                👉 Start Free Screening
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Join the Waitlist
              </Button>
            </div>
            <p className="text-sm text-muted-text mt-4">
              🎉 First 10 interviews free. Start hiring in under 5 minutes.
            </p>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-surface/50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">✅ How It Works</h2>
            <p className="text-lg text-muted-text max-w-2xl mx-auto">
              Get from job posting to shortlisted candidates in just 3 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Tell us what you're hiring for</h3>
              <p className="text-muted-text">
                Briefly describe your ideal candidate, role requirements, and preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Our AI handles the interviews</h3>
              <p className="text-muted-text">
                Every applicant gets an instant, dynamic interview. No resumes. No waiting.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get a smart shortlist</h3>
              <p className="text-muted-text">
                We send you a summarized report with the top fits — scored and ranked.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Use This Section */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">✨ Why Use This?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <BoltIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">⚡ Hire 5x faster</h3>
              <p className="text-muted-text">from days to hours</p>
            </div>
            <div className="text-center">
              <ShieldCheckIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">🤖 Bias-free interviews</h3>
              <p className="text-muted-text">no resume screening or guesswork</p>
            </div>
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">🧠 Built with AI</h3>
              <p className="text-muted-text">automatic insights and summaries</p>
            </div>
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">💬 Human-like experience</h3>
              <p className="text-muted-text">async interviews at scale</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Who Is It For Section */}
      <section className="py-20 bg-surface/50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">🧍 Who Is It For?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background p-6 rounded-lg border border-gray-dark">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Startup founders hiring solo</h3>
            </div>
            <div className="bg-background p-6 rounded-lg border border-gray-dark">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Small teams without HR</h3>
            </div>
            <div className="bg-background p-6 rounded-lg border border-gray-dark">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Agencies managing multiple job openings</h3>
            </div>
            <div className="bg-background p-6 rounded-lg border border-gray-dark">
              <UserGroupIcon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Anyone tired of job board spam</h3>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">💬 What People Say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-surface p-8 rounded-lg">
              <p className="text-lg mb-4 italic">
                "It's like having a recruiter, interviewer, and assistant — in one."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-black font-semibold">J</span>
                </div>
                <div>
                  <p className="font-semibold">James</p>
                  <p className="text-sm text-muted-text">Tech Startup CEO</p>
                </div>
              </div>
            </div>
            <div className="bg-surface p-8 rounded-lg">
              <p className="text-lg mb-4 italic">
                "We saved 20 hours on one hire. This changes everything."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                  <span className="text-black font-semibold">S</span>
                </div>
                <div>
                  <p className="font-semibold">Sharon</p>
                  <p className="text-sm text-muted-text">HR at Logistics SME</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Early Access Section */}
      <section className="py-20 bg-primary/10">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">📩 Want Early Access?</h2>
            <p className="text-lg text-muted-text mb-8 max-w-2xl mx-auto">
              We're rolling out limited private beta access. Drop your email below — we'll get in touch within 24h.
            </p>
            <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-surface border border-gray-dark text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Button type="submit" isLoading={isSubmitting}>
                  📩 Join Early Access List
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-surface">
        <Container>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-black" />
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

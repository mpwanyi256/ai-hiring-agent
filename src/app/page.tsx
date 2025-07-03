'use client';

import { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { 
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CheckIcon,
  StarIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success } = useToast();

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Here you would typically send to your API
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEmail('');
    setIsSubmitting(false);
    
    // Show success message
    success('Thanks! We&apos;ll get in touch within 24h.');
  };

  return (
    <div className="min-h-screen bg-background text-text overflow-x-hidden">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-surface"></div>
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
          }}
        ></div>
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-teal-500/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 shadow-sm">
        <Container>
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                Intervio
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-6 py-3 rounded-full bg-primary text-white font-medium transition-all hover:bg-primary/90 hover:shadow-lg">
                Home
              </Link>
              <Link href="/about" className="px-6 py-3 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all">
                About Us
              </Link>
              <div className="relative group">
                <button className="px-6 py-3 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all flex items-center space-x-1">
                  <span>Features</span>
                  <svg className="w-4 h-4 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <Link href="/pricing" className="px-6 py-3 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all">
                Pricing
              </Link>
              <Link href="#testimonials" className="px-6 py-3 rounded-full text-gray-600 hover:text-primary hover:bg-gray-50 font-medium transition-all">
                Testimonial
              </Link>
            </div>

            {/* CTA Button */}
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Start Interview
              </Button>
            </Link>
          </div>
        </Container>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative z-10 pt-16 pb-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  All-In-One AI{' '}
                  <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                    Interview Platform
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  Our platform combines advanced artificial intelligence technologies
                  with intuitive features to streamline your talent selection process,
                  saving you time, effort, and resources.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                  Request Demo
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-primary text-gray-700 hover:text-primary font-semibold px-8 py-4 rounded-full transition-all">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </div>

              {/* Enhanced Stats */}
              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {[
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80",
                      "https://images.unsplash.com/photo-1494790108755-2616b612b1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80"
                    ].map((src, i) => (
                      <Image
                        key={i}
                        src={src}
                        alt="User"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">4.0</span>
                  </div>
                </div>
                <span className="text-gray-500 font-medium">from 500+ reviews</span>
              </div>
            </div>

            {/* Right Content - Enhanced Interview Interface Mockup */}
            <div className="relative">
              {/* Main Interface Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                {/* Question List Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <h3 className="font-semibold text-gray-900 text-lg">Question List</h3>
                  <div className="ml-auto">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">i</span>
                    </div>
                  </div>
                </div>
                
                {/* Question Items */}
                <div className="space-y-4 mb-8">
                  {[
                    { text: "Tell us about yourself?", active: true },
                    { text: "Why do you think you are good at sales?", active: true },
                    { text: "What is the biggest deal you have closed?", active: false },
                    { text: "Why you choose this company?", active: false },
                    { text: "What your expectation in this company?", active: false },
                    { text: "Do you have any questions to our company?", active: false }
                  ].map((question, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        question.active 
                          ? 'bg-primary text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`transition-all ${
                        question.active ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}>
                        {question.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">85%</div>
                    <div className="text-xs text-gray-500 font-medium">Communication Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">92%</div>
                    <div className="text-xs text-gray-500 font-medium">Technical Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">78%</div>
                    <div className="text-xs text-gray-500 font-medium">Culture Fit</div>
                  </div>
                </div>
              </div>

              {/* Team Feedback Floating Card */}
              <div className="absolute -left-8 top-12 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hidden lg:block max-w-xs">
                <h4 className="font-semibold text-gray-900 mb-4">Team Feedback</h4>
                <p className="text-sm text-gray-600 mb-4">See the team feedback result</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80"
                      alt="Leslie Alexander"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Leslie Alexander</div>
                      <div className="text-xs text-gray-500">Human Resource</div>
                      <div className="flex items-center mt-1">
                        {[...Array(4)].map((_, i) => (
                          <StarIcon key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">4.0 Average</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Badge */}
              <div className="absolute -right-6 top-8 bg-gray-800 rounded-2xl p-4 text-white hidden lg:block">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex -space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <Image
                        key={i}
                        src={`https://images.unsplash.com/photo-${1472099645785 + i}?ixlib=rb-4.0.3&auto=format&fit=crop&w=24&h=24&q=80`}
                        alt="User"
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full border border-gray-600"
                      />
                    ))}
                  </div>
                  <div className="flex items-center">
                    {[...Array(4)].map((_, i) => (
                      <StarIcon key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                    <StarIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium ml-1">4.0</span>
                  </div>
                </div>
                <div className="text-xs text-gray-300">from 500+ reviews</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="features" className="relative z-10 py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-text">
              Transforming Hiring through Innovation
            </h2>
            <p className="text-lg text-muted-text max-w-3xl mx-auto">
              At Intervio, we're passionate about redefining the hiring process for the modern era. We understand
              that traditional methods can be time-consuming and hinder the ability to truly identify the best talent.
            </p>
          </div>

          {/* Large Showcase Image */}
          <div className="mb-20">
            <div className="relative bg-gray-100 rounded-2xl p-8 lg:p-16">
              <Image
                src="/images/business.jpg"
                alt="Modern hiring platform showcase"
                width={800}
                height={500}
                className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
              />
              <div className="absolute top-8 left-8 bg-white rounded-lg px-4 py-2 shadow-lg">
                <span className="text-sm font-medium text-text">Your AI-Powered Platform</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BoltIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text">Streamlined Insights</h3>
              <p className="text-muted-text leading-relaxed">
                Automated algorithmic phone calls recording
                that grant interviews platform and most
                relevant keyword and engagement analytics.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ChartBarIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text">Efficient Evaluation</h3>
              <p className="text-muted-text leading-relaxed">
                Real-time AI-powered data collection and
                analysis from phone interviews to help
                recruiters make more informed decisions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-text">Data-Driven Decisions</h3>
              <p className="text-muted-text leading-relaxed">
                Comprehensive AI-built candidate
                assessment from a talent conversation with
                more hiring intelligence and faster screening.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Choose Section */}
      <section className="relative z-10 py-20 bg-surface/50">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-text">Why Choose Intervio?</h2>
              <p className="text-lg text-muted-text mb-8">
                Our platform has been helping reduce hiring time by up to 40% while
                increasing hiring accuracy, improving team productivity by 30%, and providing
                comprehensive candidate evaluation tools.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-primary/10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm text-muted-text">More Efficient</div>
                </div>
                <div className="bg-blue-500/10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">Up to 40%</div>
                  <div className="text-sm text-muted-text">Reduced Hiring Time</div>
                </div>
                <div className="bg-green-500/10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">30%</div>
                  <div className="text-sm text-muted-text">Workplace Accuracy</div>
                </div>
                <div className="bg-teal-500/10 p-6 rounded-xl">
                  <div className="text-3xl font-bold text-teal-600 mb-2">20%</div>
                  <div className="text-sm text-muted-text">Abandoned Chat</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {/* AI-Driven Assessments */}
              <div className="bg-primary rounded-2xl p-8 text-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI-Driven Assessments</h3>
                    <p className="text-primary-light">
                      Leverage cutting-edge AI to evaluate candidates through
                      dynamic, skills, body language, and education by
                      analyzing you spoken behavior hiring decisions.
                    </p>
                  </div>
                  <SparklesIcon className="w-8 h-8 text-white/80" />
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Image
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80"
                      alt="Jane Doe"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium">Jane Doe</div>
                      <div className="text-xs text-white/70">Full Stack Developer</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Technical Skills</span>
                      <span>89%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{width: '89%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavioral Analysis */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 text-text">Behavioral Analysis</h3>
                <p className="text-muted-text mb-6">
                  Analyze soft-skills patterns such as voice pitch,
                  tone, body language, and critical-fit
                  analysis for you teams hiring decisions.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">85%</div>
                    <div className="text-xs text-muted-text">Communication</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">78%</div>
                    <div className="text-xs text-muted-text">Cultural Fit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">92%</div>
                    <div className="text-xs text-muted-text">Problem Solving</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">86%</div>
                    <div className="text-xs text-muted-text">Leadership</div>
                  </div>
                </div>
              </div>

              {/* Real-Time Feedback */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4 text-text">Real-Time Feedback</h3>
                <p className="text-muted-text mb-6">
                  Get instant AI-generated feedback during
                  the interviews, adaptive insights to
                  specific job requirements and real-time
                  interviewing analytical recommendations.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80"
                      alt="System Administrator"
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">System Administrator</div>
                      <div className="text-xs text-muted-text">Strong technical foundation</div>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-text">
              More than 1,000 Users<br />
              Testimony This Product
            </h2>
            <p className="text-lg text-muted-text max-w-3xl mx-auto">
              Let our team tell you how they admire about their experience in
              using Intervio as their human consultation platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-primary rounded-2xl p-8 text-white">
              <p className="text-lg mb-6">
                "Intervio has made it easy for me to access high-quality interview data, saving me significant time that I used to spend on manual evaluations."
              </p>
              <div className="flex items-center space-x-3">
                <Image
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48&q=80"
                  alt="Sarah Johnson"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-sm text-primary-light">HR Manager</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-8">
              <p className="text-lg mb-6 text-text">
                "This app is fantastic! User interviews and streamlined by algorithms have been extremely helpful."
              </p>
              <div className="flex items-center space-x-3">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48&q=80"
                  alt="Emily Collins"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-text">Emily Collins</div>
                  <div className="text-sm text-muted-text">Talent Acquisition Lead</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-8">
              <p className="text-lg mb-6 text-text">
                "I like the results of the algorithm-based interviews and optimization of the hiring process."
              </p>
              <div className="flex items-center space-x-3">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48&q=80"
                  alt="Jessica Lee"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-text">Jessica Lee</div>
                  <div className="text-sm text-muted-text">Recruitment Specialist</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-8">
              <p className="text-lg mb-6 text-text">
                "Great app for company and recruitment needs. The AI insights are remarkably helpful for saving time."
              </p>
              <div className="flex items-center space-x-3">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48&q=80"
                  alt="Michael Anderson"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-text">Michael Anderson</div>
                  <div className="text-sm text-muted-text">Startup Founder</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-8">
              <p className="text-lg mb-6 text-text">
                "This app is a remarkable change in technology landscape and I hope this will improve my team productivity."
              </p>
              <div className="flex items-center space-x-3">
                <Image
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48&q=80"
                  alt="Laure Alexander"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-text">Laure Alexander</div>
                  <div className="text-sm text-muted-text">Project Manager</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Enhanced CTA Section - Matching the woman with headsets design */}
      <section className="relative z-10 py-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary via-green-500 to-green-600 rounded-3xl mx-4 lg:mx-8 mb-8">
          <Container>
            <div className="grid lg:grid-cols-2 gap-8 items-center py-16 lg:py-20">
              {/* Left Content */}
              <div className="text-white space-y-8">
                <div className="space-y-6">
                  <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                    Ready to Revolutionize<br />
                    Your Hiring?
                  </h2>
                  <p className="text-xl lg:text-2xl text-green-100 leading-relaxed">
                    Elevate your hiring process with Intervio's AI-powered platform. Join the
                    future of hiring and unlock a new level of efficiency, fairness, and insights.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    Try for Free Now
                  </Button>
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-all">
                    Request Demo
                  </Button>
                </div>

                <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-4">
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                      required
                    />
                    <Button 
                      type="submit" 
                      isLoading={isSubmitting}
                      className="bg-white text-primary hover:bg-gray-100 px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                    >
                      Join Waitlist
                    </Button>
                  </div>
                  <p className="text-sm text-green-100">
                    ✨ First 10 interviews free • No credit card required
                  </p>
                </form>
              </div>

              {/* Right Content - Woman with headsets and metrics */}
              <div className="relative">
                {/* Main woman image placeholder - you can replace with actual image */}
                <div className="relative">
                  <div className="w-full h-96 bg-white/10 rounded-3xl flex items-end justify-center overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80"
                      alt="Professional woman with headset"
                      width={300}
                      height={400}
                      className="object-cover h-full w-full"
                    />
                  </div>

                  {/* Floating metrics cards */}
                  <div className="absolute top-8 left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&q=80"
                        alt="Seo Jan Im"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Seo Jan Im</div>
                        <div className="text-xs text-green-600 font-medium">Approved</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900">85<span className="text-sm">/100</span></div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">AI Video Score Detail</div>
                      <div className="text-3xl font-bold text-green-600 mb-3">85%</div>
                      <div className="text-xs text-gray-500 mb-3">AI Video Score Summary</div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center mb-1">
                            <span className="text-green-600 font-bold">80%</span>
                          </div>
                          <div className="text-gray-600">Professionalism</div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center mb-1">
                            <span className="text-blue-600 font-bold">90%</span>
                          </div>
                          <div className="text-gray-600">Business Acumen</div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full border-4 border-orange-500 flex items-center justify-center mb-1">
                            <span className="text-orange-600 font-bold">65%</span>
                          </div>
                          <div className="text-gray-600">Opportunistic</div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center mb-1">
                            <span className="text-green-600 font-bold">85%</span>
                          </div>
                          <div className="text-gray-600">Closing Technique</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <button className="bg-green-500 text-white px-3 py-1 rounded-full font-medium">Hire Talent</button>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">✓ Shortlist</span>
                            <span className="text-red-500">✗ Reject</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 bg-gray-900 text-white">
        <Container>
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-primary">Intervio</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Our advanced artificial intelligence platform combines cutting-edge technologies to streamline your talent selection process, making hiring faster and more accurate than ever before.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                  Privacy Policy
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                  Terms of Service
                </Button>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-gray-400 hover:text-white transition-colors">About Us</Link>
                <Link href="/careers" className="block text-gray-400 hover:text-white transition-colors">Careers</Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">Contact</Link>
                <Link href="/blog" className="block text-gray-400 hover:text-white transition-colors">Blog</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <div className="space-y-2 text-gray-400">
                <p>+1 (555) 123-4567</p>
                <p>hello@intervio.com</p>
                <p>123 Business Ave<br />Suite 100<br />San Francisco, CA 94102</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2024 Intervio. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

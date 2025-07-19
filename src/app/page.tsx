'use client';

import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/FeaturesSection';
import WhyChooseSection from '@/components/landing/WhyChooseSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
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
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse pulse-glow"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-1000 pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-teal-500/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section id="hero" className="fade-in">
        <HeroSection />
      </section>

      {/* Features Section */}
      <section id="features" className="slide-up">
        <HowItWorksSection />
      </section>

      {/* Why Choose Section */}
      <section id="why-choose" className="fade-in">
        <WhyChooseSection />
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="slide-up">
        <TestimonialsSection />
      </section>

      {/* CTA Section */}
      <section id="cta" className="fade-in">
        <CTASection />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

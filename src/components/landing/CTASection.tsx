import { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { useToast } from '@/components/providers/ToastProvider';

export default function CTASection() {
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
    <section className="relative z-10 py-0 overflow-hidden">
      <div className="bg-gradient-to-r from-primary via-green-500 to-green-600 rounded-3xl mx-4 lg:mx-8 mb-6 hover:shadow-2xl transition-all duration-500 hover-lift">
        <Container>
          <div className="grid lg:grid-cols-2 gap-8 items-center py-12 lg:py-16">
            {/* Left Content */}
            <div className="text-white space-y-6 fade-in">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                  Ready to Revolutionize<br />
                  Your Hiring?
                </h2>
                <p className="text-lg lg:text-xl text-green-100 leading-relaxed">
                  Elevate your hiring process with Intervio's AI-powered platform. Join the
                  future of hiring and unlock a new level of efficiency, fairness, and insights.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-white text-primary hover:bg-gray-100 font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover-lift">
                  Try for Free Now
                </Button>
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-full transition-all hover-lift">
                  Request Demo
                </Button>
              </div>

              <form onSubmit={handleWaitlistSubmit} className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all hover:bg-white/15"
                    required
                  />
                  <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="bg-white text-primary hover:bg-gray-100 px-6 py-3 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover-lift whitespace-nowrap"
                  >
                    Join Waitlist
                  </Button>
                </div>
                <p className="text-sm text-green-100 flex items-center">
                  <span className="mr-2">✨</span>
                  First 10 interviews free • No credit card required
                </p>
              </form>
            </div>

            {/* Right Content - Woman with headsets and metrics */}
            <div className="relative slide-up">
              {/* Main woman image */}
              <div className="relative">
                <div className="w-full h-80 bg-white/10 rounded-2xl flex items-end justify-center overflow-hidden hover:bg-white/15 transition-all duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop"
                    alt="Professional woman with headset - customer service representative"
                    width={280}
                    height={350}
                    className="object-cover h-full w-full hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Floating metrics cards */}
                <div className="absolute top-6 left-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                  <div className="flex items-center space-x-2">
                    <Image
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=28&h=28&fit=crop&crop=face"
                      alt="Seo Jan Im"
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full hover:scale-110 transition-transform duration-300"
                    />
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Seo Jan Im</div>
                      <div className="text-xs text-green-600 font-medium flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        Approved
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">85<span className="text-xs">/100</span></div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2">AI Video Score Detail</div>
                    <div className="text-2xl font-bold text-green-600 mb-2 hover:scale-110 transition-transform duration-300">85%</div>
                    <div className="text-xs text-gray-500 mb-2">AI Video Score Summary</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { percentage: '80%', label: 'Professionalism', color: 'border-green-500 text-green-600' },
                        { percentage: '90%', label: 'Business Acumen', color: 'border-blue-500 text-blue-600' },
                        { percentage: '65%', label: 'Opportunistic', color: 'border-orange-500 text-orange-600' },
                        { percentage: '85%', label: 'Closing Technique', color: 'border-green-500 text-green-600' }
                      ].map((metric, index) => (
                        <div key={index} className="text-center">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 hover:scale-110 transition-transform duration-300 ${metric.color}`}>
                            <span className={`font-bold text-xs ${metric.color.split(' ')[1]}`}>{metric.percentage}</span>
                          </div>
                          <div className="text-gray-600 text-xs">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <button className="bg-green-500 text-white px-2 py-1 rounded-full font-medium text-xs hover:bg-green-600 transition-colors hover-lift">
                          Hire Talent
                        </button>
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600 text-xs hover:scale-110 transition-transform duration-300">✓ Shortlist</span>
                          <span className="text-red-500 text-xs hover:scale-110 transition-transform duration-300">✗ Reject</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional floating elements for more interactivity */}
                <div className="absolute top-1/2 -left-4 bg-blue-500/10 w-16 h-16 rounded-full animate-pulse hidden lg:block"></div>
                <div className="absolute bottom-1/4 -right-4 bg-green-500/10 w-12 h-12 rounded-full animate-bounce hidden lg:block"></div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
} 
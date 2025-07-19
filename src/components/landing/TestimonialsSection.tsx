import Image from 'next/image';
import Container from '@/components/ui/Container';
import { QuoteIcon, Star } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      company: 'TechCorp Inc.',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=48&h=48&fit=crop&crop=face',
      companyLogo:
        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=32&h=32&fit=crop',
      text: 'The AI resume analysis is incredibly accurate. It identified skills matches I would have missed and saved us 70% of screening time. The Q&A evaluation gives us deep insights into candidate thinking.',
      rating: 5,
      featured: true,
      metrics: { timeSaved: '70%', accuracy: '95%' },
    },
    {
      name: 'Michael Chen',
      role: 'Talent Acquisition Lead',
      company: 'StartupXYZ',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
      companyLogo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=32&h=32&fit=crop',
      text: "As a startup, we need to be efficient with hiring. This platform's resume evaluation and Q&A assessment helped us identify the right candidates quickly. The automated ranking is spot-on.",
      rating: 5,
      metrics: { timeSaved: '60%', accuracy: '92%' },
    },
    {
      name: 'Emily Rodriguez',
      role: 'Recruitment Manager',
      company: 'Global Solutions',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face',
      companyLogo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=32&h=32&fit=crop',
      text: "The Q&A evaluation system is brilliant. It assesses technical knowledge and soft skills simultaneously. We've seen a 40% improvement in hiring quality since implementing this platform.",
      rating: 5,
      metrics: { timeSaved: '65%', accuracy: '88%' },
    },
    {
      name: 'David Kim',
      role: 'Engineering Manager',
      company: 'InnovateTech',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face',
      companyLogo:
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=32&h=32&fit=crop',
      text: 'Perfect for technical hiring. The resume analysis catches relevant experience and the Q&A evaluation tests problem-solving skills effectively. Highly recommend for engineering teams.',
      rating: 4,
      metrics: { timeSaved: '55%', accuracy: '90%' },
    },
    {
      name: 'Lisa Thompson',
      role: 'VP of People',
      company: 'ScaleUp Co.',
      image:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=48&h=48&fit=crop&crop=face',
      companyLogo: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=32&h=32&fit=crop',
      text: 'The automated ranking system is a game-changer. It combines resume analysis with Q&A performance to give us the most qualified candidates. Our hiring process is now data-driven.',
      rating: 5,
      metrics: { timeSaved: '75%', accuracy: '94%' },
    },
    {
      name: 'Alex Morgan',
      role: 'Head of Talent',
      company: 'Growth Ventures',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face',
      companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=32&h=32&fit=crop',
      text: "Excellent platform for modern hiring. The AI evaluation is unbiased and thorough. We've reduced our time-to-hire by 50% while improving candidate quality significantly.",
      rating: 5,
      metrics: { timeSaved: '50%', accuracy: '91%' },
    },
  ];

  return (
    <section
      id="testimonials"
      className="relative z-10 py-16 bg-gradient-to-br from-gray-50 to-white"
    >
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-text">
            Trusted by 1,000+ Companies
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-lg text-muted-text max-w-3xl mx-auto">
            See how leading companies are transforming their hiring process with AI-powered resume
            analysis and Q&A evaluation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`rounded-2xl p-6 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl ${
                testimonial.featured
                  ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl'
                  : 'bg-white border border-gray-200 hover:border-primary/20 shadow-lg'
              }`}
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <QuoteIcon
                  className={`w-8 h-8 ${testimonial.featured ? 'text-white/80' : 'text-primary/60'}`}
                />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? testimonial.featured
                          ? 'text-yellow-300'
                          : 'text-yellow-400'
                        : testimonial.featured
                          ? 'text-white/30'
                          : 'text-gray-300'
                    }`}
                  />
                ))}
                <span
                  className={`ml-2 text-sm font-medium ${testimonial.featured ? 'text-white/90' : 'text-gray-600'}`}
                >
                  {testimonial.rating}.0
                </span>
              </div>

              {/* Testimonial Text */}
              <p
                className={`mb-6 leading-relaxed text-sm ${
                  testimonial.featured ? 'text-white/95' : 'text-gray-700'
                }`}
              >
                &quot;{testimonial.text}&quot;
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  className={`text-center p-2 rounded-lg ${
                    testimonial.featured ? 'bg-white/20' : 'bg-primary/10'
                  }`}
                >
                  <div
                    className={`text-lg font-bold ${testimonial.featured ? 'text-white' : 'text-primary'}`}
                  >
                    {testimonial.metrics.timeSaved}
                  </div>
                  <div
                    className={`text-xs ${testimonial.featured ? 'text-white/80' : 'text-gray-600'}`}
                  >
                    Time Saved
                  </div>
                </div>
                <div
                  className={`text-center p-2 rounded-lg ${
                    testimonial.featured ? 'bg-white/20' : 'bg-blue-500/10'
                  }`}
                >
                  <div
                    className={`text-lg font-bold ${testimonial.featured ? 'text-white' : 'text-blue-600'}`}
                  >
                    {testimonial.metrics.accuracy}
                  </div>
                  <div
                    className={`text-xs ${testimonial.featured ? 'text-white/80' : 'text-gray-600'}`}
                  >
                    Accuracy
                  </div>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center space-x-3">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                <div className="flex-1">
                  <div
                    className={`font-semibold ${testimonial.featured ? 'text-white' : 'text-gray-900'}`}
                  >
                    {testimonial.name}
                  </div>
                  <div
                    className={`text-sm ${testimonial.featured ? 'text-white/80' : 'text-gray-600'}`}
                  >
                    {testimonial.role}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Image
                      src={testimonial.companyLogo}
                      alt={testimonial.company}
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded"
                    />
                    <span
                      className={`text-xs ${testimonial.featured ? 'text-white/70' : 'text-gray-500'}`}
                    >
                      {testimonial.company}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Stats */}
        <div className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">1,000+</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">50,000+</div>
              <div className="text-sm text-gray-600">Candidates Evaluated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">65%</div>
              <div className="text-sm text-gray-600">Average Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">4.8/5</div>
              <div className="text-sm text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

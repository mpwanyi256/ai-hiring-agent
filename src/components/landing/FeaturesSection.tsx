import Image from 'next/image';
import { BoltIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import Container from '@/components/ui/Container';

export default function FeaturesSection() {
  const features = [
    {
      icon: BoltIcon,
      title: 'Streamlined Insights',
      description:
        'Automated algorithmic phone calls recording that grant interviews platform and most relevant keyword and engagement analytics.',
    },
    {
      icon: ChartBarIcon,
      title: 'Efficient Evaluation',
      description:
        'Real-time AI-powered data collection and analysis from phone interviews to help recruiters make more informed decisions.',
    },
    {
      icon: UsersIcon,
      title: 'Data-Driven Decisions',
      description:
        'Comprehensive AI-built candidate assessment from a talent conversation with more hiring intelligence and faster screening.',
    },
  ];

  return (
    <section id="features" className="relative z-10 py-16 bg-white">
      <Container>
        <div className="text-center mb-12 fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-text">
            Transforming Hiring through Innovation
          </h2>
          <p className="text-lg text-muted-text max-w-3xl mx-auto">
            At Intervio, we&apos;re passionate about redefining the hiring process for the modern
            era. We understand that traditional methods can be time-consuming and hinder the ability
            to truly identify the best talent.
          </p>
        </div>

        {/* Large Showcase Image */}
        <div className="mb-16 slide-up">
          <div className="relative bg-gray-100 rounded-2xl p-6 lg:p-12 hover:shadow-xl transition-all duration-500 hover-lift">
            <Image
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=500&fit=crop"
              alt="Modern hiring platform showcase - team collaboration"
              width={800}
              height={500}
              className="w-full max-w-4xl mx-auto rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
            />
            <div className="absolute top-6 left-6 bg-white rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
              <span className="text-sm font-medium text-text">Your AI-Powered Platform</span>
            </div>

            {/* Floating metrics */}
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift hidden md:block">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Live Analytics</span>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift hidden md:block">
              <div className="text-center">
                <div className="text-sm font-bold text-primary">95%</div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover-lift fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                <feature.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-text group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-text leading-relaxed text-sm group-hover:text-gray-700 transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12 fade-in">
          <div className="inline-flex items-center space-x-2 bg-primary/5 px-6 py-3 rounded-full hover:bg-primary/10 transition-colors duration-300 cursor-pointer hover-lift">
            <span className="text-primary font-medium">Explore all features</span>
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Container>
    </section>
  );
}

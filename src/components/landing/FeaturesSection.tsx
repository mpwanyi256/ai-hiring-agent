import Image from 'next/image';
import { BoltIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';
import Container from '@/components/ui/Container';

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 py-16 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-text">
            Transforming Hiring through Innovation
          </h2>
          <p className="text-lg text-muted-text max-w-3xl mx-auto">
            At Intervio, we're passionate about redefining the hiring process for the modern era. We understand
            that traditional methods can be time-consuming and hinder the ability to truly identify the best talent.
          </p>
        </div>

        {/* Large Showcase Image */}
        <div className="mb-16">
          <div className="relative bg-gray-100 rounded-2xl p-6 lg:p-12">
            <Image
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=500&fit=crop"
              alt="Modern hiring platform showcase - team collaboration"
              width={800}
              height={500}
              className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
            />
            <div className="absolute top-6 left-6 bg-white rounded-lg px-4 py-2 shadow-lg">
              <span className="text-sm font-medium text-text">Your AI-Powered Platform</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BoltIcon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-text">Streamlined Insights</h3>
            <p className="text-muted-text leading-relaxed text-sm">
              Automated algorithmic phone calls recording
              that grant interviews platform and most
              relevant keyword and engagement analytics.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ChartBarIcon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-text">Efficient Evaluation</h3>
            <p className="text-muted-text leading-relaxed text-sm">
              Real-time AI-powered data collection and
              analysis from phone interviews to help
              recruiters make more informed decisions.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <UsersIcon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-text">Data-Driven Decisions</h3>
            <p className="text-muted-text leading-relaxed text-sm">
              Comprehensive AI-built candidate
              assessment from a talent conversation with
              more hiring intelligence and faster screening.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
} 
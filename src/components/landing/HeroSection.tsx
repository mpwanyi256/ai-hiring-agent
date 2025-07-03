import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, PlayIcon, StarIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function HeroSection() {
  return (
    <section className="relative z-10 pt-24 pb-16">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                All-In-One AI{' '}
                <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                  Interview Platform
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                Our platform combines advanced artificial intelligence technologies
                with intuitive features to streamline your talent selection process,
                saving you time, effort, and resources.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Request Demo
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-primary text-gray-700 hover:text-primary font-semibold px-6 py-3 rounded-full transition-all">
                <PlayIcon className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1494790108755-2616b612b1ac?w=32&h=32&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt="User"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">4.0</span>
                </div>
              </div>
              <span className="text-gray-500 font-medium text-sm">from 500+ reviews</span>
            </div>
          </div>

          {/* Right Content - Interface Mockup */}
          <div className="relative lg:pl-4">
            {/* Main Interface Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 relative z-10">
              {/* Question List Header */}
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <h3 className="font-semibold text-gray-900 text-base">Question List</h3>
                <div className="ml-auto">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">i</span>
                  </div>
                </div>
              </div>
              
              {/* Question Items */}
              <div className="space-y-3 mb-6">
                {[
                  { text: "Tell us about yourself?", active: true },
                  { text: "Why do you think you are good at sales?", active: true },
                  { text: "What is the biggest deal you have closed?", active: false },
                  { text: "Why you choose this company?", active: false },
                  { text: "What your expectation in this company?", active: false },
                  { text: "Do you have any questions to our company?", active: false }
                ].map((question, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      question.active 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm transition-all ${
                      question.active ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}>
                      {question.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">85%</div>
                  <div className="text-xs text-gray-500 font-medium">Communication Skills</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">92%</div>
                  <div className="text-xs text-gray-500 font-medium">Technical Skills</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">78%</div>
                  <div className="text-xs text-gray-500 font-medium">Culture Fit</div>
                </div>
              </div>
            </div>

            {/* Team Feedback Floating Card */}
            <div className="absolute -left-6 top-8 bg-white rounded-xl shadow-lg p-4 border border-gray-100 hidden lg:block max-w-xs z-20">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Team Feedback</h4>
              <p className="text-xs text-gray-600 mb-3">See the team feedback result</p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=28&h=28&fit=crop&crop=face"
                    alt="Leslie Alexander"
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">Leslie Alexander</div>
                    <div className="text-xs text-gray-500">Human Resource</div>
                    <div className="flex items-center mt-1">
                      {[...Array(4)].map((_, i) => (
                        <StarIcon key={i} className="w-2 h-2 text-yellow-400 fill-current" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">4.0 Average</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Badge */}
            <div className="absolute -right-4 top-6 bg-gray-800 rounded-xl p-3 text-white hidden lg:block z-20">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex -space-x-1">
                  {[
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=20&h=20&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1494790108755-2616b612b1ac?w=20&h=20&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=20&h=20&fit=crop&crop=face"
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt="User"
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded-full border border-gray-600"
                    />
                  ))}
                </div>
                <div className="flex items-center">
                  {[...Array(4)].map((_, i) => (
                    <StarIcon key={i} className="w-2 h-2 text-yellow-400 fill-current" />
                  ))}
                  <StarIcon className="w-2 h-2 text-gray-400" />
                  <span className="text-xs font-medium ml-1">4.0</span>
                </div>
              </div>
              <div className="text-xs text-gray-300">from 500+ reviews</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
} 
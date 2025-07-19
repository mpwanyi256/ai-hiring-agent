import Image from 'next/image';
import {
  ArrowRightIcon,
  PlayIcon,
  StarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Link from 'next/link';

export default function HeroSection() {
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative z-10 pt-24 pb-16">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                All-In-One <br />
                <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                  Hiring Platform
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                Our platform combines advanced artificial intelligence technologies with intuitive
                features to streamline your talent selection process, saving you time, effort, and
                resources.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover-lift"
                >
                  Talk to Us
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToHowItWorks}
                className="border-2 border-gray-300 hover:border-primary text-gray-700 hover:text-white font-semibold px-6 py-3 rounded-full transition-all hover-lift"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {[
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=32&h=32&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt="User"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm hover:transform hover:scale-110 transition-transform duration-300"
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className="w-3 h-3 text-yellow-400 fill-current hover:transform hover:scale-125 transition-transform duration-200"
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">4.8</span>
                </div>
              </div>
              <span className="text-gray-500 font-medium text-sm">from 500+ reviews</span>
            </div>
          </div>

          {/* Right Content - Interface Mockup */}
          <div className="relative lg:pl-4 slide-up">
            {/* Main Interface Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 relative z-10 hover:shadow-2xl transition-all duration-300 hover-lift">
              {/* Resume Evaluation Header */}
              <div className="flex items-center space-x-3 mb-5">
                <DocumentTextIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900 text-base">Resume Evaluation</h3>
                <div className="ml-auto">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-green-600">✓</span>
                  </div>
                </div>
              </div>

              {/* Resume Analysis Results */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Technical Skills Match
                    </span>
                    <span className="text-sm font-bold text-primary">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Experience Relevance</span>
                    <span className="text-sm font-bold text-primary">88%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Education Fit</span>
                    <span className="text-sm font-bold text-primary">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>

              {/* Q&A Evaluation Section */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Q&A Evaluation</h4>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      question: 'Describe your experience with React?',
                      score: 85,
                      status: 'Excellent',
                    },
                    { question: 'How do you handle team conflicts?', score: 78, status: 'Good' },
                    {
                      question: 'What is your approach to testing?',
                      score: 92,
                      status: 'Outstanding',
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                    >
                      <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                        {item.question}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-blue-600">{item.score}%</span>
                        <span className="text-xs text-green-600 font-medium">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Score */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Overall Score</span>
                  <div className="text-2xl font-bold text-primary">89%</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Recommended for next round</div>
              </div>
            </div>

            {/* Candidate Info Floating Card */}
            {/* <div className="absolute -left-6 bottom-8 bg-white rounded-xl shadow-lg p-4 border border-gray-100 hidden lg:block max-w-xs z-20 hover:shadow-xl transition-all duration-300 hover-lift">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Candidate Profile</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
                    alt="John Smith"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">John Smith</div>
                    <div className="text-xs text-gray-500">Senior Frontend Developer</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-green-100 p-2 rounded">
                    <div className="font-semibold text-green-800">5 years</div>
                    <div className="text-green-600">Experience</div>
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <div className="font-semibold text-blue-800">React</div>
                    <div className="text-blue-600">Expert</div>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Ranking Badge */}
            {/* <div className="absolute -right-4 top-6 bg-primary rounded-xl p-3 text-white hidden lg:block z-20 hover:bg-primary/90 transition-colors duration-300 hover-lift">
              <div className="text-center">
                <div className="text-lg font-bold mb-1">#1</div>
                <div className="text-xs">Ranked</div>
                <div className="text-xs opacity-80">Top Candidate</div>
              </div>
            </div> */}
          </div>
        </div>
      </Container>
    </section>
  );
}

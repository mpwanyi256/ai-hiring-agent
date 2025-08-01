import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function CTASection() {
  return (
    <section className="relative z-10 py-0 overflow-hidden">
      <div className="bg-gradient-to-r from-primary via-green-500 to-green-600 rounded-3xl mx-4 lg:mx-8 mb-6 hover:shadow-2xl transition-all duration-500 hover-lift">
        <Container>
          <div className="grid lg:grid-cols-2 gap-8 items-center py-12 lg:py-16">
            {/* Left Content */}
            <div className="text-white space-y-6 fade-in">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                  Ready to Transform
                  <br />
                  Your Hiring Process?
                </h2>
                <p className="text-lg lg:text-xl text-green-100 leading-relaxed">
                  Join thousands of companies using Intavia to make better hiring decisions faster.
                  Start your free trial today.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-green-200" />
                  <div className="text-sm font-semibold">Resume Analysis</div>
                  <div className="text-xs text-green-200">95% Accuracy</div>
                </div>
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 text-green-200" />
                  <div className="text-sm font-semibold">Q&A Evaluation</div>
                  <div className="text-xs text-green-200">Instant Results</div>
                </div>
                <div className="text-center">
                  <ChartBarIcon className="w-8 h-8 mx-auto mb-2 text-green-200" />
                  <div className="text-sm font-semibold">Smart Ranking</div>
                  <div className="text-xs text-green-200">AI-Powered</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
                  <button className="bg-white text-primary hover:bg-gray-100 font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover-lift">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-6 py-3 rounded-full transition-all hover-lift">
                    Talk to Us
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Content - Dashboard mockup */}
            <div className="relative slide-up">
              {/* Main dashboard card */}
              <div className="relative">
                <div className="w-full h-80 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden hover:bg-white/15 transition-all duration-300 p-4">
                  <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Candidate Evaluation</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>

                    {/* Candidate profile */}
                    <div className="flex items-center space-x-3 mb-4">
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                        alt="Sarah Johnson"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Sarah Johnson</div>
                        <div className="text-sm text-gray-500">Senior Frontend Developer</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-2xl font-bold text-primary">89%</div>
                        <div className="text-xs text-gray-500">Overall Score</div>
                      </div>
                    </div>

                    {/* Evaluation metrics */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Resume Match</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: '92%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">92%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Q&A Performance</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: '85%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Technical Skills</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: '88%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">88%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-2 mt-4">
                      <button className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                        Shortlist
                      </button>
                      <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating success metrics */}
                <div className="absolute top-6 left-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">65%</div>
                    <div className="text-xs text-gray-600">Time Saved</div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">1,000+</div>
                    <div className="text-xs text-gray-600">Companies</div>
                  </div>
                </div>

                {/* Additional floating elements */}
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

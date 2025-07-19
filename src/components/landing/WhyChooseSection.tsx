import Image from 'next/image';
import { DocumentTextIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Container from '@/components/ui/Container';

export default function WhyChooseSection() {
  return (
    <section className="relative z-10 py-16 bg-surface/50">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-5 text-text">
              Why Choose Our AI Platform?
            </h2>
            <p className="text-lg text-muted-text mb-6">
              Our AI-powered platform revolutionizes hiring through intelligent resume analysis and
              comprehensive Q&A evaluation, helping you make data-driven hiring decisions with
              confidence.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-primary mb-1">95%</div>
                <div className="text-xs text-muted-text">Accuracy Rate</div>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 mb-1">60%</div>
                <div className="text-xs text-muted-text">Faster Screening</div>
              </div>
              <div className="bg-green-500/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-green-600 mb-1">40%</div>
                <div className="text-xs text-muted-text">Cost Reduction</div>
              </div>
              <div className="bg-teal-500/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-teal-600 mb-1">24/7</div>
                <div className="text-xs text-muted-text">Evaluation</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {/* AI Resume Analysis */}
            <div className="bg-primary rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI Resume Analysis</h3>
                  <p className="text-white text-sm">
                    Advanced AI algorithms analyze resumes for skills match, experience relevance,
                    and cultural fit.
                  </p>
                </div>
                <DocumentTextIcon className="w-6 h-6 text-white/80" />
              </div>

              <div className="bg-white/20 rounded-lg p-3">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=28&h=28&fit=crop&crop=face"
                    alt="Sarah Johnson"
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium">Sarah Johnson</div>
                    <div className="text-xs text-white/70">Senior Developer</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Skills Match</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Experience</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Q&A Evaluation */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-text">Q&A Evaluation</h3>
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-muted-text mb-4 text-sm">
                Comprehensive assessment of candidate responses with detailed scoring across
                multiple dimensions.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">89%</div>
                  <div className="text-xs text-muted-text">Technical Knowledge</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">85%</div>
                  <div className="text-xs text-muted-text">Communication</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">92%</div>
                  <div className="text-xs text-muted-text">Problem Solving</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">78%</div>
                  <div className="text-xs text-muted-text">Cultural Fit</div>
                </div>
              </div>
            </div>

            {/* Automated Ranking */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-text">Automated Ranking</h3>
              <p className="text-muted-text mb-4 text-sm">
                Get instant candidate rankings based on resume analysis and Q&A performance with
                detailed insights.
              </p>

              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Sarah Johnson</div>
                    <div className="text-xs text-muted-text">Overall Score: 89%</div>
                  </div>
                  <div className="text-sm font-bold text-green-600">Top Match</div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Mike Chen</div>
                    <div className="text-xs text-muted-text">Overall Score: 85%</div>
                  </div>
                  <div className="text-sm font-bold text-blue-600">Strong</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

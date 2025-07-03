import Image from 'next/image';
import { SparklesIcon, StarIcon } from '@heroicons/react/24/outline';
import Container from '@/components/ui/Container';

export default function WhyChooseSection() {
  return (
    <section className="relative z-10 py-16 bg-surface/50">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-5 text-text">Why Choose Intervio?</h2>
            <p className="text-lg text-muted-text mb-6">
              Our platform has been helping reduce hiring time by up to 40% while
              increasing hiring accuracy, improving team productivity by 30%, and providing
              comprehensive candidate evaluation tools.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-primary mb-1">100%</div>
                <div className="text-xs text-muted-text">More Efficient</div>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 mb-1">Up to 40%</div>
                <div className="text-xs text-muted-text">Reduced Hiring Time</div>
              </div>
              <div className="bg-green-500/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-green-600 mb-1">30%</div>
                <div className="text-xs text-muted-text">Workplace Accuracy</div>
              </div>
              <div className="bg-teal-500/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-teal-600 mb-1">20%</div>
                <div className="text-xs text-muted-text">Abandoned Chat</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {/* AI-Driven Assessments */}
            <div className="bg-primary rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI-Driven Assessments</h3>
                  <p className="text-primary-light text-sm">
                    Leverage cutting-edge AI to evaluate candidates through
                    dynamic, skills, body language, and education by
                    analyzing you spoken behavior hiring decisions.
                  </p>
                </div>
                <SparklesIcon className="w-6 h-6 text-white/80" />
              </div>
              
              <div className="bg-white/20 rounded-lg p-3">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=28&h=28&fit=crop&crop=face"
                    alt="Jane Doe"
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium">Jane Doe</div>
                    <div className="text-xs text-white/70">Full Stack Developer</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Technical Skills</span>
                    <span>89%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{width: '89%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Behavioral Analysis */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-text">Behavioral Analysis</h3>
              <p className="text-muted-text mb-4 text-sm">
                Analyze soft-skills patterns such as voice pitch,
                tone, body language, and critical-fit
                analysis for you teams hiring decisions.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">85%</div>
                  <div className="text-xs text-muted-text">Communication</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">78%</div>
                  <div className="text-xs text-muted-text">Cultural Fit</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">92%</div>
                  <div className="text-xs text-muted-text">Problem Solving</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">86%</div>
                  <div className="text-xs text-muted-text">Leadership</div>
                </div>
              </div>
            </div>

            {/* Real-Time Feedback */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-text">Real-Time Feedback</h3>
              <p className="text-muted-text mb-4 text-sm">
                Get instant AI-generated feedback during
                the interviews, adaptive insights to
                specific job requirements and real-time
                interviewing analytical recommendations.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face"
                    alt="System Administrator"
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">System Administrator</div>
                    <div className="text-xs text-muted-text">Strong technical foundation</div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-2 h-2 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
} 
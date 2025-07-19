import Image from 'next/image';
import Container from '@/components/ui/Container';

const steps = [
  {
    text: 'Describe your ideal candidate and job requirements.',
    svg: '/illustrations/resume_finder.svg',
  },
  {
    text: 'Share a uniquee interview link with applicants.',
    svg: '/illustrations/candidate_selection.svg',
  },
  {
    text: 'AI evaluates responses and ranks candidates for you.',
    svg: '/illustrations/evaluation.svg',
  },
  {
    text: 'Get a ranked shortlist and hire faster.',
    svg: '/illustrations/success.svg',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-16 bg-white">
      <Container>
        <div className="text-center mb-12 fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-text">How It Works</h2>
        </div>
        {/* Stepper */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-0 relative">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 z-0"
            style={{ transform: 'translateY(-50%)' }}
          ></div>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative z-10 flex-1 flex flex-col items-center text-center md:px-4 fade-in"
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              {/* Numbered circle */}
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-bold text-lg shadow-md mb-3 border-4 border-primary/20">
                {idx + 1}
              </div>
              {/* SVG illustration */}
              <div className="w-20 h-20 mb-3 flex items-center justify-center">
                <Image
                  src={step.svg}
                  alt={step.text}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              {/* Single concise sentence */}
              <p className="text-sm text-muted-text leading-snug max-w-[160px] mx-auto">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

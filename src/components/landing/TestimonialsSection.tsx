import Image from 'next/image';
import Container from '@/components/ui/Container';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Manager",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b1ac?w=48&h=48&fit=crop&crop=face",
      text: "Intervio has made it easy for me to access high-quality interview data, saving me significant time that I used to spend on manual evaluations.",
      featured: true
    },
    {
      name: "Emily Collins",
      role: "Talent Acquisition Lead",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face",
      text: "This app is fantastic! User interviews and streamlined by algorithms have been extremely helpful."
    },
    {
      name: "Jessica Lee",
      role: "Recruitment Specialist",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face",
      text: "I like the results of the algorithm-based interviews and optimization of the hiring process."
    },
    {
      name: "Michael Anderson",
      role: "Startup Founder",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face",
      text: "Great app for company and recruitment needs. The AI insights are remarkably helpful for saving time."
    },
    {
      name: "Laura Alexander",
      role: "Project Manager",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=48&h=48&fit=crop&crop=face",
      text: "This app is a remarkable change in technology landscape and I hope this will improve my team productivity."
    }
  ];

  return (
    <section id="testimonials" className="relative z-10 py-16 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-text">
            More than 1,000 Users<br />
            Testimony This Product
          </h2>
          <p className="text-lg text-muted-text max-w-3xl mx-auto">
            Let our team tell you how they admire about their experience in
            using Intervio as their human consultation platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className={`rounded-2xl p-6 ${
                testimonial.featured 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-gray-200'
              }`}
            >
              <p className={`mb-5 leading-relaxed ${
                testimonial.featured ? 'text-white' : 'text-text'
              }`}>
                "{testimonial.text}"
              </p>
              <div className="flex items-center space-x-3">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className={`font-semibold ${
                    testimonial.featured ? 'text-white' : 'text-text'
                  }`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-sm ${
                    testimonial.featured ? 'text-primary-light' : 'text-muted-text'
                  }`}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
} 
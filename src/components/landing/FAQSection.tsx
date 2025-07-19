import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Container from '@/components/ui/Container';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'pricing' | 'integration';
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'general' | 'technical' | 'pricing' | 'integration'
  >('all');

  const faqItems: FAQItem[] = [
    // General Questions
    {
      question: 'How does the AI resume analysis work?',
      answer:
        'Our AI analyzes resumes by extracting key information like skills, experience, education, and achievements. It then compares this data against your job requirements to provide a comprehensive match score and detailed insights.',
      category: 'general',
    },
    {
      question: 'What types of Q&A assessments do you support?',
      answer:
        'We support various assessment types including technical questions, behavioral questions, situational scenarios, and custom questions. You can create assessments tailored to specific roles and requirements.',
      category: 'general',
    },
    {
      question: 'How accurate is the AI evaluation?',
      answer:
        'Our AI achieves 95%+ accuracy in resume analysis and Q&A evaluation. The system continuously learns and improves based on feedback and new data to maintain high accuracy standards.',
      category: 'general',
    },
    {
      question: 'Can I customize the evaluation criteria?',
      answer:
        'Yes, you can customize evaluation criteria based on your specific job requirements, company culture, and hiring preferences. This ensures the AI aligns with your unique hiring standards.',
      category: 'general',
    },
    {
      question: 'How long does it take to get evaluation results?',
      answer:
        "Resume analysis typically takes 2-3 minutes, while Q&A assessments are evaluated immediately upon completion. You'll receive detailed reports with scores, insights, and recommendations.",
      category: 'general',
    },

    // Technical Questions
    {
      question: 'What file formats are supported for resume uploads?',
      answer:
        'We support PDF, DOC, DOCX, and TXT formats for resume uploads. The system automatically extracts and processes text content while maintaining formatting where possible.',
      category: 'technical',
    },
    {
      question: 'How secure is candidate data?',
      answer:
        'We implement enterprise-grade security measures including data encryption, secure data centers, and compliance with GDPR and other privacy regulations. Candidate data is protected throughout the entire process.',
      category: 'technical',
    },
    {
      question: 'Can the AI handle multiple languages?',
      answer:
        'Yes, our AI supports multiple languages for both resume analysis and Q&A evaluation. The system can process resumes and assessments in various languages while maintaining accuracy.',
      category: 'technical',
    },
    {
      question: 'What happens if the AI encounters unclear resume content?',
      answer:
        'When the AI encounters unclear content, it flags these areas for human review and provides confidence scores. This ensures no qualified candidates are missed due to formatting issues.',
      category: 'technical',
    },
    {
      question: 'How does the ranking algorithm work?',
      answer:
        'Our ranking algorithm combines resume analysis scores with Q&A performance, weighted by your custom criteria. It considers skills match, experience relevance, communication quality, and cultural fit.',
      category: 'technical',
    },

    // Pricing Questions
    {
      question: "What's included in the free trial?",
      answer:
        'The free trial includes 10 resume evaluations and 10 Q&A assessments, full access to all features, and 14 days to test the platform. No credit card required to get started.',
      category: 'pricing',
    },
    {
      question: 'Can I upgrade or downgrade my plan anytime?',
      answer:
        'Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades apply at your next billing cycle. No penalties or fees for plan changes.',
      category: 'pricing',
    },
    {
      question: 'What happens if I exceed my monthly evaluation limit?',
      answer:
        "You'll receive notifications as you approach your limit. You can purchase additional evaluations or upgrade your plan. Unused evaluations don't roll over to the next month.",
      category: 'pricing',
    },
    {
      question: 'Do you offer volume discounts?',
      answer:
        'Yes, we offer volume discounts for Enterprise plans and large organizations. Contact our sales team for custom pricing based on your specific needs and usage requirements.',
      category: 'pricing',
    },
    {
      question: 'Are there any hidden fees?',
      answer:
        "No hidden fees. You only pay the advertised subscription price. All features listed in your plan are included, and we're transparent about any additional costs.",
      category: 'pricing',
    },

    // Integration Questions
    {
      question: 'Can I integrate with my existing ATS?',
      answer:
        'Yes, we integrate with most major ATS platforms including Workday, BambooHR, Greenhouse, and others. Our Professional and Enterprise plans include pre-built integrations.',
      category: 'integration',
    },
    {
      question: 'Do you provide API access?',
      answer:
        'Yes, our Professional and Enterprise plans include API access for custom integrations. You can automate candidate data import/export and build custom workflows.',
      category: 'integration',
    },
    {
      question: 'Can I export evaluation results?',
      answer:
        'Yes, you can export evaluation results in multiple formats including PDF, CSV, and JSON. This makes it easy to share insights with your team or import into other systems.',
      category: 'integration',
    },
    {
      question: 'How do team collaboration features work?',
      answer:
        'Team features include shared candidate lists, collaborative evaluation, comments and notes, and role-based permissions. Multiple team members can work on the same hiring process.',
      category: 'integration',
    },
    {
      question: 'Can I customize the branding?',
      answer:
        'Yes, Professional and Enterprise plans include custom branding options. You can add your company logo, colors, and customize the candidate experience to match your brand.',
      category: 'integration',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'general', name: 'General' },
    { id: 'technical', name: 'Technical' },
    { id: 'pricing', name: 'Pricing' },
    { id: 'integration', name: 'Integration' },
  ];

  const filteredItems =
    activeCategory === 'all'
      ? faqItems
      : faqItems.filter((item) => item.category === activeCategory);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <section id="faq" className="relative z-10 py-16 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-text">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-text max-w-3xl mx-auto">
            Get answers to common questions about our AI-powered resume analysis and Q&A evaluation
            platform.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 pr-4">{item.question}</h3>
                  {openItems.includes(index) ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openItems.includes(index) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions? We&apos;re here to help!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors">
              Contact Support
            </button>
            <button className="border border-primary text-primary px-6 py-3 rounded-full font-semibold hover:bg-primary/10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

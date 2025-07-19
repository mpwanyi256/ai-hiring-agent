'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSubscriptionPlans } from '@/store/billing/billingThunks';
import { selectSubscriptionPlans, selectCurrentPlan } from '@/store/billing/billingSelectors';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import SubscriptionCard from '@/components/billing/SubscriptionCard';

export default function PricingPage() {
  const dispatch = useAppDispatch();
  const plans = useAppSelector(selectSubscriptionPlans);
  const currentPlan = useAppSelector(selectCurrentPlan);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  const getPrice = (plan: any) => {
    if (plan.name.toLowerCase() === 'enterprise') {
      return 'Custom';
    }
    const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
    return `$${price}`;
  };

  const getSavings = (plan: any) => {
    if (plan.name.toLowerCase() === 'enterprise') return null;
    const monthlyCost = plan.price_monthly * 12;
    const yearlyCost = plan.price_yearly;
    const savings = monthlyCost - yearlyCost;
    return Math.round((savings / monthlyCost) * 100);
  };

  // Don't render until plans are loaded
  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-background text-text">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-surface"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
          }}
        ></div>
      </div>

      <Navigation />

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Choose the Perfect Plan for&nbsp;
              <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                Your Hiring Needs
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Scale your hiring process with our flexible pricing plans. All plans include our core
              AI resume analysis and Q&A evaluation features with varying levels of customization
              and support.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-16 bg-gray-50 p-2 rounded-full max-w-fit mx-auto">
              <span
                className={`font-medium px-4 py-2 ${billingPeriod === 'monthly' ? 'text-primary' : 'text-gray-500'}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`font-medium px-4 py-2 ${billingPeriod === 'yearly' ? 'text-primary' : 'text-gray-500'}`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Save up to 20%
                </span>
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 pb-16">
        <Container>
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                billingPeriod={billingPeriod}
                isRecommended={plan.name.toLowerCase() === 'pro'}
                isCurrentPlan={currentPlan?.id === plan.id}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Got questions? We have answers. Here are some of the most common questions about our
              pricing and AI evaluation platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                question: 'Can I change my plan at any time?',
                answer:
                  'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
              },
              {
                question: 'What happens if I exceed my evaluation limit?',
                answer:
                  "You'll receive notifications as you approach your limit. You can purchase additional evaluations or upgrade your plan.",
              },
              {
                question: 'Is there a free trial available?',
                answer:
                  'Yes, all plans come with a 30-day free trial. No credit card required to get started with resume analysis and Q&A evaluation.',
              },
              {
                question: 'Do you offer custom enterprise solutions?',
                answer:
                  'Absolutely! Our Enterprise plan can be customized to meet your specific needs. Contact our sales team for details.',
              },
              {
                question: 'How accurate is the AI evaluation?',
                answer:
                  'Our AI achieves 95%+ accuracy in resume analysis and Q&A evaluation, with continuous improvements based on feedback.',
              },
              {
                question: 'Can I integrate with my existing ATS?',
                answer:
                  'Yes, our Professional and Enterprise plans include ATS integrations. We support most major ATS platforms.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Hiring Process?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of companies using AI to make better hiring decisions. Start your free
              trial today.
            </p>
            <Button size="lg" className="text-lg px-8 py-4">
              Get Started Free
            </Button>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

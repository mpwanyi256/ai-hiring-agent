'use client';

import { useState } from 'react';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/landing/Footer';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const pricingPlans = [
    {
      name: 'Starter',
      description: 'Perfect for small teams getting started with AI interviews',
      monthlyPrice: 29,
      yearlyPrice: 290,
      interviews: 50,
      features: [
        'Up to 50 AI interviews per month',
        'Basic candidate assessment',
        'Email support',
        'Standard interview templates',
        'Basic analytics dashboard',
        '48-hour response time',
      ],
      limitations: ['No custom branding', 'No API access', 'No advanced integrations'],
      recommended: false,
      buttonText: 'Start Free Trial',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Professional',
      description: 'Ideal for growing companies with regular hiring needs',
      monthlyPrice: 79,
      yearlyPrice: 790,
      interviews: 200,
      features: [
        'Up to 200 AI interviews per month',
        'Advanced candidate assessment',
        'Priority email & chat support',
        'Custom interview templates',
        'Advanced analytics & reporting',
        'Team collaboration tools',
        'Custom branding options',
        '24-hour response time',
        'Behavioral analysis',
        'Integration with ATS systems',
      ],
      limitations: ['No white-label solution', 'Limited API calls'],
      recommended: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary' as const,
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with complex hiring requirements',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      interviews: 'Unlimited',
      features: [
        'Unlimited AI interviews',
        'Advanced AI-driven assessments',
        'Dedicated account manager',
        'Custom interview workflows',
        'Enterprise analytics suite',
        'Advanced team management',
        'White-label solution',
        'Priority phone support',
        'Advanced behavioral analysis',
        'Full API access',
        'Custom integrations',
        'SAML/SSO authentication',
        'Advanced security compliance',
        'Custom reporting',
        '2-hour response time',
      ],
      limitations: [],
      recommended: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
    },
  ];

  const getPrice = (plan: (typeof pricingPlans)[0]) => {
    if (plan.name === 'Enterprise') {
      return 'Custom';
    }
    const price =
      billingPeriod === 'monthly' ? plan.monthlyPrice : Math.floor(plan.yearlyPrice / 12);
    return `$${price}`;
  };

  const getSavings = (plan: (typeof pricingPlans)[0]) => {
    if (plan.name === 'Enterprise') return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

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
              AI interview features with varying levels of customization and support.
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
                  Save up to 25%
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
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105 ${
                  plan.recommended
                    ? 'bg-primary text-white shadow-2xl ring-2 ring-primary/20'
                    : 'bg-white border border-gray-200 hover:border-primary/20 shadow-lg hover:shadow-xl'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white text-primary px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3
                    className={`text-2xl font-bold mb-2 ${plan.recommended ? 'text-white' : 'text-gray-900'}`}
                  >
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.recommended ? 'text-green-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div
                    className={`text-4xl font-bold mb-2 ${plan.recommended ? 'text-white' : 'text-gray-900'}`}
                  >
                    {getPrice(plan)}
                    {plan.name !== 'Enterprise' && (
                      <span
                        className={`text-lg font-normal ${plan.recommended ? 'text-green-100' : 'text-gray-500'}`}
                      >
                        /month
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && getSavings(plan) && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {getSavings(plan)}% annually
                    </div>
                  )}
                  <div
                    className={`text-sm ${plan.recommended ? 'text-green-100' : 'text-gray-500'}`}
                  >
                    {typeof plan.interviews === 'number'
                      ? `${plan.interviews} interviews included`
                      : 'Unlimited interviews'}
                  </div>
                </div>

                <div className="mb-8">
                  <Button
                    className={`w-full py-3 font-semibold rounded-full transition-all ${
                      plan.buttonVariant === 'primary'
                        ? 'bg-white text-primary hover:bg-gray-100'
                        : plan.recommended
                          ? 'border-2 border-white text-white hover:bg-white/10'
                          : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4
                    className={`font-semibold ${plan.recommended ? 'text-white' : 'text-gray-900'}`}
                  >
                    What&apos;s included:
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        {/* Icon removed for linting compliance */}
                        <span
                          className={`text-sm ${plan.recommended ? 'text-green-100' : 'text-gray-600'}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <>
                      <h4
                        className={`font-semibold mt-6 ${plan.recommended ? 'text-white' : 'text-gray-900'}`}
                      >
                        Not included:
                      </h4>
                      <ul className="space-y-3">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start space-x-3">
                            {/* Icon removed for linting compliance */}
                            <span
                              className={`text-sm ${plan.recommended ? 'text-red-100' : 'text-gray-600'}`}
                            >
                              {limitation}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
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
              pricing.
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
                question: 'What happens if I exceed my interview limit?',
                answer:
                  "You'll receive notifications as you approach your limit. You can purchase additional interviews or upgrade your plan.",
              },
              {
                question: 'Is there a free trial available?',
                answer:
                  'Yes, all plans come with a 14-day free trial. No credit card required to get started.',
              },
              {
                question: 'Do you offer custom enterprise solutions?',
                answer:
                  'Absolutely! Our Enterprise plan can be customized to meet your specific needs. Contact our sales team for details.',
              },
              {
                question: 'What kind of support do you provide?',
                answer:
                  'Support varies by plan - from email support on Starter to dedicated account managers on Enterprise.',
              },
              {
                question: 'Are there any setup fees?',
                answer:
                  'No setup fees for any of our plans. You only pay the monthly or annual subscription fee.',
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
          <div className="bg-gradient-to-r from-primary to-green-600 rounded-3xl p-12 text-center text-white">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Hiring Process?
              </h2>
              <p className="text-xl text-green-100 mb-8">
                Join thousands of companies already using Intervio to make better hiring decisions
                faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 rounded-full">
                  Start Free Trial
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-full"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}

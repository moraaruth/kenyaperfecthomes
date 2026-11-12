import React from 'react';
import { Home, Users, ShieldCheck } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: Home,
      title: 'Listings You Can Trust',
      description:
        'Each listing includes the details you need to compare homes, including price, size, location and key features.',
    },
    {
      icon: Users,
      title: 'Helpful Support',
      description:
        'Our team answers your questions and helps you arrange viewings, from first enquiry to final steps.',
    },
    {
      icon: ShieldCheck,
      title: 'Straightforward Process',
      description:
        'We keep communication clear and give you direct contact options, so you always know what happens next.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Heading (Screenshot #6 & #7: "Why Choose Perfect Homes?") */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-900 tracking-tight mb-4">
            Why Choose Perfect Homes?
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
            We help people buy, sell and rent homes and commercial spaces across Kenya, with clear information at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  {feat.title}
                </h3>

                <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

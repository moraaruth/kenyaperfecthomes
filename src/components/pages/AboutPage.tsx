import React from 'react';
import { WhyChooseUs } from '../sections/WhyChooseUs';
import { CtaBanner } from '../sections/CtaBanner';
import { StatsStrip } from '../sections/StatsStrip';
import { Award, HeartHandshake, ShieldCheck } from 'lucide-react';

interface AboutPageProps {
  onBrowseProperties: () => void;
  onContactUs: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBrowseProperties, onContactUs }) => {
  return (
    <div className="bg-neutral-50/60 pb-20">
      <section className="bg-brand-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            About Perfect Homes
          </h1>
          <p className="text-lg sm:text-xl text-neutral-200 max-w-2xl mx-auto leading-relaxed">
            We help people find homes, apartments and commercial spaces to buy or rent across Kenya.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-900 tracking-tight mb-6">
          Our Mission
        </h2>
        <p className="text-base sm:text-lg text-neutral-700 leading-relaxed max-w-3xl mx-auto">
          To make finding a property in Kenya simpler, with clear listings and direct contact with the people who can help.
        </p>
      </section>

      <StatsStrip />

      <WhyChooseUs />

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-neutral-200">
          <div className="max-w-3xl mb-12">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-3">
              How We Work
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              We list properties with accurate details and respond to enquiries directly. Before you commit to any property, we recommend checking ownership and title documents with a qualified lawyer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-neutral-900">Clear Listings</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Each listing shows price, size, location and key features so you can compare options easily.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-neutral-900">Locations</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We list homes in areas including Westlands, Karen, Kilimani, Lavington, Riverside and Kileleshwa.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-neutral-900">Viewings</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Book a viewing from any listing and our team will confirm the time with you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        onBrowseProperties={onBrowseProperties}
        onContactUs={onContactUs}
      />
    </div>
  );
};

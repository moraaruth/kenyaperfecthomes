import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

interface CtaBannerProps {
  onBrowseProperties: () => void;
  onContactUs: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onBrowseProperties, onContactUs }) => {
  return (
    <section className="bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 text-white py-16 sm:py-20 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-700/20 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
          Ready to Find Your Perfect Home?
        </h2>

        <p className="text-base sm:text-lg text-neutral-200 max-w-2xl mx-auto leading-relaxed">
          Join thousands of satisfied customers who found their dream properties with us. Start your discovery today or consult our dedicated Nairobi agents.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onBrowseProperties}
            className="w-full sm:w-auto bg-white hover:bg-neutral-100 text-brand-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-102 flex items-center justify-center gap-2"
          >
            <span>Browse Properties</span>
            <ArrowRight className="w-4 h-4 text-brand-800" />
          </button>

          <button
            onClick={onContactUs}
            className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white font-bold px-8 py-3.5 rounded-xl border-2 border-white/80 transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-amber-300" />
            <span>Contact Us</span>
          </button>
        </div>
      </div>
    </section>
  );
};

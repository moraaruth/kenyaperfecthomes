import React from 'react';
import { Home, Users, Handshake, Star } from 'lucide-react';

export const StatsStrip: React.FC = () => {
  const stats = [
    {
      icon: Home,
      value: '500+',
      label: 'Properties Listed',
      description: 'Verified residential & commercial listings',
    },
    {
      icon: Users,
      value: '1000+',
      label: 'Happy Clients',
      description: 'Homebuyers, tenants & investors',
    },
    {
      icon: Handshake,
      value: '200+',
      label: 'Successful Deals',
      description: 'Completed property acquisitions in Kenya',
    },
    {
      icon: Star,
      value: '4.9/5',
      label: 'Customer Rating',
      description: 'Based on verified client feedback',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-40">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-neutral-200/90 shadow-md hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {item.value}
              </span>
              <span className="text-sm font-bold text-brand-900 mt-1">
                {item.label}
              </span>
              <span className="text-xs text-neutral-500 mt-1 hidden sm:block">
                {item.description}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

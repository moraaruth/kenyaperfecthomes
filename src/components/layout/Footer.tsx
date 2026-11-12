import React from 'react';
import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-brand-950 text-white relative overflow-hidden border-t-4 border-amber-400/40">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-800/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-brand-800/60">
          
          {/* Column 1: Brand & Mission (Screenshot #4) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white ring-1 ring-amber-300/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-200">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">Perfect Homes</span>
                <span className="block text-[10px] text-amber-200/80 font-medium tracking-widest uppercase">Verified Kenyan Properties</span>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed max-w-md">
              Your trusted partner in finding the perfect home. We connect property seekers with their dream homes across Kenya with professional service, transparent guidance, and verified title deed expertise.
            </p>

            {/* Social Icons row (Screenshot #4) */}
            <div className="flex items-center gap-3 pt-2">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/14NMtbUgq4a/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-brand-900 hover:bg-brand-700 flex items-center justify-center text-white transition-colors border border-brand-700/50"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-brand-900 hover:bg-brand-700 flex items-center justify-center text-white transition-colors border border-brand-700/50"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/message/3PCINZDAGWVIH1"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors border border-emerald-500/50"
                aria-label="WhatsApp Direct Support"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/kenya_perfect_homes?igsh=dG9wZWF3NnF1ajZj&utm_source=qr"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-brand-900 hover:bg-brand-700 flex items-center justify-center text-white transition-colors border border-brand-700/50"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@perfecthomes_1?_t=ZM-90dzr7MlxZA&_r=1"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-brand-900 hover:bg-brand-700 flex items-center justify-center text-white transition-colors border border-brand-700/50"
                aria-label="TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (Screenshot #4) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold tracking-wider uppercase text-amber-200">Quick Links</h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('properties')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  <span>Properties</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('book')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  <span>Book For View</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  <span>Contact Us</span>
                </button>
              </li>
            
            </ul>
          </div>

          {/* Column 3: Contact Info (Screenshot #4) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold tracking-wider uppercase text-amber-200">Contact Info</h4>
            <div className="space-y-3 text-sm text-neutral-300">
              <a
                href="tel:+254701029158"
                className="flex items-start gap-3 hover:text-amber-300 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-900 border border-brand-700 flex items-center justify-center shrink-0 group-hover:bg-brand-700">
                  <Phone className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="block text-xs text-neutral-400">Direct Agent Line</span>
                  <span className="font-semibold text-white">0701029158 / +254 701 029 158</span>
                </div>
              </a>

              <a
                href="mailto:phomeskenya@gmail.com"
                className="flex items-start gap-3 hover:text-amber-300 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-900 border border-brand-700 flex items-center justify-center shrink-0 group-hover:bg-brand-700">
                  <Mail className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="block text-xs text-neutral-400">Email Inquiries</span>
                  <span className="font-semibold text-white">phomeskenya@gmail.com</span>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-900 border border-brand-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="block text-xs text-neutral-400">Head Office</span>
                  <span className="font-semibold text-white">Westlands, Nairobi, Kenya</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar (Screenshot #4) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© 2026 Perfect Homes Kenya. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Verified Title Deeds</span>
            <span>·</span>
           
            <span>Licensed Real Estate Agency</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

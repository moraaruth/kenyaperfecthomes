import React, { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle2, Send, MessageCircle } from 'lucide-react';
import { submitContact } from '../../lib/propertyStore';
import { generateWhatsAppLink } from '../../lib/formatters';

export const ContactPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState('');

  const whatsappUrl = generateWhatsAppLink();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !comments) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitContact({
        firstName,
        lastName,
        email,
        comments,
      });
      setMsg(res.message);
      setSubmitted(true);
    } catch {
      alert('Failed to send message. Please try again or reach out on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Page Header (Screenshot #10: "Contact Us") */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">

          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-900 tracking-tight">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Get in touch with us for any inquiries about properties or our services. We're here to help you find your perfect home.
          </p>
        </div>

        {/* 2-Column Layout (Screenshot #10: Left info, Right form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Get in Touch (Screenshot #10) */}
          <div className="lg:col-span-5 bg-white p-8 sm:p-10 rounded-2xl border border-neutral-200/90 shadow-sm space-y-8">
            <h2 className="text-2xl font-extrabold text-brand-900 tracking-tight">
              Get in Touch
            </h2>

            <div className="space-y-6">
              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0 border border-brand-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Location</h3>
                  <p className="text-sm font-bold text-neutral-900 mt-0.5">Westlands, Nairobi, Kenya</p>

                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0 border border-brand-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Phone Number</h3>
                  <a href="tel:+254701029158" className="text-sm font-bold text-brand-800 hover:underline block mt-0.5">
                    +254 701 029 158 / 0701029158
                  </a>
                  <p className="text-xs text-neutral-500">Mon - Sat: 8:00 AM - 6:00 PM</p>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0 border border-brand-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Email Address</h3>
                  <a href="mailto:phomeskenya@gmail.com" className="text-sm font-bold text-brand-800 hover:underline block mt-0.5">
                    phomeskenya@gmail.com
                  </a>
                  <p className="text-xs text-neutral-500">Direct response within 2 business hours</p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-200" />
                <span>Instant WhatsApp Concierge</span>
              </span>
              <p className="text-xs text-emerald-800">
                Prefer immediate messaging? Chat directly with an active real estate agent right now.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-lg transition-colors"
              >
                <span>Launch WhatsApp Chat</span>
              </a>
            </div>

            {/* Follow us on social media (Screenshot #10) */}
            <div className="pt-2 border-t border-neutral-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                Follow us on:
              </h4>
              <div className="flex items-center gap-2.5">
                {['Facebook', 'WhatsApp', 'Instagram', 'TikTok', 'YouTube'].map((network) => (
                  <div
                    key={network}
                    className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-xs font-bold hover:bg-brand-800 hover:text-white transition-colors cursor-pointer"
                    title={network}
                  >
                    {network[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Form (Screenshot #10) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-neutral-200/90 shadow-lg">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900">Message Delivered!</h3>
                <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                  {msg}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setComments('');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-brand-800 text-white font-semibold text-xs hover:bg-brand-900 transition-colors shadow-xs"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* First Name & Last Name (Screenshot #10) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Email Address (Screenshot #10) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                  />
                </div>

                {/* Comments Textarea (Screenshot #10) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                    Comments
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter your message or comments..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400 resize-none"
                  />
                </div>

                {/* Send Message Button (Screenshot #10: Purple button) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-70 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

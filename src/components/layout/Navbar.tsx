import React, { useState } from 'react';
import { Home, Search, Calendar, Phone, PlusCircle, Bell, Heart, Menu, X, Shield, ShieldCheck, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { AdminUser, canManageProperties } from '../../lib/authClient';
import logo from '../../assets/images/logo.jpg';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  savedCount: number;
  adminUser?: AdminUser | null;
  onSignOut?: () => void;
  /** Floats the navbar transparently over the hero image (home page). */
  transparent?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  savedCount,
  adminUser,
  onSignOut,
  transparent = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Single source of truth: authenticated AND on the two-email admin allowlist.
  // Never rely on adminUser alone, since it only proves a session exists.
  const isAuthorizedAdmin = canManageProperties(adminUser);

  const baseNavLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'about', label: 'About Us', icon: null },
    { id: 'properties', label: 'Properties', icon: Search },
    { id: 'book', label: 'Book For View', icon: Calendar },
    { id: 'contact', label: 'Contact Us', icon: Phone },
  ];

  // ONLY include "Add Property" in navigation links when logged in as an authorized administrator
  const navLinks = isAuthorizedAdmin
    ? [...baseNavLinks, { id: 'add-property', label: 'Add Property', icon: PlusCircle }]
    : baseNavLinks;

  // User avatar initial: R for Ruth Moraa or J for Josiah or A for Admin
  const avatarLetter = isAuthorizedAdmin && adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'P';

  return (
    <header
      className={`z-50 transition-all ${
        transparent
          ? 'absolute top-0 left-0 right-0 bg-transparent border-b border-transparent'
          : 'sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* ZONE 1: BRAND LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 rounded-lg p-1"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden shadow-md shadow-brand-900/10 group-hover:scale-105 transition-transform">
                <img src={logo} alt="Perfect Homes logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xl font-bold tracking-tight transition-colors ${
                    transparent
                      ? 'text-white group-hover:text-slate-200'
                      : 'text-neutral-900 group-hover:text-brand-800'
                  }`}
                >
                  Perfect Homes
                </span>
                <span
                  className={`text-[11px] font-medium tracking-wider uppercase -mt-0.5 ${
                    transparent ? 'text-slate-200' : 'text-brand-700'
                  }`}
                >
                  Kenya Real Estate
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    transparent
                      ? isActive
                        ? 'bg-purple-700 text-white rounded-md px-3 py-1.5 shadow-sm'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                      : isActive
                      ? 'bg-brand-800 text-white shadow-sm'
                      : 'text-neutral-700 hover:text-brand-800 hover:bg-neutral-100/70'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Admin Portal Nav Tab (authorized administrators only) */}
            {isAuthorizedAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  currentTab === 'admin'
                    ? 'bg-neutral-900 text-amber-300 border-neutral-900 shadow-sm'
                    : 'bg-amber-50 text-brand-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>

          {/* ZONE 3: ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Add Property Button (Exclusively visible when authenticated as admin) */}
           

            {/* Notification Bell */}
            {/* <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                title="Notifications"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
                  transparent
                    ? 'text-white hover:bg-white/10'
                    : 'text-neutral-600 hover:text-brand-900 hover:bg-neutral-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span
                  className={`absolute top-2 right-2 w-2 h-2 bg-brand-600 rounded-full ring-2 ${
                    transparent ? 'ring-transparent' : 'ring-white'
                  }`}
                ></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 py-3 px-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Viewing Alerts</h4>
                    <span className="text-[10px] text-brand-700 bg-brand-50 font-semibold px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-100 flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-neutral-900">Westlands Office Open</p>
                        <p className="text-neutral-500 text-[11px]">Private site inspections are available today across Muthithi Rd and Parklands.</p>
                      </div>
                    </div>
                    <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-100 flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-neutral-900">New Karen Villa Listed</p>
                        <p className="text-neutral-500 text-[11px]">4-bedroom luxury villa on 0.5 acre just added to sale listings.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div> */}

            {/* User Avatar Circle "R" with Dropdown Menu (Screenshot #2) */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className={`w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center transition-all shadow-xs ${
                  isAuthorizedAdmin
                    ? 'bg-brand-900 ring-2 ring-amber-400'
                    : 'bg-brand-800 ring-2 ring-brand-200 hover:ring-brand-500'
                }`}
                title={isAuthorizedAdmin && adminUser ? `Signed in as ${adminUser.name}` : 'Account Menu'}
              >
                {avatarLetter}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {isAuthorizedAdmin && adminUser ? (
                    <div className="px-4 py-2.5 border-b border-neutral-100 bg-neutral-50/50">
                    
                      <p className="text-sm font-bold text-neutral-900 truncate mt-0.5">{adminUser.name}</p>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">{adminUser.email}</p>
                    </div>
                  ) : (
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs text-neutral-500">Perfect Homes Kenya</p>
                      <p className="text-sm font-bold text-neutral-900 truncate">Visitor</p>
                      <p className="text-[11px] text-brand-700">phomeskenya@gmail.com</p>
                    </div>
                  )}

                  {isAuthorizedAdmin && (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 hover:text-brand-800 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-700" />
                        Admin Dashboard
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </button>
                  )}

                  {/* Add Property Quick Action (Exclusively for authenticated admins) */}
                  {/* {adminUser && (
                    <button
                      onClick={() => {
                        onNavigate('add-property');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-brand-900 bg-brand-50/60 hover:bg-brand-50 flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4 text-brand-700" />
                      <span>Add Property Listing</span>
                    </button>
                  )} */}

                  <button
                    onClick={() => {
                      onNavigate('saved');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-brand-800 flex items-center justify-between"
                  >
                   
                  </button>

               

                  <div className="border-t border-neutral-100 my-1"></div>

                  <button
                    onClick={() => {
                      alert(
                        isAuthorizedAdmin && adminUser
                          ? `Signed in as Administrator: ${adminUser.name} (${adminUser.email})`
                          : 'You are browsing Perfect Homes Kenya as a guest.'
                      );
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
                  >
                    Your Profile
                  </button>

                  {isAuthorizedAdmin ? (
                    <button
                      onClick={() => {
                        if (onSignOut) onSignOut();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out (Admin)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-brand-700 hover:bg-brand-50 font-bold flex items-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Admin Sign In</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between ${
                  isActive ? 'bg-brand-800 text-white' : 'text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <span>{link.label}</span>
                {link.icon && <link.icon className="w-4 h-4 opacity-70" />}
              </button>
            );
          })}

          {isAuthorizedAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between ${
                currentTab === 'admin'
                  ? 'bg-neutral-900 text-amber-300'
                  : 'bg-amber-50 text-neutral-900 border border-amber-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-700" />
                <span>{`Admin Portal (${adminUser?.name ?? 'Administrator'})`}</span>
              </span>
            </button>
          )}

          {/* <button
            onClick={() => {
              onNavigate('saved');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-neutral-100 flex items-center justify-between"
          >
            <span>Saved Properties ({savedCount})</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </button> */}

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 px-2">
            <span>Call: +254 701 029 158</span>
            <span>Westlands, Nairobi</span>
          </div>
        </div>
      )}
    </header>
  );
};

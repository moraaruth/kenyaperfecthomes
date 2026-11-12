import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle2, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { loginAdmin, AdminUser } from '../../lib/authClient';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminUser) => void;
  onReturnHome: () => void;
  initialMessage?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onReturnHome,
  initialMessage,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<AdminUser | null>(null);

  const handlePerformLogin = async (targetEmail: string, displayName?: string) => {
    setIsAuthenticating(true);
    setErrorMessage(null);

    const result = await loginAdmin(targetEmail, displayName);
    setIsAuthenticating(false);

    if (result.success && result.authorized && result.user) {
      setSuccessUser(result.user);
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 700);
    } else {
      setErrorMessage(
        result.error ||
          `Access Restricted: "${targetEmail}" is not authorized to access the Perfect Homes Admin Portal.`
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-100/70 text-left">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-950 text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-brand-100">
            <Lock className="w-8 h-8 text-amber-300" />
          </div>

          <div>
          
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
              Perfect Homes
            </h1>
            <p className="text-sm font-semibold text-brand-800">
              Admin Portal
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Sign in to manage properties and listings.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Informational Prompt (e.g. redirected from Add Property) */}
          {initialMessage && !errorMessage && !successUser && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{initialMessage}</p>
            </div>
          )}

          {/* Error Banner when non-allowlisted email attempts login */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Access Denied (403 Forbidden)</span>
              </div>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Success Banner */}
          {successUser && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Identity Verified! Redirecting to Administration Dashboard...</span>
            </div>
          )}

          {/* Secure Admin Credentials Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput.trim()) {
                handlePerformLogin(emailInput.trim());
              }
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Administrator Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your authorized admin email..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 font-mono text-neutral-900 placeholder:font-sans placeholder:text-neutral-400 shadow-xs"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                Enter your designated administrative email. Only pre-registered administrator accounts are permitted access.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || !emailInput.trim()}
              className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>{isAuthenticating ? 'Authenticating Identity...' : 'Sign In as Administrator'}</span>
            </button>
          </form>

        
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onReturnHome}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              ← Home
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import {
  loginAdmin,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  canManageProperties,
  AdminUser,
} from '../../lib/authClient';

type AuthMode = 'signin' | 'register' | 'forgot' | 'reset';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminUser) => void;
  onReturnHome: () => void;
  initialMessage?: string;
  resetToken?: string | null;
  onResetComplete?: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  'w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-900 placeholder:text-neutral-400 shadow-xs';
const labelClass = 'block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2';

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onReturnHome,
  initialMessage,
  resetToken,
  onResetComplete,
}) => {
  const [mode, setMode] = useState<AuthMode>(resetToken ? 'reset' : 'signin');
  const [name, setName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<AdminUser | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMessage(null);
    setInfoMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const passwordTooShort = (value: string) => value.length < MIN_PASSWORD_LENGTH;

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    const result = await loginAdmin(emailInput.trim(), password || undefined);
    setIsAuthenticating(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Sign in failed. Please try again.');
      return;
    }
    if (!result.authorized || !canManageProperties(result.user)) {
      setErrorMessage('This account does not have staff access. Please contact an administrator.');
      return;
    }
    setSuccessUser(result.user);
    setTimeout(() => onLoginSuccess(result.user!), 700);
  };

  const handleRegister = async () => {
    if (passwordTooShort(password)) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setIsAuthenticating(true);
    setErrorMessage(null);
    const result = await registerAccount(name.trim(), emailInput.trim(), password);
    setIsAuthenticating(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
      return;
    }
    switchMode('signin');
    setInfoMessage('Your account has been created. An administrator must grant you staff access before you can manage listings.');
  };

  const handleForgot = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    const result = await requestPasswordReset(emailInput.trim());
    setIsAuthenticating(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setInfoMessage(result.message);
  };

  const handleReset = async () => {
    if (!resetToken) {
      setErrorMessage('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (passwordTooShort(password)) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setIsAuthenticating(true);
    setErrorMessage(null);
    const result = await resetPassword(resetToken, password);
    setIsAuthenticating(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setInfoMessage(result.message);
    setPassword('');
    setConfirmPassword('');
    onResetComplete?.();
    setMode('signin');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') handleSignIn();
    else if (mode === 'register') handleRegister();
    else if (mode === 'forgot') handleForgot();
    else handleReset();
  };

  const titles: Record<AuthMode, { heading: string; button: string }> = {
    signin: { heading: 'Sign in to your account', button: 'Sign In' },
    register: { heading: 'Create an account', button: 'Create Account' },
    forgot: { heading: 'Reset your password', button: 'Request Reset' },
    reset: { heading: 'Choose a new password', button: 'Set New Password' },
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

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Unable to continue</span>
              </div>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && !errorMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="leading-relaxed">{infoMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successUser && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Identity Verified! Redirecting to Administration Dashboard...</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm font-bold text-neutral-900">{titles[mode].heading}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className={`${inputClass} font-mono placeholder:font-sans`}
              />
            </div>

            {mode === 'signin' && (
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                  Administrator emails on the approved list can leave this blank.
                </p>
              </div>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <>
                <div>
                  <label className={labelClass}>{mode === 'reset' ? 'New Password' : 'Password'}</label>
                  <input
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-neutral-500 mt-1.5">At least {MIN_PASSWORD_LENGTH} characters.</p>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isAuthenticating || !emailInput.trim() || (mode === 'reset' && !resetToken)}
              className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>{isAuthenticating ? 'Please wait...' : titles[mode].button}</span>
            </button>
          </form>

          <div className="pt-1 flex flex-col items-center gap-2 text-xs font-semibold text-neutral-500">
            {mode === 'signin' && (
              <>
                <button type="button" onClick={() => switchMode('register')} className="hover:text-neutral-800 transition-colors">
                  New here? Create an account
                </button>
                <button type="button" onClick={() => switchMode('forgot')} className="hover:text-neutral-800 transition-colors">
                  Forgot password?
                </button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot') && (
              <button type="button" onClick={() => switchMode('signin')} className="hover:text-neutral-800 transition-colors">
                Back to sign in
              </button>
            )}
            <button type="button" onClick={onReturnHome} className="hover:text-neutral-800 transition-colors">
              ← Home
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

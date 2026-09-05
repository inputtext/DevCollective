import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, Mail } from 'lucide-react';

type LoginView = 'login' | 'forgot-email' | 'forgot-code';

export const LoginPage: React.FC = () => {
  const { setActiveTab, loginWithEmail, triggerOAuthLogin, authRedirectError, clearAuthRedirectError, requestPasswordReset, resetPassword } = useAuth();
  const [view, setView] = useState<LoginView>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetLoading(true);
    try {
      await requestPasswordReset(resetEmail);
      setResetMessage("If an account exists for that email, we've sent a 6-digit code. Check your inbox.");
      setView('forgot-code');
    } catch (err: any) {
      setResetError(err.message || 'Could not send the reset code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetLoading(true);
    try {
      await resetPassword(resetEmail, resetCode, newPassword);
      setResetMessage('Password updated. You can log in now.');
      setTimeout(() => {
        setView('login');
        setEmail(resetEmail);
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setResetMessage(null);
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Could not reset the password.');
    } finally {
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setView('login');
    setResetError(null);
    setResetMessage(null);
  };

  const renderLogin = () => (
    <>
      <header className="mb-8">
        <p className="dc-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">01 / AUTHENTICATION</p>
        <h1 className="dc-display text-5xl sm:text-6xl">ENTER THE<br /><span className="text-primary">COLLECTIVE.</span></h1>
        <p className="mt-5 text-sm leading-relaxed text-on-surface-variant max-w-md">Sign in to continue your learning path, projects, collaborations, and developer progress.</p>
      </header>

      {authRedirectError && (
        <div className="mb-6 p-4 bg-error-container border-2 border-outline-variant flex items-center gap-3 text-on-error text-xs dc-mono">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{authRedirectError}</span>
          <button type="button" onClick={clearAuthRedirectError} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-error-container border-2 border-outline-variant flex items-center gap-3 text-on-error text-xs dc-mono">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="architect@devcollective.edu"
            className="w-full bg-surface border-2 border-outline-variant px-4 py-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-primary/20 transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Password</label>
            <button
              type="button"
              onClick={() => { setResetEmail(email); setResetError(null); setResetMessage(null); setView('forgot-email'); }}
              className="dc-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border-2 border-outline-variant px-4 py-4 pr-12 text-sm text-on-surface focus:outline-none focus:bg-primary/20 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-bold uppercase tracking-wide py-4 px-5 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <span>{loading ? 'AUTHENTICATING...' : 'CONTINUE TO WORKSPACE'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">OR CONTINUE WITH</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => triggerOAuthLogin('google')} className="flex items-center justify-center gap-2 bg-surface border-2 border-outline-variant py-3.5 dc-mono text-[10px] uppercase font-bold hover:bg-dc-yellow transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button type="button" onClick={() => triggerOAuthLogin('github')} className="flex items-center justify-center gap-2 bg-surface border-2 border-outline-variant py-3.5 dc-mono text-[10px] uppercase font-bold hover:bg-dc-mint transition-colors">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" /></svg>
          GitHub
        </button>
      </div>

      <footer className="mt-8 pt-6 border-t-2 border-outline-variant text-center">
        <p className="text-sm text-on-surface-variant">Don't have an account? <button onClick={() => setActiveTab('register')} className="text-primary font-bold uppercase text-xs ml-1 hover:underline">Register Here</button></p>
      </footer>
    </>
  );

  const renderForgotEmail = () => (
    <>
      <button type="button" onClick={backToLogin} className="flex items-center gap-2 dc-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface mb-10"><ArrowLeft className="w-4 h-4" /> Back to Sign In</button>
      <header className="mb-8">
        <div className="w-14 h-14 bg-dc-yellow border-2 border-outline-variant dc-hard-shadow-sm flex items-center justify-center mb-7"><Mail className="w-6 h-6" /></div>
        <p className="dc-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">02 / RECOVERY</p>
        <h1 className="dc-display text-5xl sm:text-6xl">RESET<br /><span className="text-primary">ACCESS.</span></h1>
        <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">Enter your account email. We'll start the password recovery flow.</p>
      </header>

      {resetError && <div className="mb-6 p-4 bg-error-container border-2 border-outline-variant flex items-center gap-3 text-on-error text-xs dc-mono"><AlertCircle className="w-5 h-5 shrink-0" /><span>{resetError}</span></div>}
      <form onSubmit={handleRequestCode} className="space-y-5">
        <label className="block space-y-2">
          <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Email Address</span>
          <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="architect@devcollective.edu" className="w-full bg-surface border-2 border-outline-variant px-4 py-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-primary/20" required />
        </label>
        <button type="submit" disabled={resetLoading} className="w-full dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-bold uppercase py-4 flex items-center justify-center gap-3 disabled:opacity-50"><span>{resetLoading ? 'SENDING CODE...' : 'SEND VERIFICATION CODE'}</span><ArrowRight className="w-5 h-5" /></button>
      </form>
    </>
  );

  const renderForgotCode = () => (
    <>
      <button type="button" onClick={() => setView('forgot-email')} className="flex items-center gap-2 dc-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface mb-10"><ArrowLeft className="w-4 h-4" /> Back</button>
      <header className="mb-8">
        <div className="w-14 h-14 bg-dc-mint border-2 border-outline-variant dc-hard-shadow-sm flex items-center justify-center mb-7"><KeyRound className="w-6 h-6" /></div>
        <p className="dc-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">03 / VERIFICATION</p>
        <h1 className="dc-display text-5xl sm:text-6xl">VERIFY<br /><span className="text-primary">IDENTITY.</span></h1>
        <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">Check <span className="font-bold text-on-surface">{resetEmail}</span> for the verification code and continue the recovery flow.</p>
      </header>

      {resetMessage && <div className="mb-6 p-4 bg-dc-mint border-2 border-outline-variant flex items-center gap-3 text-on-secondary text-xs dc-mono"><CheckCircle2 className="w-5 h-5 shrink-0" /><span>{resetMessage}</span></div>}
      {resetError && <div className="mb-6 p-4 bg-error-container border-2 border-outline-variant flex items-center gap-3 text-on-error text-xs dc-mono"><AlertCircle className="w-5 h-5 shrink-0" /><span>{resetError}</span></div>}

      <form onSubmit={handleResetPassword} className="space-y-5">
        <label className="block space-y-2">
          <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">6-Digit Code</span>
          <input type="text" inputMode="numeric" maxLength={6} value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full bg-surface border-2 border-outline-variant px-4 py-4 text-xl text-on-surface tracking-[0.3em] text-center placeholder:text-on-surface-variant focus:outline-none focus:bg-primary/20" required />
        </label>
        <label className="block space-y-2">
          <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">New Password</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="w-full bg-surface border-2 border-outline-variant px-4 py-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-primary/20" required minLength={6} />
        </label>
        <button type="submit" disabled={resetLoading} className="w-full dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-bold uppercase py-4 flex items-center justify-center gap-3 disabled:opacity-50"><span>{resetLoading ? 'UPDATING...' : 'RESET PASSWORD'}</span><ArrowRight className="w-5 h-5" /></button>
      </form>
    </>
  );

  return (
    <div className="dc-public min-h-screen bg-background text-on-background">
      <div className="max-w-[1500px] mx-auto min-h-screen px-5 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col">
        <div className="flex items-center justify-between gap-4 border-b-2 border-outline-variant pb-4">
          <button type="button" onClick={() => setActiveTab('landing')} className="dc-mono text-[10px] uppercase tracking-[0.18em] hover:text-primary">DC / DEVCOLLECTIVE</button>
          <div className="hidden sm:flex items-center gap-5 dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant"><span>AUTH NODE / 01</span><span className="flex items-center gap-2"><span className="dc-status-dot" /> SECURE</span></div>
        </div>

        <main className="flex-1 grid lg:grid-cols-[0.82fr_1.18fr] gap-8 lg:gap-14 items-center py-10 sm:py-14">
          <section className="hidden lg:block self-stretch border-2 border-outline-variant bg-dc-lavender p-8 xl:p-10 dc-hard-shadow relative overflow-hidden">
            <div className="flex items-center justify-between dc-mono text-[9px] uppercase tracking-[0.16em]"><span>LIVE / ACCESS GATE</span><ShieldCheck className="w-4 h-4" /></div>
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2">
              <div className="dc-display text-7xl xl:text-8xl text-[#171717]">LEARN.<br />BUILD.<br />SHIP.</div>
              <div className="mt-8 border-t-2 border-[#171717] pt-5 dc-mono text-[9px] uppercase leading-relaxed text-[#171717]">COMMUNITY / MENTORSHIP / ROADMAPS<br />PROOF OF WORK / COLLABORATION / REP</div>
            </div>
            <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 border-2 border-[#171717] text-[#171717] dc-mono text-[9px] uppercase">
              <div className="p-3 bg-dc-yellow border-r-2 border-[#171717]">01<br />IDENTITY</div>
              <div className="p-3 bg-dc-mint border-r-2 border-[#171717]">02<br />ACCESS</div>
              <div className="p-3 bg-[#FFF9F0]">03<br />WORKSPACE</div>
            </div>
          </section>

          <section className="w-full max-w-xl lg:max-w-2xl mx-auto border-2 border-outline-variant bg-surface p-7 sm:p-9 lg:p-11 dc-hard-shadow">
            {view === 'login' && renderLogin()}
            {view === 'forgot-email' && renderForgotEmail()}
            {view === 'forgot-code' && renderForgotCode()}
          </section>
        </main>

        <footer className="border-t-2 border-outline-variant pt-4 flex flex-wrap justify-between gap-3 dc-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-variant">
          <span>DEVCO / AUTHENTICATION SYSTEM</span>
          <span>LEARN → BUILD → COLLABORATE → SHIP</span>
        </footer>
      </div>
    </div>
  );
};

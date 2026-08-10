import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setActiveTab, loginWithEmail, triggerOAuthLogin, setShowOAuthModal, oauthInfo } = useAuth();
  const [email, setEmail] = useState('kanojiyapk524@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Back Button Header */}
      <button
        onClick={() => setActiveTab('landing')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 font-label-mono text-xs uppercase text-on-surface-variant hover:text-primary transition-colors bg-surface-container/80 px-4 py-2 rounded-full border border-outline-variant backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Left Panel (40%) */}
      <section className="hidden md:flex md:w-[40%] bg-surface-container-lowest border-r-2 border-outline-variant relative flex-col justify-center px-12 lg:px-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary/10 rounded-full blur-[160px]" />
          <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-secondary/10 rounded-full blur-[160px]" />
        </div>

        <div className="relative z-10 space-y-8 animate-fade-in">
          <div className="w-full aspect-[4/3] rounded-2xl border-2 border-outline-variant overflow-hidden bg-surface-container">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80"
              alt="Developer collaboration"
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          <div className="space-y-3">
            <h1 className="font-headline-lg text-3xl lg:text-4xl font-bold text-white">Welcome Back</h1>
            <p className="font-body-lg text-base text-on-surface-variant max-w-md leading-relaxed">
              Continue your journey. Collaborate with student architects, build real projects, and scale your reputation.
            </p>
          </div>

          <ul className="space-y-3">
            <li className="flex items-center gap-3 font-label-mono text-xs uppercase text-secondary">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Resume active learning roadmaps</span>
            </li>
            <li className="flex items-center gap-3 font-label-mono text-xs uppercase text-secondary">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Connect with senior mentors</span>
            </li>
            <li className="flex items-center gap-3 font-label-mono text-xs uppercase text-secondary">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Climb college reputation ranks</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Right Panel (60%) */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-8 py-20 md:py-12">
        <div className="w-full max-w-lg">
          <div className="bg-surface-container rounded-2xl border-2 border-outline-variant p-8 sm:p-10 shadow-2xl">
            <header className="mb-8 text-center space-y-2">
              <h2 className="font-headline-lg text-3xl font-bold text-white">Sign In</h2>
              <p className="font-body-md text-sm text-on-surface-variant">
                Enter your college credentials to access your DevCollective dashboard.
              </p>
            </header>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-error/10 border-2 border-error/50 rounded-xl flex items-center gap-3 text-error text-xs font-label-mono">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@devcollective.edu"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-5 py-3.5 font-body-md text-white placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                    Password
                  </label>
                  <a href="#" className="font-label-mono text-[11px] uppercase text-primary hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-5 py-3.5 font-body-md text-white placeholder:text-outline focus:outline-none focus:border-secondary transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-container to-secondary-container text-white font-bold text-base py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Login'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-0.5 bg-outline-variant" />
              <span className="font-label-mono text-[11px] text-outline uppercase tracking-wider">
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-0.5 bg-outline-variant" />
            </div>

            {/* Google & GitHub OAuth Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => triggerOAuthLogin('google')}
                className="flex items-center justify-center gap-2.5 bg-surface-container-lowest border-2 border-outline-variant hover:border-primary rounded-xl py-3.5 font-label-mono text-xs uppercase font-bold text-white hover:bg-surface-container-highest transition-all active:scale-95 group"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => triggerOAuthLogin('github')}
                className="flex items-center justify-center gap-2.5 bg-surface-container-lowest border-2 border-outline-variant hover:border-primary rounded-xl py-3.5 font-label-mono text-xs uppercase font-bold text-white hover:bg-surface-container-highest transition-all active:scale-95 group"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Auth Status Banner */}
            <div className="mt-6 p-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl flex items-center justify-between text-xs font-label-mono">
              <span className="text-on-surface-variant flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-tertiary" />
                <span>MVP Auth: Native Email & Password Active</span>
              </span>
              <span className="text-tertiary font-bold px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/20">
                Secure
              </span>
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center">
              <p className="font-body-md text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-secondary font-bold hover:underline ml-1"
                >
                  Register Here
                </button>
              </p>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
};

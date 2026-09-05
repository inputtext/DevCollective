import React, { useState } from 'react';
import { useSignIn } from '@clerk/react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Github, Mail, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { setActiveTab, triggerOAuthLogin, authRedirectError, clearAuthRedirectError } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountMissing, setAccountMissing] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationMode, setVerificationMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clerkErrorMessage = errors?.fields?.identifier?.message || errors?.fields?.password?.message;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    setAccountMissing(false);
    setSubmittedEmail(email.trim());

    try {
      const { error: signInError } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (signInError) {
        const code = signInError.code;

        if (code === 'form_identifier_not_found') {
          setAccountMissing(true);
          setPassword('');
          return;
        }

        setError(signInError.message || 'The email or password is incorrect.');
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl('/');
            window.location.href = url;
          },
        });
        return;
      }

      if (signIn.status === 'needs_client_trust') {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code',
        );

        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
          setVerificationMode(true);
          return;
        }
      }

      if (signIn.status === 'needs_second_factor') {
        setError('Additional verification is required for this account.');
        return;
      }

      setError('Authentication could not be completed. Please try again.');
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await signIn.mfa.verifyEmailCode({ code: code.trim() });

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            window.location.href = decorateUrl('/');
          },
        });
      } else {
        setError('That verification code could not complete sign in.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    signIn.reset();
    setAccountMissing(false);
    setVerificationMode(false);
    setError(null);
    setPassword('');
    setCode('');
  };

  const isBusy = loading || fetchStatus === 'fetching';

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pt-20">
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.75fr)] gap-12 lg:gap-20 items-start">
          <section className="lg:sticky lg:top-28">
            <p className="dc-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">01 / AUTHENTICATION</p>
            <h1 className="dc-display text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
              ENTER THE<br /><span className="text-primary">COLLECTIVE.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-on-surface-variant max-w-lg">
              Authenticate with your DevCollective account and continue exactly where you left off.
            </p>
            <div className="hidden lg:block mt-12 border-t-2 border-outline-variant pt-5">
              <div className="flex items-center justify-between gap-6">
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">AUTH / CLERK</span>
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">SECURE SESSION</span>
              </div>
            </div>
          </section>

          <section className="w-full max-w-xl lg:justify-self-end">
            {authRedirectError && (
              <div className="mb-6 p-4 bg-error-container border-2 border-outline-variant flex items-center gap-3 text-on-error text-xs dc-mono">
                <span className="flex-1">{authRedirectError}</span>
                <button type="button" onClick={clearAuthRedirectError} aria-label="Dismiss error">✕</button>
              </div>
            )}

            <div className="border-2 border-outline-variant bg-surface p-5 sm:p-7 dc-hard-shadow">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-outline-variant">
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em]">
                  {verificationMode ? 'VERIFY / 02' : accountMissing ? 'ACCOUNT / NOT FOUND' : 'SIGN IN / 01'}
                </span>
                <span className={`dc-status-dot ${accountMissing ? 'bg-dc-yellow' : ''}`} aria-label="Authentication service ready" />
              </div>

              {accountMissing ? (
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-dc-yellow border-2 border-outline-variant dc-hard-shadow-sm flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="dc-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-3">ACCOUNT NOT FOUND</p>
                    <h2 className="dc-display text-4xl sm:text-5xl leading-[0.92]">NO PROFILE<br /><span className="text-primary">YET.</span></h2>
                    <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">
                      We couldn't find a DevCollective account for <strong className="text-on-surface">{submittedEmail}</strong>. Create one and we'll take you through the registration and verification flow.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="border-2 border-outline-variant bg-primary px-5 py-4 dc-hard-shadow-sm uppercase font-black text-xs flex items-center justify-center gap-3"
                    >
                      CREATE ACCOUNT <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={resetLogin}
                      className="border-2 border-outline-variant bg-surface px-5 py-4 dc-mono text-[10px] uppercase font-bold flex items-center justify-center gap-3 hover:bg-dc-lavender transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> TRY ANOTHER EMAIL
                    </button>
                  </div>
                </div>
              ) : verificationMode ? (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="w-14 h-14 bg-dc-mint border-2 border-outline-variant dc-hard-shadow-sm flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="dc-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-3">02 / VERIFICATION</p>
                    <h2 className="dc-display text-4xl sm:text-5xl leading-[0.92]">VERIFY<br /><span className="text-primary">IDENTITY.</span></h2>
                    <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">
                      Enter the verification code sent to <strong className="text-on-surface">{submittedEmail}</strong>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Verification Code</label>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="w-full bg-surface border-2 border-outline-variant px-4 py-4 text-lg tracking-[0.35em] text-on-surface focus:outline-none focus:bg-dc-mint"
                    />
                  </div>
                  {error && <div className="p-4 bg-error-container border-2 border-outline-variant text-on-error text-xs dc-mono">{error}</div>}
                  <button type="submit" disabled={isBusy} className="w-full dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase py-4 flex items-center justify-center gap-3 disabled:opacity-50">
                    {isBusy ? 'VERIFYING...' : 'VERIFY & CONTINUE'} <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={resetLogin} className="w-full dc-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface">Start over</button>
                </form>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => { setEmail(event.target.value); setError(null); }}
                        placeholder="architect@devcollective.edu"
                        autoComplete="email"
                        className="w-full bg-surface border-2 border-outline-variant px-4 py-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-primary/20 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-4">
                        <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Password</label>
                        <span className="dc-mono text-[9px] uppercase tracking-[0.12em] text-on-surface-variant">Managed by Clerk</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => { setPassword(event.target.value); setError(null); }}
                          autoComplete="current-password"
                          className="w-full bg-surface border-2 border-outline-variant px-4 py-4 pr-12 text-sm text-on-surface focus:outline-none focus:bg-primary/20 transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {(error || clerkErrorMessage) && (
                      <div className="p-4 bg-error-container border-2 border-outline-variant flex items-start gap-3 text-on-error text-xs dc-mono">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error || clerkErrorMessage}</span>
                      </div>
                    )}

                    <button type="submit" disabled={isBusy} className="w-full dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase tracking-wide py-4 px-5 flex items-center justify-center gap-3 disabled:opacity-50">
                      {isBusy ? 'AUTHENTICATING...' : 'CONTINUE TO WORKSPACE'} <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>

                  <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-outline-variant" />
                    <span className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">OR CONTINUE WITH</span>
                    <div className="flex-1 h-px bg-outline-variant" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => triggerOAuthLogin('google')} className="flex items-center justify-center gap-2 bg-surface border-2 border-outline-variant py-3.5 dc-mono text-[10px] uppercase font-bold hover:bg-dc-yellow transition-colors">
                      Google
                    </button>
                    <button type="button" onClick={() => triggerOAuthLogin('github')} className="flex items-center justify-center gap-2 bg-surface border-2 border-outline-variant py-3.5 dc-mono text-[10px] uppercase font-bold hover:bg-dc-mint transition-colors">
                      <Github className="w-4 h-4" /> GitHub
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t-2 border-outline-variant text-center">
                    <p className="text-sm text-on-surface-variant">
                      Don't have an account?{' '}
                      <button type="button" onClick={() => setActiveTab('register')} className="text-primary font-bold uppercase text-xs ml-1 hover:underline">Register Here</button>
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
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
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clerkErrorMessage = errors?.fields?.identifier?.message || errors?.fields?.password?.message;
  const isBusy = loading || fetchStatus === 'fetching';

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
        if (signInError.code === 'form_identifier_not_found') {
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
            window.location.href = decorateUrl('/');
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

  const startForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: createError } = await signIn.create({ identifier: email.trim() });
      if (createError) {
        setError(createError.message || 'We could not start the password reset.');
        return;
      }

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(sendError.message || 'We could not send the reset code.');
        return;
      }

      setSubmittedEmail(email.trim());
      setForgotStep('code');
    } catch (err: any) {
      setError(err?.message || 'Unable to send a reset code right now.');
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!forgotCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({
        code: forgotCode.trim(),
      });

      if (verifyError) {
        setError(verifyError.message || 'That reset code is invalid.');
        return;
      }

      setForgotStep('password');
    } catch (err: any) {
      setError(err?.message || 'Unable to verify the reset code.');
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    setError(null);

    try {
      const { error: passwordError } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });

      if (passwordError) {
        setError(passwordError.message || 'Unable to update your password.');
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            window.location.href = decorateUrl('/');
          },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update your password.');
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    signIn.reset();
    setAccountMissing(false);
    setVerificationMode(false);
    setForgotMode(false);
    setForgotStep('email');
    setError(null);
    setPassword('');
    setCode('');
    setForgotCode('');
    setNewPassword('');
  };

  const renderError = () => {
    if (!error && !clerkErrorMessage) return null;
    return (
      <div className="mt-5 p-4 border-2 border-outline-variant bg-dc-pink text-on-surface flex items-start gap-3 text-xs dc-mono">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{error || clerkErrorMessage}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pt-20">
      <main className="flex-1 w-full max-w-[824px] mx-auto px-6 sm:px-10 py-0 pb-16">
        {authRedirectError && (
          <div className="mb-8 p-4 border-2 border-outline-variant bg-dc-pink flex items-center gap-3 text-xs dc-mono">
            <span className="flex-1">{authRedirectError}</span>
            <button type="button" onClick={clearAuthRedirectError} aria-label="Dismiss error">✕</button>
          </div>
        )}

        <section className="pt-0">
          <h1 className="dc-display text-[clamp(4.2rem,10vw,6.25rem)] leading-[0.86] tracking-[-0.055em] font-black text-primary uppercase">
            COLLECTIVE.
          </h1>
          <p className="mt-9 max-w-[720px] text-xl sm:text-[21px] leading-[1.65] text-on-surface">
            Sign in to continue your learning path, projects, collaborations, and developer progress.
          </p>
        </section>

        <section className="mt-16 sm:mt-17">
          {accountMissing ? (
            <div className="border-t-2 border-outline-variant pt-8 space-y-7">
              <div className="w-14 h-14 bg-dc-yellow border-2 border-outline-variant dc-hard-shadow-sm flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="dc-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-3">ACCOUNT NOT FOUND</p>
                <h2 className="dc-display text-4xl sm:text-5xl leading-[0.92]">NO PROFILE<br /><span className="text-primary">YET.</span></h2>
                <p className="mt-5 text-sm sm:text-base leading-relaxed text-on-surface-variant max-w-2xl">
                  We couldn't find a DevCollective account for <strong className="text-on-surface">{submittedEmail}</strong>. Create one and we'll take you through registration and verification.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
                <button type="button" onClick={() => setActiveTab('register')} className="border-2 border-outline-variant bg-primary px-5 py-4 dc-hard-shadow-sm uppercase font-black text-xs flex items-center justify-center gap-3">
                  CREATE ACCOUNT <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={resetLogin} className="border-2 border-outline-variant bg-surface px-5 py-4 dc-mono text-[10px] uppercase font-bold flex items-center justify-center gap-3 hover:bg-dc-lavender transition-colors">
                  <RotateCcw className="w-4 h-4" /> TRY ANOTHER EMAIL
                </button>
              </div>
            </div>
          ) : verificationMode ? (
            <form onSubmit={handleVerify} className="space-y-7">
              <div className="flex items-center justify-between border-b-2 border-outline-variant pb-4">
                <label className="dc-mono text-[10px] uppercase tracking-[0.16em]">VERIFICATION CODE</label>
                <span className="dc-status-dot bg-dc-mint" />
              </div>
              <div>
                <p className="text-sm leading-relaxed text-on-surface-variant">Enter the verification code sent to <strong className="text-on-surface">{submittedEmail}</strong>.</p>
              </div>
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="w-full h-[84px] bg-surface border-2 border-outline-variant px-7 text-2xl tracking-[0.35em] text-on-surface focus:outline-none focus:bg-dc-mint" />
              {renderError()}
              <button type="submit" disabled={isBusy} className="w-full h-[94px] dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase text-xl flex items-center justify-center gap-4 disabled:opacity-50">
                {isBusy ? 'VERIFYING...' : 'VERIFY & CONTINUE'} <CheckCircle2 className="w-6 h-6" />
              </button>
              <button type="button" onClick={resetLogin} className="w-full dc-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface">Start over</button>
            </form>
          ) : forgotMode ? (
            <div className="space-y-7">
              <div className="flex items-center justify-between border-b-2 border-outline-variant pb-4">
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em]">PASSWORD RESET / {forgotStep === 'email' ? '01' : forgotStep === 'code' ? '02' : '03'}</span>
                <span className="dc-status-dot bg-dc-yellow" />
              </div>

              {forgotStep === 'email' && (
                <form onSubmit={startForgotPassword} className="space-y-5">
                  <p className="text-sm sm:text-base leading-relaxed text-on-surface-variant">Enter your account email and Clerk will send you a password reset code.</p>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="architect@devcollective.edu" autoComplete="email" className="w-full h-[84px] bg-surface border-2 border-outline-variant px-7 text-lg text-on-surface focus:outline-none focus:bg-dc-lavender" required />
                  {renderError()}
                  <button type="submit" disabled={isBusy} className="w-full h-[94px] dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase text-xl flex items-center justify-center gap-4 disabled:opacity-50">
                    {isBusy ? 'SENDING...' : 'SEND RESET CODE'} <ArrowRight className="w-6 h-6" />
                  </button>
                </form>
              )}

              {forgotStep === 'code' && (
                <form onSubmit={verifyForgotCode} className="space-y-5">
                  <p className="text-sm sm:text-base leading-relaxed text-on-surface-variant">Enter the reset code sent to <strong className="text-on-surface">{submittedEmail}</strong>.</p>
                  <input value={forgotCode} onChange={(event) => setForgotCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="w-full h-[84px] bg-surface border-2 border-outline-variant px-7 text-2xl tracking-[0.35em] text-on-surface focus:outline-none focus:bg-dc-yellow" required />
                  {renderError()}
                  <button type="submit" disabled={isBusy} className="w-full h-[94px] dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase text-xl flex items-center justify-center gap-4 disabled:opacity-50">
                    {isBusy ? 'VERIFYING...' : 'VERIFY CODE'} <ArrowRight className="w-6 h-6" />
                  </button>
                </form>
              )}

              {forgotStep === 'password' && (
                <form onSubmit={submitNewPassword} className="space-y-5">
                  <p className="text-sm sm:text-base leading-relaxed text-on-surface-variant">Set a new password for your DevCollective account.</p>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="New password" className="w-full h-[84px] bg-surface border-2 border-outline-variant px-7 pr-16 text-lg text-on-surface focus:outline-none focus:bg-dc-mint" required />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                  {renderError()}
                  <button type="submit" disabled={isBusy} className="w-full h-[94px] dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase text-xl flex items-center justify-center gap-4 disabled:opacity-50">
                    {isBusy ? 'UPDATING...' : 'UPDATE PASSWORD'} <CheckCircle2 className="w-6 h-6" />
                  </button>
                </form>
              )}

              <button type="button" onClick={resetLogin} className="w-full dc-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface">Back to sign in</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-0">
              <div className="space-y-2">
                <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Email Address</label>
                <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(null); }} placeholder="architect@devcollective.edu" autoComplete="email" className="w-full h-[84px] bg-surface border-2 border-outline-variant px-7 text-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-primary/20 transition-colors" required />
              </div>

              <div className="mt-8 space-y-2">
                <div className="flex justify-between items-center gap-4">
                  <label className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Password</label>
                  <button type="button" onClick={() => { setForgotMode(true); setForgotStep('email'); setError(null); }} className="dc-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline">Forgot Password?</button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }} autoComplete="current-password" className="w-full h-[84px] bg-surface border-2 border-outline-variant px-7 pr-16 text-lg text-on-surface focus:outline-none focus:bg-primary/20 transition-colors" required />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {renderError()}

              <button type="submit" disabled={isBusy} className="mt-8 w-full h-[94px] dc-hard-shadow-sm bg-primary text-on-primary border-2 border-outline-variant font-black uppercase text-xl flex items-center justify-center gap-4 disabled:opacity-50">
                {isBusy ? 'AUTHENTICATING...' : 'CONTINUE TO WORKSPACE'} <ArrowRight className="w-6 h-6" />
              </button>
            </form>
          )}
        </section>

        {!accountMissing && !verificationMode && !forgotMode && (
          <>
            <div className="my-14 flex items-center gap-6">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant whitespace-nowrap">OR CONTINUE WITH</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <button type="button" onClick={() => triggerOAuthLogin('google')} className="h-[74px] flex items-center justify-center gap-3 bg-surface border-2 border-outline-variant dc-mono text-[10px] uppercase font-bold hover:bg-dc-yellow transition-colors">
                <span className="text-xl font-black" aria-hidden="true">G</span> GOOGLE
              </button>
              <button type="button" onClick={() => triggerOAuthLogin('github')} className="h-[74px] flex items-center justify-center gap-3 bg-surface border-2 border-outline-variant dc-mono text-[10px] uppercase font-bold hover:bg-dc-mint transition-colors">
                <Github className="w-5 h-5" /> GITHUB
              </button>
            </div>

            <div className="mt-12 pt-7 border-t-2 border-outline-variant text-center">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <button type="button" onClick={() => setActiveTab('register')} className="text-primary font-bold uppercase text-xs ml-1 hover:underline">Register Here</button>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
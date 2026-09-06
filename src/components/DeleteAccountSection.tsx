import React, { useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useSession, useUser } from '@clerk/react';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShieldAlert, X } from 'lucide-react';

const DELETION_FUNCTION = `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/account-deletion`;

type ModalStep = 'closed' | 'confirm' | 'code' | 'deleting' | 'success';

export const DeleteAccountSection: React.FC = () => {
  const { getToken } = useClerkAuth();
  const { session } = useSession();
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState<ModalStep>('closed');
  const [confirmation, setConfirmation] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [deletionToken, setDeletionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const closeModal = () => {
    if (busy) return;
    setStep('closed');
    setConfirmation('');
    setVerificationCode('');
    setDeletionToken(null);
    setError(null);
    setResendCooldown(0);
  };

  const deletionRequest = async (action: string, body: Record<string, unknown> = {}, includeAuth = false) => {
    if (!DELETION_FUNCTION.startsWith('http')) throw new Error('Account deletion service is not configured.');
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (includeAuth) {
      const token = await getToken();
      if (!token) throw new Error('Your session could not be verified. Please sign in again.');
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(DELETION_FUNCTION, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...body }),
      keepalive: action === 'cleanup',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Account deletion request failed.');
    return data;
  };

  const sendVerificationCode = async () => {
    if (!session || !clerkUser) {
      setError('Your Clerk session is not ready. Please refresh and try again.');
      return;
    }
    if (confirmation !== 'DELETE') {
      setError('Type DELETE exactly to continue.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const prepared = await deletionRequest('prepare', {}, true);
      setDeletionToken(String(prepared.token || ''));

      const verification = await (session as any).startVerification({ level: 'first_factor' });
      const factors = verification?.firstFactorVerification?.supportedFirstFactors || verification?.supportedFirstFactors || [];
      const emailFactor = factors.find((factor: any) => factor?.strategy === 'email_code' && factor?.emailAddressId);
      if (!emailFactor) {
        throw new Error('Email-code verification is not available for this account. Your account was not deleted.');
      }

      await (session as any).prepareFirstFactorVerification({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setVerificationCode('');
      setResendCooldown(30);
      setStep('code');
    } catch (err: any) {
      setDeletionToken(null);
      setError(err?.message || 'Could not send the deletion verification code.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (!session || resendCooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const verification = await (session as any).startVerification({ level: 'first_factor' });
      const factors = verification?.firstFactorVerification?.supportedFirstFactors || verification?.supportedFirstFactors || [];
      const emailFactor = factors.find((factor: any) => factor?.strategy === 'email_code' && factor?.emailAddressId);
      if (!emailFactor) throw new Error('Email-code verification is not available for this account.');
      await (session as any).prepareFirstFactorVerification({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId });
      setVerificationCode('');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err?.message || 'Could not resend the verification code.');
    } finally {
      setBusy(false);
    }
  };

  const verifyAndDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session || !clerkUser || !deletionToken || busy) return;
    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }

    setBusy(true);
    setError(null);
    setStep('deleting');
    try {
      const verification = await (session as any).attemptFirstFactorVerification({ strategy: 'email_code', code: verificationCode });
      if (verification?.status && verification.status !== 'complete') {
        throw new Error('Verification was not completed. Your account was not deleted.');
      }

      // The session is now freshly verified. Clerk treats account deletion as a sensitive action.
      await clerkUser.delete();

      try {
        await deletionRequest('cleanup', { token: deletionToken });
      } catch (cleanupError) {
        console.error('Supabase account cleanup failed after Clerk deletion:', cleanupError);
      }

      localStorage.removeItem(`devcollective_profile_cache:${clerkUser.id}`);
      sessionStorage.removeItem('devcollective_pending_registration');
      setStep('success');
      window.setTimeout(() => { window.location.assign('/'); }, 1600);
    } catch (err: any) {
      setStep('code');
      setError(err?.message || 'The code could not be verified. Your account was not deleted.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-2 border-red-500/60 bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
      <div className="absolute inset-x-0 top-0 h-2 bg-red-400" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pt-1">
        <div className="max-w-2xl">
          <p className="font-label-mono text-[10px] uppercase tracking-[0.18em] text-red-500">PROFILE / DANGER ZONE</p>
          <h3 className="dc-display text-3xl mt-1">DELETE ACCOUNT PERMANENTLY</h3>
          <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">This permanently removes your DevCollective profile and account. You must confirm the action and enter the verification code sent to your email.</p>
        </div>
        <button type="button" onClick={() => { setError(null); setConfirmation(''); setStep('confirm'); }} className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white border-2 border-outline-variant shadow-[4px_4px_0_#171717] font-label-mono text-[10px] uppercase font-bold hover:-translate-y-0.5 transition-transform"><ShieldAlert className="w-4 h-4" /> Delete permanently</button>
      </div>

      {step !== 'closed' && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
        <div className="bg-surface border-2 border-red-500/70 w-full max-w-lg shadow-[8px_8px_0_#171717] relative">
          <button type="button" onClick={closeModal} disabled={busy || step === 'success'} className="absolute top-3 right-3 p-1 disabled:opacity-40" aria-label="Close"><X className="w-5 h-5" /></button>

          {step === 'confirm' && <div className="p-6 sm:p-7">
            <div className="w-12 h-12 border-2 border-red-500 bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
            <p className="font-label-mono text-[10px] uppercase text-red-500 mt-5">FINAL ACTION / VERIFY OWNERSHIP</p>
            <h4 className="dc-display text-4xl mt-1">THIS CANNOT BE UNDONE.</h4>
            <p className="text-sm text-on-surface-variant mt-3">Your Clerk account and your DevCollective application data will be permanently removed. First, we will send a one-time verification code to <strong>{clerkUser?.primaryEmailAddress?.emailAddress || 'your email'}</strong>.</p>
            <label className="block mt-6"><span className="font-label-mono text-[10px] uppercase text-on-surface-variant">Type DELETE to continue</span><input value={confirmation} onChange={(e) => setConfirmation(e.target.value.slice(0, 6))} autoFocus autoComplete="off" className="mt-2 w-full bg-surface border-2 border-outline-variant p-3.5 font-label-mono text-sm uppercase" placeholder="DELETE" /></label>
            {error && <p className="mt-3 text-xs text-error">{error}</p>}
            <div className="flex gap-3 mt-6"><button type="button" onClick={closeModal} disabled={busy} className="flex-1 border-2 border-outline-variant py-3 font-label-mono text-[10px] uppercase">Cancel</button><button type="button" onClick={() => void sendVerificationCode()} disabled={busy || confirmation !== 'DELETE'} className="flex-1 bg-red-500 text-white border-2 border-outline-variant py-3 font-label-mono text-[10px] uppercase font-bold shadow-[3px_3px_0_#171717] flex items-center justify-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Send verification code</button></div>
          </div>}

          {step === 'code' && <form onSubmit={verifyAndDelete} className="p-6 sm:p-7">
            <p className="font-label-mono text-[10px] uppercase text-on-surface-variant">SECURITY / EMAIL VERIFICATION</p>
            <h4 className="dc-display text-4xl mt-1">ENTER THE CODE.</h4>
            <p className="text-sm text-on-surface-variant mt-3">We sent a 6-digit verification code to <strong>{clerkUser?.primaryEmailAddress?.emailAddress || 'your email'}</strong>. Enter it below to authorize permanent deletion.</p>
            <input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="000000" className="mt-6 w-full bg-surface border-2 border-outline-variant p-4 text-center font-label-mono text-2xl tracking-[0.5em]" />
            {error && <p className="mt-3 text-xs text-error">{error}</p>}
            <div className="flex items-center justify-between mt-4"><button type="button" onClick={() => void resendCode()} disabled={busy || resendCooldown > 0} className="font-label-mono text-[10px] uppercase text-primary disabled:opacity-40">{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}</button><span className="font-label-mono text-[9px] uppercase text-on-surface-variant">Required to continue</span></div>
            <div className="flex gap-3 mt-6"><button type="button" onClick={closeModal} disabled={busy} className="flex-1 border-2 border-outline-variant py-3 font-label-mono text-[10px] uppercase">Cancel</button><button type="submit" disabled={busy || verificationCode.length !== 6} className="flex-1 bg-red-500 text-white border-2 border-outline-variant py-3 font-label-mono text-[10px] uppercase font-bold shadow-[3px_3px_0_#171717] flex items-center justify-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} Delete my account</button></div>
          </form>}

          {step === 'deleting' && <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" /><p className="font-label-mono text-xs uppercase mt-4">Deleting account...</p><p className="text-sm text-on-surface-variant mt-2">Please keep this window open.</p></div>}
          {step === 'success' && <div className="p-8 text-center"><CheckCircle2 className="w-12 h-12 mx-auto text-dc-mint" /><p className="dc-display text-3xl mt-4">ACCOUNT DELETED.</p><p className="text-sm text-on-surface-variant mt-2">Redirecting you now.</p></div>}
        </div>
      </div>}
    </section>
  );
};
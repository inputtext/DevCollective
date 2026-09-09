import React, { useState } from 'react';
import { useSignUp } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { MentorAccessModal } from '../components/MentorAccessModal';
import { ArrowLeft, ArrowRight, School, Brain, Building2, Eye, EyeOff, AlertCircle, UserRound, Mail, LockKeyhole, GraduationCap, CheckCircle2 } from 'lucide-react';

const PENDING_REGISTRATION_KEY = 'devcollective_pending_registration';

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
};

export const RegisterPage: React.FC = () => {
  const { setActiveTab, triggerOAuthLogin } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeName, setCollegeName] = useState('Institute of Technology');
  const [branch, setBranch] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMode, setVerificationMode] = useState(false);
  const [mentorAccessOpen, setMentorAccessOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isBusy = fetchStatus === 'fetching';
  const clerkError = errors?.fields?.emailAddress?.message || errors?.fields?.password?.message || errors?.fields?.code?.message;

  const savePendingRegistration = () => {
    sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify({
      name: fullName.trim(), role, college: collegeName.trim(), branch: branch.trim(), academicYear,
    }));
  };

  const navigateHome = async () => {
    await signUp.finalize({ navigate: ({ session, decorateUrl }) => { if (session?.currentTask) return; window.location.href = decorateUrl('/'); } });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setSuccess(null);
    const normalizedName = fullName.trim(), normalizedEmail = email.trim(), normalizedCollege = collegeName.trim(), normalizedBranch = branch.trim();
    if (!normalizedName || !normalizedEmail || !password || !normalizedCollege || !normalizedBranch) { setError('Please complete all required fields before creating your account.'); return; }
    if (password.length < 8) { setError('Please choose a password with at least 8 characters.'); return; }
    savePendingRegistration();
    const { firstName, lastName } = splitName(normalizedName);
    const { error: passwordError } = await signUp.password({ emailAddress: normalizedEmail, password });
    if (passwordError) { setError(passwordError.message || 'We could not create your account. Please check your details and try again.'); return; }
    if (firstName || lastName) {
      const { error: nameError } = await signUp.update({ firstName, lastName });
      if (nameError) { setError(nameError.message || 'We could not save your name. Please try again.'); return; }
    }
    if (signUp.status === 'complete') { await navigateHome(); return; }
    if (signUp.unverifiedFields?.includes('email_address')) {
      const { error: verificationError } = await signUp.verifications.sendEmailCode();
      if (verificationError) { setError(verificationError.message || 'We could not send the verification code. Please try again.'); return; }
      setVerificationMode(true); setSuccess(`We sent a verification code to ${normalizedEmail}.`); return;
    }
    if (signUp.status === 'missing_requirements') { const missing = signUp.missingFields?.join(', ') || 'additional account details'; setError(`Your account still needs: ${missing.replaceAll('_', ' ')}.`); return; }
    setError('Account creation could not be completed. Please try again.');
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setSuccess(null);
    if (!verificationCode.trim()) { setError('Enter the verification code from your email.'); return; }
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: verificationCode.trim() });
    if (verifyError) { setError(verifyError.message || 'That verification code is not valid. Please try again.'); return; }
    if (signUp.status === 'complete') { await navigateHome(); return; }
    if (signUp.status === 'missing_requirements') { setError('Your email is verified, but the account still has required setup steps. Please review your Clerk sign-up settings.'); return; }
    setError('Verification succeeded, but the account could not be finalized. Please try again.');
  };

  const resendVerification = async () => {
    setError(null); setSuccess(null);
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) { setError(sendError.message || 'We could not resend the verification code.'); return; }
    setSuccess('A new verification code has been sent.');
  };

  const resetRegistration = () => { signUp.reset(); setVerificationMode(false); setVerificationCode(''); setPassword(''); setError(null); setSuccess(null); };

  const handleRoleSelect = (nextRole: UserRole) => {
    setError(null); setSuccess(null);
    if (nextRole === 'mentor') { setMentorAccessOpen(true); return; }
    setRole(nextRole);
  };

  const registrationDetails = () => ({ name: fullName, email, role, college: collegeName, branch, academicYear });
  const roles = [
    { value: 'student' as UserRole, number: '01', title: 'STUDENT', detail: 'LEARN & BUILD', icon: School, tone: 'bg-dc-blue' },
    { value: 'mentor' as UserRole, number: '02', title: 'MENTOR', detail: 'APPLY & GUIDE', icon: Brain, tone: 'bg-dc-yellow' },
    { value: 'faculty' as UserRole, number: '03', title: 'FACULTY', detail: 'MANAGE TRACKS', icon: Building2, tone: 'bg-dc-mint' },
  ];
  const inputClass = 'w-full bg-surface border-2 border-outline-variant rounded-[4px] px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors';
  const labelClass = 'dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant';

  return (
    <div className="dc-public min-h-screen overflow-hidden bg-background text-on-background">
      <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="flex items-center justify-between border-b-2 border-outline-variant pb-4">
          <button onClick={() => setActiveTab('landing')} className="dc-mono text-[10px] sm:text-xs uppercase tracking-[0.16em] inline-flex items-center gap-2 hover:text-primary"><ArrowLeft className="w-4 h-4" /> DC / BACK</button>
          <span className="dc-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] hidden sm:block">DC / 02 — PROFILE INITIALIZATION</span>
          <span className="dc-mono text-[10px] uppercase tracking-[0.16em] flex items-center gap-2"><span className="dc-status-dot" /> {verificationMode ? 'VERIFY' : 'READY'}</span>
        </div>
        <main className="grid lg:grid-cols-[0.72fr_1.28fr] gap-10 lg:gap-16 py-12 sm:py-16 lg:py-20">
          <aside className="lg:sticky lg:top-10 lg:self-start">
            <p className="dc-mono text-[10px] uppercase tracking-[0.22em] mb-6">[ CREATE YOUR IDENTITY ]</p>
            <h1 className="dc-display text-[clamp(4rem,8vw,7.5rem)]">JOIN.<br /><span className="text-primary">BUILD.</span><br />SHIP.</h1>
            <p className="mt-8 max-w-md text-base sm:text-lg leading-relaxed text-on-surface-variant">Create your developer account, verify your email, and enter the collective. Your role and profile details are saved for the workspace you enter next.</p>
            <div className="mt-10 border-2 border-outline-variant bg-surface dc-hard-shadow-sm">
              <div className="border-b-2 border-outline-variant px-4 py-3 dc-mono text-[9px] uppercase tracking-[0.16em]">INITIALIZATION / STATUS</div>
              <div className="p-5 space-y-4 dc-mono text-[10px] uppercase"><div className="flex justify-between"><span>IDENTITY</span><span className="text-primary">ACTIVE</span></div><div className="flex justify-between"><span>ROLE</span><span>{role.toUpperCase()}</span></div><div className="flex justify-between"><span>ACCOUNT</span><span>{verificationMode ? 'VERIFY' : fullName ? 'READY' : 'PENDING'}</span></div></div>
            </div>
          </aside>
          <section className="border-2 border-outline-variant bg-surface dc-hard-shadow p-6 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between gap-5 border-b-2 border-outline-variant pb-6 mb-8"><div><p className="dc-mono text-[10px] uppercase tracking-[0.18em] mb-3">01 / ACCOUNT</p><h2 className="dc-display text-4xl sm:text-5xl">{verificationMode ? 'VERIFY EMAIL.' : 'CREATE ACCOUNT.'}</h2></div>{verificationMode ? <CheckCircle2 className="w-7 h-7 shrink-0" /> : <UserRound className="w-7 h-7 shrink-0" />}</div>
            {(error || clerkError) && <div className="mb-7 p-4 bg-dc-pink border-2 border-outline-variant flex items-start gap-3 text-[#171717] text-xs dc-mono"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error || clerkError}</span></div>}
            {success && <div className="mb-7 p-4 bg-dc-mint border-2 border-outline-variant flex items-start gap-3 text-[#171717] text-xs dc-mono"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /><span>{success}</span></div>}
            {verificationMode ? (
              <form onSubmit={handleVerify} className="space-y-7"><div><p className={labelClass}>02 / Email Verification</p><p className="mt-3 text-sm leading-relaxed text-on-surface-variant">Enter the six-digit code sent to <strong className="text-on-surface">{email.trim()}</strong> to activate your account.</p></div><div className="space-y-2"><label className={labelClass}>Verification Code</label><input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className={`${inputClass} h-16 text-2xl tracking-[0.35em]`} required /></div><button type="submit" disabled={isBusy} className="w-full dc-hard-shadow-sm inline-flex items-center justify-center gap-3 bg-primary text-on-primary border-2 border-outline-variant px-6 py-4 font-bold uppercase tracking-wide disabled:opacity-50"><span>{isBusy ? 'VERIFYING EMAIL...' : 'VERIFY & ENTER WORKSPACE'}</span><ArrowRight className="w-5 h-5" /></button><div className="flex flex-col sm:flex-row justify-between gap-3 pt-2"><button type="button" onClick={resendVerification} disabled={isBusy} className="dc-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline disabled:opacity-50">Resend code</button><button type="button" onClick={resetRegistration} className="dc-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface">Start over</button></div></form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-9">
                <div><div className="flex items-end justify-between gap-4 mb-4"><div><p className={labelClass}>01 / Select role</p><h3 className="font-bold text-lg mt-1">WHO ARE YOU BUILDING AS?</h3></div><span className="dc-mono text-[9px] uppercase text-on-surface-variant">{role.toUpperCase()} SELECTED</span></div>
                  <div className="grid md:grid-cols-3 border-2 border-outline-variant">{roles.map((item, index) => { const Icon = item.icon; const selected = role === item.value; return <button key={item.value} type="button" onClick={() => handleRoleSelect(item.value)} className={`relative text-left p-5 sm:p-6 min-h-[170px] ${index < 2 ? 'border-b-2 md:border-b-0 md:border-r-2 border-outline-variant' : ''} ${selected ? item.tone : 'bg-background'} transition-colors`}><div className="flex items-start justify-between gap-3"><span className="dc-mono text-[10px]">{item.number}</span><Icon className="w-5 h-5" /></div><div className="mt-10"><div className="dc-display text-2xl">{item.title}</div><div className="dc-mono text-[9px] uppercase tracking-[0.12em] mt-2">{item.detail}</div></div>{selected && <span className="absolute right-4 bottom-4 dc-mono text-[9px]">✓ ACTIVE</span>}</button>; })}</div>
                </div>
                <div><p className={`${labelClass} mb-4`}>02 / Identity</p><div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2"><label className={labelClass}>Full Name</label><div className="relative"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className={`${inputClass} pl-10`} required /></div></div>
                  <div className="space-y-2"><label className={labelClass}>Email Address</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className={`${inputClass} pl-10`} required /></div></div>
                  <div className="space-y-2"><label className={labelClass}>Password</label><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={`${inputClass} pl-10 pr-11`} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <div className="space-y-2"><label className={labelClass}>College Name</label><div className="relative"><GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" /><input type="text" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="Institute of Technology" className={`${inputClass} pl-10`} required /></div></div>
                  <div className="space-y-2"><label className={labelClass}>Branch</label><input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Computer Science" className={inputClass} required /></div>
                  <div className="space-y-2"><label className={labelClass}>Academic Year</label><select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={inputClass}><option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option><option value="Postgrad">Postgrad</option></select></div>
                </div></div>
                <div className="border-t-2 border-outline-variant pt-7"><button type="submit" disabled={isBusy} className="w-full dc-hard-shadow-sm inline-flex items-center justify-center gap-3 bg-primary text-on-primary border-2 border-outline-variant px-6 py-4 font-bold uppercase tracking-wide disabled:opacity-50"><span>{isBusy ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & CONTINUE'}</span><ArrowRight className="w-5 h-5" /></button></div>
                <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-outline-variant" /></div><div className="relative flex justify-center"><span className="bg-surface px-4 dc-mono text-[9px] uppercase tracking-[0.16em]">OR REGISTER WITH</span></div></div>
                <div className="grid sm:grid-cols-2 gap-3"><button type="button" onClick={() => triggerOAuthLogin('google', registrationDetails())} className="h-12 border-2 border-outline-variant bg-background hover:bg-dc-blue font-bold uppercase text-xs dc-mono transition-colors">Google</button><button type="button" onClick={() => triggerOAuthLogin('github', registrationDetails())} className="h-12 border-2 border-outline-variant bg-background hover:bg-dc-lavender font-bold uppercase text-xs dc-mono transition-colors">GitHub</button></div>
                <p className="text-center text-sm text-on-surface-variant">Already have an account? <button type="button" onClick={() => setActiveTab('login')} className="text-primary font-bold hover:underline ml-1">Log In</button></p><div id="clerk-captcha" />
              </form>
            )}
          </section>
        </main>
        <footer className="border-t-2 border-outline-variant pt-4 flex justify-between dc-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-variant"><span>DEVCOLLECTIVE / REGISTRATION</span><span>LEARN → BUILD → COLLABORATE → SHIP</span></footer>
      </div>
      <MentorAccessModal open={mentorAccessOpen} onClose={() => setMentorAccessOpen(false)} />
    </div>
  );
};

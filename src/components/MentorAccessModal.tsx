import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Mail, Send, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';

type MentorAccessModalProps = {
  open: boolean;
  onClose: () => void;
};

type ApplicationDraft = {
  name: string;
  email: string;
  college: string;
  branch: string;
  skills: string;
  experience: string;
  message: string;
};

const INITIAL_DRAFT: ApplicationDraft = {
  name: '',
  email: '',
  college: '',
  branch: '',
  skills: '',
  experience: '',
  message: '',
};

const APPLICATION_EMAIL = (import.meta.env.VITE_MENTOR_APPLICATION_EMAIL as string | undefined)?.trim() || '';

export const MentorAccessModal: React.FC<MentorAccessModalProps> = ({ open, onClose }) => {
  const [view, setView] = useState<'gate' | 'application'>('gate');
  const [draft, setDraft] = useState<ApplicationDraft>(INITIAL_DRAFT);
  const [resumeName, setResumeName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setView('gate');
    setNotice(null);
    setResumeName('');
    setDraft(INITIAL_DRAFT);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const updateDraft = (field: keyof ApplicationDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const openApplication = () => {
    setNotice(null);
    setView('application');
  };

  const handleResume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setResumeName('');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setResumeName('');
      setNotice('Please choose your resume as a PDF file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeName('');
      setNotice('Please keep the resume under 5 MB.');
      event.target.value = '';
      return;
    }
    setNotice(null);
    setResumeName(file.name);
  };

  const handleMail = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);

    if (!APPLICATION_EMAIL) {
      setNotice('Developer contact email is not configured on this build yet. Please contact the DevCollective developer directly.');
      return;
    }

    if (!draft.name.trim() || !draft.email.trim() || !draft.skills.trim()) {
      setNotice('Please complete your name, email, and skills before preparing the application.');
      return;
    }

    const subject = `Mentor Application — ${draft.name.trim()}`;
    const body = [
      'Hello DevCollective Developer Team,',
      '',
      'I would like to apply to become a DevCollective mentor.',
      '',
      `Name: ${draft.name.trim()}`,
      `Email: ${draft.email.trim()}`,
      `College: ${draft.college.trim() || 'Not provided'}`,
      `Branch: ${draft.branch.trim() || 'Not provided'}`,
      `Skills: ${draft.skills.trim()}`,
      `Experience: ${draft.experience.trim() || 'Not provided'}`,
      '',
      'Why I want to mentor / additional information:',
      draft.message.trim() || 'Not provided',
      '',
      `Resume: ${resumeName || 'Please attach my resume PDF before sending.'}`,
      '',
      'Thank you,',
      draft.name.trim(),
    ].join('\n');

    const mailto = `mailto:${encodeURIComponent(APPLICATION_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setNotice('Your email client should open with the application pre-filled. Please attach the selected resume PDF before pressing Send.');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="mentor-access-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-outline-variant bg-surface dc-hard-shadow">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-outline-variant bg-surface px-5 py-4 sm:px-7">
          <div>
            <p className="dc-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">DEVCOLLECTIVE / ACCESS CONTROL</p>
            <h2 id="mentor-access-title" className="dc-display text-2xl sm:text-3xl mt-1">MENTOR ACCESS.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close mentor access dialog" className="p-2 border-2 border-outline-variant hover:bg-dc-pink transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {view === 'gate' ? (
          <div className="p-6 sm:p-8 space-y-7">
            <div className="flex gap-4 p-4 sm:p-5 bg-dc-yellow border-2 border-outline-variant text-[#171717]">
              <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <p className="dc-mono text-[10px] uppercase tracking-[0.16em] font-bold">MENTOR REGISTRATION IS REVIEWED</p>
                <p className="mt-2 text-sm leading-relaxed">Mentor accounts are not created directly from the public registration flow. We review mentor applicants before granting mentor access.</p>
              </div>
            </div>

            <div>
              <p className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">SELECT A PATH</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                <button type="button" onClick={openApplication} className="text-left border-2 border-outline-variant bg-background hover:bg-dc-mint p-5 transition-colors dc-hard-shadow-sm">
                  <div className="flex items-start justify-between gap-4"><Mail className="w-5 h-5" /><ArrowRight className="w-5 h-5" /></div>
                  <div className="mt-8 dc-display text-2xl">CONTACT DEVELOPER.</div>
                  <p className="mt-2 text-sm text-on-surface-variant">Send your profile, skills, experience, and resume for an interview/review.</p>
                </button>

                <button type="button" onClick={() => setNotice('Assessment flow is planned and will be enabled here in a future release.')} className="text-left border-2 border-outline-variant bg-background hover:bg-dc-blue p-5 transition-colors dc-hard-shadow-sm">
                  <div className="flex items-start justify-between gap-4"><Sparkles className="w-5 h-5" /><span className="dc-mono text-[8px] uppercase tracking-[0.12em] border-2 border-outline-variant px-2 py-1">COMING SOON</span></div>
                  <div className="mt-8 dc-display text-2xl">TAKE ASSESSMENT.</div>
                  <p className="mt-2 text-sm text-on-surface-variant">The mentor assessment route will be added here when the assessment is ready.</p>
                </button>
              </div>
            </div>

            {notice && <div className="p-4 bg-dc-blue border-2 border-outline-variant text-xs dc-mono" role="status">{notice}</div>}

            <div className="border-t-2 border-outline-variant pt-5 flex items-center gap-3 text-xs text-on-surface-variant"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>Students and regular users can continue with the normal account flow without mentor approval.</span></div>
          </div>
        ) : (
          <form onSubmit={handleMail} className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3"><button type="button" onClick={() => setView('gate')} className="inline-flex items-center gap-2 dc-mono text-[9px] uppercase tracking-[0.14em] hover:text-primary"><ArrowLeft className="w-4 h-4" /> Back</button><span className="text-on-surface-variant">/</span><span className="dc-mono text-[9px] uppercase tracking-[0.14em]">APPLICATION</span></div>

            <div className="p-4 sm:p-5 bg-dc-mint border-2 border-outline-variant text-[#171717]">
              <div className="flex items-start gap-3"><FileText className="w-5 h-5 shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">Fill this in once, then we will prepare a message to the DevCollective developer. Your selected resume is referenced in the email, so attach the PDF in your mail client before sending.</p></div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                ['name', 'Full Name', 'Your name'],
                ['email', 'Email Address', 'you@example.com'],
                ['college', 'College', 'Institute / university'],
                ['branch', 'Branch', 'Computer Science'],
              ].map(([field, label, placeholder]) => (
                <div key={field} className="space-y-2">
                  <label className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">{label}</label>
                  <input value={draft[field as keyof ApplicationDraft]} onChange={(event) => updateDraft(field as keyof ApplicationDraft, event.target.value)} placeholder={placeholder} className="w-full bg-background border-2 border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary" required={field === 'name' || field === 'email'} />
                </div>
              ))}
              <div className="space-y-2 sm:col-span-2">
                <label className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">Skills</label>
                <input value={draft.skills} onChange={(event) => updateDraft('skills', event.target.value)} placeholder="React, Node.js, Python, system design..." className="w-full bg-background border-2 border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">Mentoring / Technical Experience</label>
                <textarea value={draft.experience} onChange={(event) => updateDraft('experience', event.target.value)} placeholder="Projects, internships, open source, teaching, leadership..." rows={4} className="w-full bg-background border-2 border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary resize-y" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">Why do you want to mentor?</label>
                <textarea value={draft.message} onChange={(event) => updateDraft('message', event.target.value)} placeholder="Tell the developer team what you can contribute to the collective." rows={4} className="w-full bg-background border-2 border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary resize-y" />
              </div>
            </div>

            <div className="border-2 border-dashed border-outline-variant bg-background p-5">
              <div className="flex items-start gap-4">
                <Upload className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Resume PDF</p>
                  <p className="text-xs text-on-surface-variant mt-1">PDF only, up to 5 MB.</p>
                  <label className="inline-flex items-center gap-2 mt-4 border-2 border-outline-variant bg-surface px-4 py-2.5 text-xs font-bold uppercase cursor-pointer hover:bg-dc-blue transition-colors"><Upload className="w-4 h-4" /> Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={handleResume} className="hidden" /></label>
                  {resumeName && <p className="mt-3 text-xs dc-mono flex items-center gap-2"><FileText className="w-4 h-4" /> {resumeName}</p>}
                </div>
              </div>
            </div>

            {notice && <div className="p-4 bg-dc-pink border-2 border-outline-variant text-xs dc-mono" role="alert">{notice}</div>}

            <div className="border-t-2 border-outline-variant pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-on-surface-variant">The browser cannot attach your local file automatically to a mail client. We will pre-fill the email; attach the PDF before sending.</p>
              <button type="submit" className="shrink-0 inline-flex items-center justify-center gap-3 bg-primary text-on-primary border-2 border-outline-variant px-6 py-4 font-bold uppercase dc-hard-shadow-sm"><Send className="w-4 h-4" /> Prepare Email</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

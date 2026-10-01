import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Building2, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const FacultyRegisterPage: React.FC = () => {
  const { setActiveTab, registerFaculty } = useAuth();
  const [inviteToken, setInviteToken] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('');
  const [subjects, setSubjects] = useState('');
  const [expertise, setExpertise] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [mentoringAreas, setMentoringAreas] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('invite');
    if (token) setInviteToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!inviteToken) return setError('A valid faculty invitation link is required.');
    if (!fullName || !inviteEmail || !employeeId || !department || !designation || !password) {
      return setError('Please complete all required fields.');
    }
    if (password.length < 6) return setError('Password must be at least 6 characters long.');

    setLoading(true);
    try {
      await registerFaculty({
        inviteToken,
        email: inviteEmail,
        name: fullName,
        employeeId,
        department,
        designation,
        phone,
        subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
        expertise: expertise.split(',').map((s) => s.trim()).filter(Boolean),
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        mentoringAreas: mentoringAreas.split(',').map((s) => s.trim()).filter(Boolean),
        bio,
        password,
      });
      setMessage('Faculty registration submitted. Your account is pending admin approval.');
    } catch (err: any) {
      setError(err.message || 'Faculty registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl bg-surface-container border-2 border-outline-variant rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 border border-secondary/30 rounded-full text-secondary font-label-mono text-[10px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Invitation-only faculty access
          </div>
          <div className="flex items-start gap-4 mt-5">
            <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="font-headline-lg text-3xl font-bold text-white">Faculty Registration</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Complete your faculty profile using the invitation issued by a DevCollective administrator.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-tertiary/10 border-2 border-tertiary/40 rounded-xl flex items-center gap-3 text-tertiary text-xs font-label-mono">
            <CheckCircle2 className="w-5 h-5" /><span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border-2 border-error/50 rounded-xl flex items-center gap-3 text-error text-xs font-label-mono">
            <AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              ['Full Name', fullName, setFullName, 'Dr. Jane Doe', 'text'],
              ['Official College Email', inviteEmail, setInviteEmail, 'faculty@college.edu', 'email'],
              ['Faculty / Employee ID', employeeId, setEmployeeId, 'FAC-001', 'text'],
              ['Phone Number', phone, setPhone, '+91...', 'tel'],
              ['Department', department, setDepartment, 'Computer Science & Engineering', 'text'],
              ['Designation', designation, setDesignation, 'Assistant Professor', 'text'],
              ['Subjects (comma separated)', subjects, setSubjects, 'DBMS, Networks, OS', 'text'],
              ['Expertise (comma separated)', expertise, setExpertise, 'Web Development, AI/ML', 'text'],
              ['Mentoring Areas (comma separated)', mentoringAreas, setMentoringAreas, 'Projects, Placements, Research', 'text'],
              ['Years of Experience', yearsExperience, setYearsExperience, '8', 'number'],
            ].map(([label, value, setter, placeholder, type]) => (
              <div key={label} className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">{label}</label>
                <input
                  type={type as string}
                  value={value as string}
                  onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                  placeholder={placeholder as string}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-all"
                  required={['Full Name','Official College Email','Faculty / Employee ID','Department','Designation'].includes(label as string)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Professional Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your teaching, research, and mentoring interests."
              rows={4}
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="font-label-mono text-xs uppercase text-on-surface-variant">Account Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 pr-11 text-white focus:outline-none focus:border-secondary transition-all"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-8 text-outline hover:text-white">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
            <p className="font-label-mono text-[10px] uppercase text-outline">Approval flow</p>
            <p className="text-sm text-on-surface-variant mt-1">Invitation → email verification → profile submission → admin approval → faculty access.</p>
          </div>

          <button
            disabled={loading || Boolean(message)}
            className="w-full py-4 bg-gradient-to-r from-primary-container to-secondary-container text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Faculty Profile...' : 'Submit Faculty Registration'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button type="button" onClick={() => setActiveTab('login')} className="w-full text-sm text-on-surface-variant hover:text-white">
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

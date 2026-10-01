import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, School, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { setActiveTab, registerUser, triggerOAuthLogin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeName, setCollegeName] = useState('Institute of Technology');
  const [branch, setBranch] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !email || !password) return setError('Please fill in all required fields.');
    if (password.length < 6) return setError('Password must be at least 6 characters long.');
    setLoading(true);
    try {
      await registerUser({ name: fullName, email, password, role: 'student', college: collegeName, branch, academicYear });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-2xl bg-background">
        <div className="space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="font-headline-lg text-3xl font-bold text-white">Create Student Account</h2>
            <p className="font-body-md text-sm text-on-surface-variant">Join DevCollective and start building your reputation.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-error/10 border-2 border-error/50 rounded-xl flex items-center gap-3 text-error text-xs font-label-mono">
                <AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
              </div>
            )}

            <div className="p-5 rounded-2xl border-2 border-primary bg-primary-container/10 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
                <School className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className="font-label-mono text-xs uppercase text-white font-bold block">Student</span>
                <span className="text-xs text-on-surface-variant">Learn, build, contribute, and earn REP.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="John Doe" required />
              <Field label="Email Address" value={email} onChange={setEmail} placeholder="john@example.com" type="email" required />
              <div className="space-y-1.5 relative">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Password</label>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-secondary transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-on-surface-variant hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Field label="College Name" value={collegeName} onChange={setCollegeName} placeholder="Institute of Technology" required />
              <Field label="Branch" value={branch} onChange={setBranch} placeholder="Computer Science" />
              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Academic Year</label>
                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-all">
                  <option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option><option value="Postgrad">Postgrad</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary-container via-inverse-primary to-secondary-container text-white font-bold text-base py-4 rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <span>{loading ? 'Creating Account...' : 'Create Student Account'}</span><ArrowRight className="w-5 h-5" />
            </button>

            <div className="text-center text-xs text-on-surface-variant">
              Are you faculty?{' '}
              <button type="button" onClick={() => setActiveTab('faculty-register')} className="text-secondary font-bold hover:underline">
                Use Faculty Registration
              </button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-4 font-label-mono text-xs text-on-surface-variant uppercase">Or register with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => triggerOAuthLogin('google')} className="h-12 border-2 border-outline-variant rounded-xl font-label-mono text-xs uppercase font-bold text-white hover:bg-surface-container transition-all">Google</button>
              <button type="button" onClick={() => triggerOAuthLogin('github')} className="h-12 border-2 border-outline-variant rounded-xl font-label-mono text-xs uppercase font-bold text-white hover:bg-surface-container transition-all">GitHub</button>
            </div>
          </form>

          <p className="text-center font-body-md text-sm text-on-surface-variant">Already have an account?{' '}
            <button onClick={() => setActiveTab('login')} className="text-primary font-bold hover:underline ml-1">Log In</button>
          </p>
        </div>
      </section>
    </div>
  );
};

const Field: React.FC<{label:string; value:string; onChange:(v:string)=>void; placeholder:string; type?:string; required?:boolean}> = ({label,value,onChange,placeholder,type='text',required}) => (
  <div className="space-y-1.5">
    <label className="font-label-mono text-xs uppercase text-on-surface-variant">{label}</label>
    <input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-all" />
  </div>
);

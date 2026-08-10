import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ArrowLeft, ArrowRight, School, Brain, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { setActiveTab, registerUser, triggerOAuthLogin } = useAuth();

  const [role, setRole] = useState<UserRole>('student');
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

    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: fullName,
        email,
        password,
        role,
        college: collegeName,
        branch,
        academicYear,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Top Nav Button */}
      <button
        onClick={() => setActiveTab('landing')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 font-label-mono text-xs uppercase text-on-surface-variant hover:text-primary transition-colors bg-surface-container/80 px-4 py-2 rounded-full border border-outline-variant backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Left Panel (40%) */}
      <section className="hidden md:flex md:w-[40%] bg-surface-container-lowest border-r-2 border-outline-variant relative flex-col justify-center px-12 lg:px-16 overflow-hidden">
        <div className="relative z-10 space-y-8">
          <div className="w-full aspect-[4/3] rounded-2xl border-2 border-outline-variant overflow-hidden bg-surface-container">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&auto=format&fit=crop&q=80"
              alt="Community network"
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          <div className="space-y-3">
            <h1 className="font-headline-lg text-3xl lg:text-4xl font-bold text-white">Join the Community</h1>
            <p className="font-body-lg text-base text-on-surface-variant max-w-sm">
              Create your account and start building your developer journey alongside peers and mentors.
            </p>
          </div>
        </div>
      </section>

      {/* Right Panel (60%) */}
      <section className="flex-1 bg-background flex items-center justify-center py-20 px-4 sm:px-8 md:px-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="font-headline-lg text-3xl font-bold text-white">Create Account</h2>
            <p className="font-body-md text-sm text-on-surface-variant">
              Join thousands of student developers & mentors worldwide.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-error/10 border-2 border-error/50 rounded-xl flex items-center gap-3 text-error text-xs font-label-mono">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label
                onClick={() => setRole('student')}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                  role === 'student'
                    ? 'border-primary bg-primary-container/10 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                    : 'border-outline-variant bg-surface-container-low hover:border-outline'
                }`}
              >
                <School className="w-8 h-8 text-primary mb-2" />
                <span className="font-label-mono text-xs uppercase text-white font-bold block mb-1">
                  Student
                </span>
                <span className="text-[11px] text-on-surface-variant">Learn & Build</span>
              </label>

              <label
                onClick={() => setRole('mentor')}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                  role === 'mentor'
                    ? 'border-tertiary bg-tertiary-container/10 shadow-[0_0_15px_rgba(74,225,118,0.3)]'
                    : 'border-outline-variant bg-surface-container-low hover:border-outline'
                }`}
              >
                <Brain className="w-8 h-8 text-tertiary mb-2" />
                <span className="font-label-mono text-xs uppercase text-white font-bold block mb-1">
                  Mentor
                </span>
                <span className="text-[11px] text-on-surface-variant">Guide & Review</span>
              </label>

              <label
                onClick={() => setRole('faculty')}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                  role === 'faculty'
                    ? 'border-secondary bg-secondary-container/10 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'border-outline-variant bg-surface-container-low hover:border-outline'
                }`}
              >
                <Building2 className="w-8 h-8 text-secondary mb-2" />
                <span className="font-label-mono text-xs uppercase text-white font-bold block mb-1">
                  Faculty
                </span>
                <span className="text-[11px] text-on-surface-variant">Manage Tracks</span>
              </label>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-white focus:outline-none focus:border-secondary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-white focus:outline-none focus:border-secondary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-white focus:outline-none focus:border-secondary transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-on-surface-variant hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">College Name</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="Institute of Technology"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-white focus:outline-none focus:border-secondary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-white focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">Academic Year</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-white focus:outline-none focus:border-secondary transition-all"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgrad">Postgrad</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-container via-inverse-primary to-secondary-container text-white font-bold text-base py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account & Continue'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* OAuth Buttons */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 font-label-mono text-xs text-on-surface-variant uppercase">
                  Or register with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => triggerOAuthLogin('google')}
                className="flex items-center justify-center gap-2.5 h-12 border-2 border-outline-variant rounded-xl hover:bg-surface-container font-label-mono text-xs uppercase font-bold text-white transition-all active:scale-95"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => triggerOAuthLogin('github')}
                className="flex items-center justify-center gap-2.5 h-12 border-2 border-outline-variant rounded-xl hover:bg-surface-container font-label-mono text-xs uppercase font-bold text-white transition-all active:scale-95"
              >
                <span>GitHub</span>
              </button>
            </div>
          </form>

          <p className="text-center font-body-md text-sm text-on-surface-variant">
            Already have an account?{' '}
            <button
              onClick={() => setActiveTab('login')}
              className="text-primary font-bold hover:underline ml-1"
            >
              Log In
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};

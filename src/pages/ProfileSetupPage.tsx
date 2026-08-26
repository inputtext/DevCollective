import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Check, X, ArrowLeft, UploadCloud, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

interface ExtractedResumeData {
  branch: string;
  academicYear: string;
  bio: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string;
  confidence?: string;
}

export const ProfileSetupPage: React.FC = () => {
  const { user, updateProfile, setActiveTab } = useAuth();

  const [branch, setBranch] = useState(user?.branch || 'Computer Science');
  const [academicYear, setAcademicYear] = useState(user?.academicYear || 'Third Year');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || 'https://github.com/kanojiyapk');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || 'https://linkedin.com/in/student-developer');
  const [skills, setSkills] = useState<string[]>(user?.skills || ['React', 'Node.js', 'Python', 'TypeScript']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [bio, setBio] = useState(user?.bio || 'Passionate student developer building AI and web applications.');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Resume auto-fill state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [appliedFromResume, setAppliedFromResume] = useState(false);
  const [resumeNote, setResumeNote] = useState<string | null>(null);

  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF resume.');
      return;
    }

    setResumeFileName(file.name);
    setResumeError(null);
    setAppliedFromResume(false);
    setIsParsingResume(true);

    try {
      const token = localStorage.getItem('devcollective_token');
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse resume.');
      }

      const extracted: ExtractedResumeData = data.extracted;

      // Auto-fill the form. User can still review and edit every field before saving.
      if (extracted.branch) setBranch(extracted.branch);
      if (extracted.academicYear) setAcademicYear(extracted.academicYear);
      if (extracted.bio) setBio(extracted.bio.slice(0, 250));
      if (extracted.githubUrl) setGithubUrl(extracted.githubUrl);
      if (extracted.linkedinUrl) setLinkedinUrl(extracted.linkedinUrl);
      if (extracted.skills && extracted.skills.length > 0) {
        setSkills((prev) => Array.from(new Set([...extracted.skills])));
      }

      setResumeNote(extracted.confidence || null);
      setAppliedFromResume(true);
    } catch (err: any) {
      setResumeError(err.message || 'Something went wrong reading that resume.');
    } finally {
      setIsParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile({
      branch,
      academicYear,
      githubUrl,
      linkedinUrl,
      skills,
      bio,
    });

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => {
      setActiveTab('profile');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pt-20">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center h-20 px-6 md:px-10 bg-background/70 backdrop-blur-xl border-b-2 border-outline-variant">
        <div className="flex items-center gap-6">
          <span className="font-headline-md text-xl font-bold text-white tracking-tighter">
            DEV_COLLECTIVE
          </span>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="hidden sm:flex items-center gap-2 font-label-mono text-xs uppercase text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </nav>

      <main className="flex-grow flex p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-headline-md text-3xl font-bold text-white">Profile Setup</h2>
              <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">Step 2 of 3</p>
            </div>
            <div className="w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[65%]" />
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl border-2 border-outline-variant p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer">
                  <div className="w-28 h-28 rounded-full border-2 border-outline-variant bg-surface-container-low flex flex-col items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-on-surface-variant mb-1 group-hover:text-primary" />
                        <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">
                          Upload Photo
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Resume Auto-Fill */}
              <div className="space-y-2">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Auto-fill from Resume
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeSelect}
                  className="hidden"
                  id="resume-upload-input"
                />
                <label
                  htmlFor="resume-upload-input"
                  className={`flex items-center justify-between gap-3 w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    appliedFromResume
                      ? 'border-tertiary/50 bg-tertiary-container/10'
                      : 'border-outline-variant hover:border-primary bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isParsingResume ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                    ) : appliedFromResume ? (
                      <Check className="w-5 h-5 text-tertiary shrink-0" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-on-surface-variant shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {isParsingResume
                          ? 'Reading your resume...'
                          : resumeFileName
                          ? resumeFileName
                          : 'Upload your resume (PDF)'}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {appliedFromResume
                          ? 'Fields below were filled in. Review and edit before saving.'
                          : 'AI will read it and fill in your skills, bio, and links.'}
                      </p>
                    </div>
                  </div>
                  <span className="font-label-mono text-[10px] uppercase text-primary shrink-0">
                    {resumeFileName ? 'Replace' : 'Choose file'}
                  </span>
                </label>

                {resumeError && (
                  <p className="flex items-center gap-1.5 text-xs text-error">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {resumeError}
                  </p>
                )}
                {resumeNote && !resumeError && (
                  <p className="text-[11px] text-on-surface-variant italic">{resumeNote}</p>
                )}
              </div>

              {/* Academic Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                    Branch of Study
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3.5 font-body-md text-white focus:border-secondary outline-none transition-all"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Software Engineering">Software Engineering</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                    Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3.5 font-body-md text-white focus:border-secondary outline-none transition-all"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Post-Graduate">Post-Graduate</option>
                  </select>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                  External Profiles
                </label>
                <div className="space-y-3">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-label-mono text-xs text-on-surface-variant">
                      GITHUB
                    </span>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full pl-24 pr-4 py-3.5 bg-surface-container-lowest border-2 border-outline-variant rounded-xl font-body-md text-white focus:border-secondary outline-none transition-all text-sm"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-label-mono text-xs text-on-surface-variant">
                      LINKEDIN
                    </span>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-24 pr-4 py-3.5 bg-surface-container-lowest border-2 border-outline-variant rounded-xl font-body-md text-white focus:border-secondary outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                  Skills & Tech Stack
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-surface-container-lowest border-2 border-outline-variant rounded-xl min-h-[56px] items-center">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 bg-primary-container/20 text-primary font-label-mono text-xs py-1 px-3 rounded-full border border-primary/30"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Add skill (press Enter)..."
                    className="bg-transparent border-none focus:outline-none text-xs text-white p-1 flex-1 min-w-[120px]"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-label-mono text-xs uppercase text-on-surface-variant">
                    Tell us about yourself
                  </label>
                  <span className="font-label-mono text-[10px] text-on-surface-variant">
                    {bio.length}/250
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 250))}
                  rows={3}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3.5 font-body-md text-white focus:border-secondary outline-none transition-all text-sm resize-none"
                  placeholder="Describe your interests, goals, or current projects..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 font-bold text-base py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${
                    isSaved
                      ? 'bg-tertiary-container text-white'
                      : 'bg-primary-container text-white hover:brightness-110 active:scale-95'
                  }`}
                >
                  {isSaved ? <Check className="w-5 h-5" /> : isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  <span>{isSaved ? 'SAVED' : isSaving ? 'SAVING...' : 'COMPLETE PROFILE'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('choose-path')}
                  className="px-6 bg-transparent border-2 border-outline-variant text-on-surface font-label-mono text-xs uppercase py-4 rounded-xl hover:bg-surface-container-highest transition-all"
                >
                  SKIP FOR NOW
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

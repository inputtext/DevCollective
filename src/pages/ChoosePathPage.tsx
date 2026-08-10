import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Code,
  Brain,
  Cloud,
  Shield,
  Smartphone,
  Database,
  Gamepad,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Lock,
} from 'lucide-react';

export const ChoosePathPage: React.FC = () => {
  const { user, updateProfile, setActiveTab } = useAuth();
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    user?.selectedDomains || ['Software Dev', 'AI/ML']
  );

  const domains = [
    {
      id: 'Software Dev',
      icon: <Code className="w-8 h-8 text-primary" />,
      title: 'Software Dev',
      pathsCount: '12 Paths',
      desc: 'Master full-stack architectures, algorithms, and scalable system design.',
      tag: 'High Demand',
      color: 'primary',
    },
    {
      id: 'AI/ML',
      icon: <Brain className="w-8 h-8 text-secondary" />,
      title: 'AI/ML',
      pathsCount: '8 Paths',
      desc: 'Dive into neural networks, LLMs, and data engineering at scale.',
      tag: 'AI Recommended',
      color: 'secondary',
    },
    {
      id: 'Cloud/DevOps',
      icon: <Cloud className="w-8 h-8 text-tertiary" />,
      title: 'Cloud/DevOps',
      pathsCount: '15 Paths',
      desc: 'Master Kubernetes, AWS, Docker, and modern CI/CD automation pipelines.',
      color: 'tertiary',
    },
    {
      id: 'Cyber Security',
      icon: <Shield className="w-8 h-8 text-error" />,
      title: 'Cyber Security',
      pathsCount: '6 Paths',
      desc: 'From ethical hacking to secure system architecture and defense.',
      color: 'error',
    },
    {
      id: 'Mobile',
      icon: <Smartphone className="w-8 h-8 text-primary" />,
      title: 'Mobile Dev',
      pathsCount: '10 Paths',
      desc: 'Build native and cross-platform apps with Swift, Kotlin, and Flutter.',
      color: 'primary',
    },
    {
      id: 'Data',
      icon: <Database className="w-8 h-8 text-secondary" />,
      title: 'Data Science',
      pathsCount: '7 Paths',
      desc: 'Uncover insights through advanced analytics and visual storytelling.',
      color: 'secondary',
    },
    {
      id: 'Game Dev',
      icon: <Gamepad className="w-8 h-8 text-tertiary" />,
      title: 'Game Dev',
      pathsCount: '9 Paths',
      desc: 'Create immersive 3D worlds using Unreal Engine, Unity, and C++.',
      color: 'tertiary',
    },
  ];

  const toggleDomain = (id: string) => {
    if (selectedDomains.includes(id)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== id));
    } else {
      setSelectedDomains([...selectedDomains, id]);
    }
  };

  const handleFinish = () => {
    updateProfile({ selectedDomains });
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pt-20 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10 space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-label-mono text-xs text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Step 3 of 3
          </span>
          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full w-full bg-primary" />
          </div>
        </div>
        <h1 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white">
          Choose Your Learning Path
        </h1>
        <p className="font-body-lg text-base text-on-surface-variant max-w-2xl">
          Select one or more domains you'd like to master. We'll tailor your curriculum and project track based on these interests.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Domain Cards Grid */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {domains.map((dom) => {
            const isSelected = selectedDomains.includes(dom.id);
            return (
              <div
                key={dom.id}
                onClick={() => toggleDomain(dom.id)}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-primary bg-primary-container/10 shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                    : 'border-outline-variant bg-surface-container-low hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  {dom.icon}
                  <span className="font-label-mono text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded border border-outline-variant">
                    {dom.pathsCount}
                  </span>
                </div>
                <h3 className="font-headline-md text-xl font-bold text-white mb-2">{dom.title}</h3>
                <p className="text-on-surface-variant text-xs sm:text-sm mb-4 leading-relaxed">
                  {dom.desc}
                </p>
                {dom.tag && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-label-mono text-[10px] text-primary uppercase font-bold">
                      {dom.tag}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Info */}
        <div className="xl:col-span-4 space-y-6 sticky top-24">
          {/* Selected Summary */}
          <div className="border-2 border-primary/30 rounded-2xl p-6 bg-surface-container/80 backdrop-blur-md">
            <h4 className="font-label-mono text-xs uppercase tracking-widest text-primary font-bold mb-4">
              Selected Domains ({selectedDomains.length})
            </h4>

            <div className="space-y-2 mb-6">
              {selectedDomains.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline-variant text-sm text-white"
                >
                  <span>{d}</span>
                  <button onClick={() => toggleDomain(d)} className="text-outline hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-secondary-container/10 border border-secondary/30 rounded-xl mb-6">
              <div className="flex items-center gap-2 mb-1 text-secondary font-label-mono text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>AI Recommendation</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Based on your interest in <strong className="text-white">AI/ML & Python</strong>, we recommend starting with the <strong className="text-primary">Deep Learning Fundamentals</strong> track.
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={selectedDomains.length === 0}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl text-base hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Continue to Mission Control</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Roadmap Timeline Preview */}
          <div className="border-2 border-outline-variant rounded-2xl p-6 bg-surface-container-low">
            <h4 className="font-label-mono text-xs uppercase tracking-widest text-outline mb-4">
              Your Journey
            </h4>
            <div className="relative pl-6 space-y-5 border-l-2 border-outline-variant text-xs">
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="font-bold text-white">Account Created</p>
                <p className="text-[10px] text-outline">Completed</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="font-bold text-white">Profile Configured</p>
                <p className="text-[10px] text-outline">Completed</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-primary ring-4 ring-primary/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </div>
                <p className="font-bold text-primary">Domain Selection</p>
                <p className="text-[10px] text-primary">In Progress</p>
              </div>

              <div className="relative opacity-40">
                <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-outline-variant flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-outline" />
                </div>
                <p className="font-bold text-white">First Capstone Project</p>
                <p className="text-[10px] text-outline">Locked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

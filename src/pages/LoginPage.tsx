import React from 'react';
import { SignIn } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { setActiveTab, authRedirectError, clearAuthRedirectError } = useAuth();

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pt-20">
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-10 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.75fr)] gap-12 lg:gap-20 items-start">
          <section className="lg:sticky lg:top-28">
            <p className="dc-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              01 / AUTHENTICATION
            </p>
            <h1 className="dc-display text-5xl sm:text-6xl lg:text-7xl leading-[0.9]">
              ENTER THE<br />
              <span className="text-primary">COLLECTIVE.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-on-surface-variant max-w-lg">
              Sign in to continue your learning path, projects, collaborations, and developer progress.
            </p>

            <div className="hidden lg:block mt-12 border-t-2 border-outline-variant pt-5">
              <div className="flex items-center justify-between gap-6">
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                  AUTH / CLERK
                </span>
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                  SECURE SESSION
                </span>
              </div>
            </div>
          </section>

          <section className="w-full max-w-xl lg:justify-self-end">
            {authRedirectError && (
              <div className="mb-6 p-4 bg-error-container border-2 border-outline-variant flex items-center gap-3 text-on-error text-xs dc-mono">
                <span className="flex-1">{authRedirectError}</span>
                <button type="button" onClick={clearAuthRedirectError} aria-label="Dismiss error">
                  ✕
                </button>
              </div>
            )}

            <div className="border-2 border-outline-variant bg-surface p-5 sm:p-7 dc-hard-shadow">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-outline-variant">
                <span className="dc-mono text-[10px] uppercase tracking-[0.16em]">SIGN IN / 01</span>
                <span className="dc-status-dot" aria-label="Authentication service ready" />
              </div>

              <SignIn
                routing="virtual"
                signUpUrl="/"
                fallbackRedirectUrl="/"
                appearance={{
                  variables: {
                    colorPrimary: '#B9D7FF',
                    colorText: '#171717',
                    colorTextSecondary: '#55504A',
                    colorBackground: '#FFF9F0',
                    colorInputBackground: '#FFF9F0',
                    colorInputText: '#171717',
                    borderRadius: '0px',
                    fontFamily: 'Inter, sans-serif',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'w-full shadow-none border-0 bg-transparent p-0',
                    headerTitle: 'font-black uppercase tracking-tight',
                    headerSubtitle: 'text-sm',
                    formFieldLabel: 'font-mono uppercase tracking-[0.14em] text-[10px]',
                    formFieldInput: 'border-2 border-[#171717] rounded-none bg-[#FFF9F0] min-h-12 shadow-none',
                    formButtonPrimary: 'border-2 border-[#171717] rounded-none bg-[#B9D7FF] text-[#171717] shadow-[5px_5px_0_#171717] uppercase font-black',
                    footerActionLink: 'text-[#171717] underline font-bold',
                    socialButtonsBlockButton: 'border-2 border-[#171717] rounded-none bg-[#FFF9F0] shadow-none uppercase font-mono text-[10px]',
                    dividerLine: 'bg-[#171717]',
                    dividerText: 'font-mono uppercase text-[9px] tracking-[0.14em] text-[#55504A]',
                    identityPreviewEditButton: 'text-[#171717] underline',
                  },
                }}
              />
            </div>

            <div className="mt-6 border-2 border-outline-variant bg-dc-mint p-4 flex items-center justify-between gap-4">
              <div>
                <p className="dc-mono text-[9px] uppercase tracking-[0.16em] mb-1">NEW TO THE COLLECTIVE?</p>
                <p className="text-sm font-semibold">Create your DevCollective profile.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="shrink-0 border-2 border-outline-variant bg-surface px-4 py-3 dc-mono text-[10px] uppercase font-bold dc-hard-shadow-sm hover:bg-dc-yellow transition-colors"
              >
                Register
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

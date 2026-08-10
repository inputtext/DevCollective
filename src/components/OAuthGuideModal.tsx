import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, ExternalLink, Check, Copy, Sparkles, X, User } from 'lucide-react';

export const OAuthGuideModal: React.FC = () => {
  const { showOAuthModal, setShowOAuthModal, oauthProviderToSimulate, simulateOAuthSuccess, oauthInfo } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customName, setCustomName] = useState('Piyush Kanojiya');
  const [customEmail, setCustomEmail] = useState('kanojiyapk524@gmail.com');

  if (!showOAuthModal) return null;

  const providerName = oauthProviderToSimulate === 'google' ? 'Google' : 'GitHub';
  const callbackUrl = oauthInfo
    ? oauthProviderToSimulate === 'google'
      ? oauthInfo.googleCallbackUrl
      : oauthInfo.githubCallbackUrl
    : `${window.location.origin}/api/auth/${oauthProviderToSimulate}/callback`;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmLogin = () => {
    if (oauthProviderToSimulate) {
      simulateOAuthSuccess(oauthProviderToSimulate, {
        name: customName,
        email: customEmail,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-surface-container border-2 border-outline-variant rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden animate-fade-in">
        <button
          onClick={() => setShowOAuthModal(false)}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-white p-2 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-label-mono text-xs uppercase tracking-widest text-primary">
              {providerName} OAuth Sandbox & Guide
            </span>
            <h3 className="font-headline-md text-2xl font-bold text-white">
              Authenticate with {providerName}
            </h3>
          </div>
        </div>

        {/* Quick Simulator Sandbox */}
        <div className="bg-surface-container-low border-2 border-primary/30 p-5 rounded-xl mb-6 space-y-4">
          <div className="flex items-center gap-2 text-tertiary font-label-mono text-xs uppercase font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Interactive MVP Presentation Mode</span>
          </div>
          <p className="text-sm text-on-surface-variant">
            Click below to instantly complete {providerName} authentication for your college project showcase:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-label-mono text-[10px] uppercase text-outline block mb-1">
                Student Name
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-primary" />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none w-full"
                  placeholder="Your Name"
                />
              </div>
            </div>
            <div>
              <label className="font-label-mono text-[10px] uppercase text-outline block mb-1">
                College Email
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2">
                <Key className="w-4 h-4 text-secondary" />
                <input
                  type="text"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none w-full"
                  placeholder="Email"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmLogin}
            className="w-full py-3.5 bg-gradient-to-r from-primary-container to-secondary-container text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Complete {providerName} Sign In</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Real OAuth Credentials Info */}
        <div className="border-t border-outline-variant/40 pt-4 space-y-3">
          <h4 className="font-label-mono text-xs uppercase font-bold text-on-surface-variant flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <span>To connect real production OAuth keys:</span>
          </h4>
          <p className="text-xs text-on-surface-variant">
            Copy this redirect URI into your {providerName} Developer Dashboard:
          </p>

          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5">
            <input
              type="text"
              readOnly
              value={callbackUrl}
              className="bg-transparent text-xs text-secondary font-label-mono w-full outline-none"
            />
            <button
              onClick={() => handleCopy(callbackUrl, 'callback')}
              className="px-3 py-1 bg-surface-container-high border border-outline-variant hover:border-primary rounded-lg text-xs font-bold text-white flex items-center gap-1 transition-colors"
            >
              {copiedField === 'callback' ? <Check className="w-3.5 h-3.5 text-tertiary" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'callback' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-[11px] text-outline font-label-mono space-y-1">
            <p>1. Open {oauthProviderToSimulate === 'google' ? 'Google Cloud Console' : 'GitHub Developer Settings'}</p>
            <p>2. Set Authorized Redirect URI to the URL above</p>
            <p>3. Set {oauthProviderToSimulate === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID'} in .env</p>
          </div>
        </div>
      </div>
    </div>
  );
};

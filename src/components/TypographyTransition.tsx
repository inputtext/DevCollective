import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTypography } from '../context/TypographyContext';

export const TypographyTransition: React.FC = () => {
  const { changing, preset, progress } = useTypography();
  if (!changing) return null;

  return <div className="dc-type-transition-overlay" role="status" aria-live="polite" aria-label={`Loading ${preset.name} type system`}>
    <div className="dc-type-transition-grid" aria-hidden="true" />
    <div className="dc-type-transition-core">
      <div className="dc-type-transition-glyph" style={{ fontFamily: `"${preset.display}", Inter, sans-serif` }}>Aa</div>
      <div className="dc-type-transition-kicker">TYPE SYSTEM / SWITCHING</div>
      <div className="dc-type-transition-name">{preset.name}</div>
      <div className="dc-type-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="dc-type-transition-status"><Loader2 className="w-3.5 h-3.5 animate-spin" /> LOADING TYPE SYSTEM</div>
    </div>
  </div>;
};

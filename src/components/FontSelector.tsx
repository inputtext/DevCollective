import React, { useState } from 'react';
import { Check, ChevronDown, Type } from 'lucide-react';
import { useTypography } from '../context/TypographyContext';

export const FontSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { preset, presets, changing, setTypography } = useTypography();
  const [open, setOpen] = useState(false);

  return <div className={`relative w-full ${compact ? 'dc-font-selector-compact' : ''}`} data-font-selector>
    <button type="button" onClick={() => setOpen((value) => !value)} disabled={changing} aria-haspopup="menu" aria-expanded={open} aria-label="Choose platform font" className="dc-font-selector-trigger">
      <Type className="w-3.5 h-3.5 shrink-0" />
      {!compact && <><span>FONT</span><span className="dc-font-selector-current">{preset.name}</span></>}
      <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="dc-font-selector-panel" role="menu">
      <div className="dc-font-selector-heading"><div><p className="dc-mono text-[9px] uppercase tracking-[0.18em] text-primary">Type System</p><p className="text-[11px] text-on-surface-variant mt-1">Interior platform typography</p></div><span className="dc-font-selector-aa">Aa</span></div>
      <div className="dc-font-selector-options">
        {presets.map((option) => <button key={option.id} type="button" role="menuitem" disabled={changing} onClick={() => { setOpen(false); void setTypography(option.id); }} className={`dc-font-option ${preset.id === option.id ? 'is-active' : ''}`}>
          <span className="dc-font-option-copy"><span className="dc-font-option-name">{option.name}</span><span className="dc-font-option-description">{option.description}</span><span className="dc-font-option-preview" style={{ fontFamily: `"${option.display}", Inter, sans-serif` }}>The quick brown fox 012345</span></span>
          {preset.id === option.id && <Check className="w-4 h-4 shrink-0 text-primary" />}
        </button>)}
      </div>
      <div className="dc-font-selector-foot">Fonts load completely before the interface returns.</div>
    </div>}
  </div>;
};

import React from 'react';

type DcBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'blue' | 'mint' | 'yellow' | 'lavender' | 'pink';
};

export const DcBadge: React.FC<DcBadgeProps> = ({
  children,
  className = '',
  tone = 'default',
  ...props
}) => (
  <span
    className={[
      'inline-flex items-center border-2 border-outline-variant rounded-full px-2.5 py-1 font-label-mono text-[9px] uppercase font-bold',
      tone !== 'default' ? 'bg-dc-' + tone : 'bg-surface',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </span>
);

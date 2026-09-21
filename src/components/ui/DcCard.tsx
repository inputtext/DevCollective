import React from 'react';

type DcCardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  tone?: 'default' | 'blue' | 'mint' | 'yellow' | 'lavender' | 'pink';
};

export const DcCard: React.FC<DcCardProps> = ({
  children,
  className = '',
  interactive = false,
  tone = 'default',
  ...props
}) => (
  <div
    className={[
      'border-2 border-outline-variant bg-surface rounded-[var(--dc-radius-card)]',
      tone !== 'default' ? 'bg-dc-' + tone : '',
      interactive ? 'transition-transform duration-180 hover:-translate-x-0.5 hover:-translate-y-0.5' : '',
      className,
    ].filter(Boolean).join(' ')}
    {...props}
  >
    {children}
  </div>
);

import React, { useEffect, useState } from 'react';
import { FontSelector } from './FontSelector';
import { TypographyTransition } from './TypographyTransition';

const PUBLIC_MARKERS = ['dc-public'];

export const InteriorTypography: React.FC = () => {
  const [interior, setInterior] = useState(false);

  useEffect(() => {
    const detect = () => {
      const shell = document.querySelector('.dc-app-shell');
      const isPublic = PUBLIC_MARKERS.some((marker) => shell?.classList.contains(marker));
      const hasSidebar = Boolean(shell?.querySelector('aside'));
      setInterior(Boolean(shell && !isPublic && hasSidebar));
    };
    detect();
    const observer = new MutationObserver(detect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!interior) return <TypographyTransition />;
  return <><div className="dc-interior-font-control"><FontSelector /></div><TypographyTransition /></>;
};

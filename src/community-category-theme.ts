import './styles/community-category-theme.css';

const CATEGORY_STYLES: Record<string, { accent: string; soft: string; strong: string }> = {
  All: { accent: '#9FC5FF', soft: '#DCEAFF', strong: '#AFCFFF' },
  'Build in Public': { accent: '#8ED5B1', soft: '#DDF5E7', strong: '#A9E2BF' },
  Questions: { accent: '#BBA7F2', soft: '#ECE6FF', strong: '#C9BAF5' },
  Projects: { accent: '#77C995', soft: '#DCF5E3', strong: '#A2DDB5' },
  Hackathons: { accent: '#F1C96F', soft: '#FFF0C2', strong: '#F5D98A' },
  AI: { accent: '#F2A88F', soft: '#FFE4DA', strong: '#F4B9A5' },
  Android: { accent: '#86C9C7', soft: '#DCF1F0', strong: '#A5DAD8' },
};

const CATEGORY_NAMES = Object.keys(CATEGORY_STYLES);

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const applyCategoryTheme = () => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  for (const button of buttons) {
    const category = CATEGORY_NAMES.find((name) => normalize(button.textContent || '') === name);
    if (!category) continue;
    const style = CATEGORY_STYLES[category];
    button.dataset.dcCategory = category;
    button.style.setProperty('--dc-cat-accent', style.accent);
    button.style.setProperty('--dc-cat-soft', style.soft);
    button.style.setProperty('--dc-cat-strong', style.strong);
  }

  const articles = Array.from(document.querySelectorAll<HTMLElement>('article'));
  for (const article of articles) {
    const badge = Array.from(article.querySelectorAll<HTMLElement>('span')).find((span) => CATEGORY_NAMES.includes(normalize(span.textContent || '')));
    if (!badge) continue;
    const category = normalize(badge.textContent || '');
    const style = CATEGORY_STYLES[category];
    if (!style) continue;
    article.dataset.dcCommunityCategory = category;
    badge.dataset.dcCommunityCategory = category;
    const targets = [article, badge];
    for (const target of targets) {
      target.style.setProperty('--dc-cat-accent', style.accent);
      target.style.setProperty('--dc-cat-soft', style.soft);
      target.style.setProperty('--dc-cat-strong', style.strong);
    }
  }
};

let scheduled = false;
const scheduleApply = () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyCategoryTheme();
  });
};

const observer = new MutationObserver(scheduleApply);

const start = () => {
  applyCategoryTheme();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

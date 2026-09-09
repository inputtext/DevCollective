export const COLLEGE_EMAIL_DOMAIN = 'ghrietn.raisoni.net';

const ADMIN_EMAILS = new Set([
  'raat131221@gmail.com',
  'kanojiyapk524@gmail.com',
]);

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isCollegeEmail = (email: string) =>
  normalizeEmail(email).endsWith(`@${COLLEGE_EMAIL_DOMAIN}`);

export const isAdminEmail = (email: string) => ADMIN_EMAILS.has(normalizeEmail(email));

export const isAllowedPlatformEmail = (email: string) =>
  isCollegeEmail(email) || isAdminEmail(email);

export const getPlatformEmailError = () =>
  `DevCollective is limited to official G H Raisoni college accounts. Please use an email ending in @${COLLEGE_EMAIL_DOMAIN}.`;

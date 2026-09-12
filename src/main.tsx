import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import './index.css';
import './styles/reading-mode.css';
import './styles/messaging-highlights.css';
import './styles/typography-system.css';
import { ThemeProvider } from './context/ThemeContext';
import { TypographyProvider } from './context/TypographyContext';
import { SmoothScroll } from './components/SmoothScroll';
import { MessagingOverlay } from './components/MessagingOverlay';
import { InteriorTypography } from './components/InteriorTypography';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not configured. Clerk authentication will not initialize.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/"
      signUpUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <ThemeProvider>
        <TypographyProvider>
          <SmoothScroll>
            <App />
            <InteriorTypography />
            <MessagingOverlay />
          </SmoothScroll>
        </TypographyProvider>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>
);
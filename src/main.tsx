import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { SmoothScroll } from './components/SmoothScroll';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not configured. Clerk authentication will not initialize.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ThemeProvider>
        <SmoothScroll>
          <App />
        </SmoothScroll>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>
);

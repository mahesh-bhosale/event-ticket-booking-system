import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query/queryClient';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Toaster from './components/ui/sonner';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in the document');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <App />
            <Toaster richColors position="top-right" closeButton />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

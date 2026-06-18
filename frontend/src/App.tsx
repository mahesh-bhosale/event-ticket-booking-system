import AppRoutes from '@/routes/AppRoutes';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster richColors position="top-right" closeButton />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}
